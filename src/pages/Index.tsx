import { useState, useCallback } from 'react';
import { useEssayState } from '@/hooks/useEssayState';
import { Header } from '@/components/atlas/Header';
import { BlockCard } from '@/components/atlas/BlockCard';
import { ResultPanel } from '@/components/atlas/ResultPanel';
import { PasteDivideModal } from '@/components/atlas/PasteDivideModal';
import { MobileResultsBar } from '@/components/atlas/MobileResultsBar';
import { analyzeEssay, generateImprovedVersion } from '@/lib/ai';
import { toast } from 'sonner';

const Index = () => {
  const {
    state,
    updateBlockText,
    clearBlock,
    addDevelopment,
    removeDevelopment,
    setBlockAnalysis,
    setCompetencies,
    setTotalScore,
    setImprovedVersion,
    toggleShowOriginal,
    applyDividedText,
    analysisProgress,
    analyzedBlockCount,
    totalBlockCount,
    canGenerateImproved,
    estimatedScore,
  } = useEssayState();
  
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [isGeneratingImproved, setIsGeneratingImproved] = useState(false);
  
  // Check if can analyze (any block has content)
  const canAnalyze = state.blocks.some(b => b.text.trim().length > 0);
  
  // Helper function for competency descriptions
  const getCompetencyDescription = (id: string): string => {
    const descriptions: Record<string, string> = {
      c1: 'Domínio da norma culta da língua escrita',
      c2: 'Compreensão da proposta e aplicação de conceitos',
      c3: 'Seleção e organização de argumentos',
      c4: 'Conhecimento dos mecanismos linguísticos',
      c5: 'Proposta de intervenção detalhada',
    };
    return descriptions[id] || '';
  };
  
  // Unified analysis: analyzes all blocks + evaluates competencies in ONE AI call
  const handleAnalyzeAll = useCallback(async () => {
    const blocksWithContent = state.blocks.filter(b => b.text.trim().length > 0);
    
    if (blocksWithContent.length === 0) {
      toast.info('Adicione texto antes de analisar');
      return;
    }
    
    setIsAnalyzingAll(true);
    
    try {
      console.log('[Analyze Essay] Calling unified analyzeEssay with blocks:', blocksWithContent.length);
      
      const response = await analyzeEssay(
        blocksWithContent.map(b => ({ id: b.id, type: b.type, text: b.text })),
        state.theme
      );
      
      console.log('[Analyze Essay] Response:', response);
      
      // Update each block with its analysis
      for (const block of blocksWithContent) {
        const analysis = response.blockAnalyses[block.id];
        if (analysis) {
          setBlockAnalysis(block.id, analysis, 'analyzed');
        }
      }
      
      // Update competencies with AI evaluation
      const updatedCompetencies = response.competencies.map(c => ({
        id: c.id,
        name: `Competência ${c.id.charAt(1)}`,
        description: getCompetencyDescription(c.id),
        score: c.score,
        explanation: c.explanation,
      }));
      
      setCompetencies(updatedCompetencies);
      setTotalScore(response.totalScore);
      
      if (response.usage) {
        console.log('[Token Usage] Análise unificada:', response.usage);
      }
      
      toast.success('Análise completa!');
    } catch (error) {
      console.error('Analyze essay error:', error);
      
      // Mark blocks as unavailable on error
      for (const block of blocksWithContent) {
        setBlockAnalysis(block.id, null, 'unavailable');
      }
      
      toast.error('Erro ao analisar redação. Tente novamente.');
    } finally {
      setIsAnalyzingAll(false);
    }
  }, [state.blocks, state.theme, setBlockAnalysis, setCompetencies, setTotalScore]);
  
  // Generate improved version
  const handleGenerateImproved = useCallback(async () => {
    if (!canGenerateImproved) {
      toast.error('Analise os blocos essenciais primeiro');
      return;
    }
    
    setIsGeneratingImproved(true);
    
    try {
      const response = await generateImprovedVersion(state.blocks, state.theme);
      setImprovedVersion(response.improvedText);
      
      // Log usage if available (for testing/debugging)
      if (response.usage) {
        console.log('[Token Usage] Versão melhorada:', response.usage);
      }
      
      toast.success('Versão melhorada gerada!');
    } catch (error) {
      toast.error('Não foi possível gerar a versão melhorada. Tente novamente.');
    } finally {
      setIsGeneratingImproved(false);
    }
  }, [canGenerateImproved, state.blocks, state.theme, setImprovedVersion]);
  
  // Get development blocks count for remove logic
  const devBlocksCount = state.blocks.filter(b => b.type === 'development').length;
  
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Header */}
      <Header
        onAnalyzeAll={handleAnalyzeAll}
        onPasteDivide={() => setPasteModalOpen(true)}
        onAddDevelopment={addDevelopment}
        isAnalyzing={isAnalyzingAll}
        canAnalyze={canAnalyze}
      />
      
      {/* Main content */}
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column - Editor */}
          <div className="lg:w-[62%] space-y-4">
            {state.blocks.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                onTextChange={(text) => updateBlockText(block.id, text)}
                onClear={() => clearBlock(block.id)}
                onRemove={block.type === 'development' ? () => removeDevelopment(block.id) : undefined}
                canRemove={block.type === 'development' && devBlocksCount > 1}
                isAnalyzing={isAnalyzingAll}
              />
            ))}
          </div>
          
          {/* Right column - Results (desktop) */}
          <div className="hidden lg:block lg:w-[38%]">
            <div className="sticky top-24">
              <ResultPanel
                state={state}
                analyzedCount={analyzedBlockCount}
                totalCount={totalBlockCount}
                estimatedScore={estimatedScore}
                canGenerateImproved={canGenerateImproved}
                onGenerateImproved={handleGenerateImproved}
                onToggleOriginal={toggleShowOriginal}
                isGenerating={isGeneratingImproved}
              />
            </div>
          </div>
        </div>
      </main>
      
      {/* Mobile results bar */}
      <MobileResultsBar
        state={state}
        analyzedCount={analyzedBlockCount}
        totalCount={totalBlockCount}
        estimatedScore={estimatedScore}
        canGenerateImproved={canGenerateImproved}
        onGenerateImproved={handleGenerateImproved}
        onToggleOriginal={toggleShowOriginal}
        onAnalyzeAll={handleAnalyzeAll}
        isAnalyzing={isAnalyzingAll}
        isGenerating={isGeneratingImproved}
        canAnalyze={canAnalyze}
      />
      
      {/* Paste & Divide Modal */}
      <PasteDivideModal
        open={pasteModalOpen}
        onOpenChange={setPasteModalOpen}
        onApply={applyDividedText}
      />
    </div>
  );
};

export default Index;
