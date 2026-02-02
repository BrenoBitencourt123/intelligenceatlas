import { useState, useCallback } from 'react';
import { useEssayState } from '@/hooks/useEssayState';
import { Header } from '@/components/atlas/Header';
import { BlockCard } from '@/components/atlas/BlockCard';
import { ResultPanel } from '@/components/atlas/ResultPanel';
import { PasteDivideModal } from '@/components/atlas/PasteDivideModal';
import { MobileResultsBar } from '@/components/atlas/MobileResultsBar';
import { analyzeBlock, calculateCompetencies, evaluateCompetencies, generateImprovedVersion } from '@/lib/ai';
import { hashText } from '@/lib/storage';
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
  const [analyzingBlocks, setAnalyzingBlocks] = useState<Set<string>>(new Set());
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [isEvaluatingCompetencies, setIsEvaluatingCompetencies] = useState(false);
  const [isGeneratingImproved, setIsGeneratingImproved] = useState(false);
  
  // Check if can analyze (any block has content)
  const canAnalyze = state.blocks.some(b => b.text.trim().length > 0);
  
  // Analyze single block (doesn't update competencies - that's done in handleAnalyzeAll)
  const handleAnalyzeBlock = useCallback(async (blockId: string) => {
    const block = state.blocks.find(b => b.id === blockId);
    if (!block || !block.text.trim()) return;
    
    // Check cache
    const currentHash = hashText(block.text);
    if (block.analysis?.textHash === currentHash) {
      toast.info('Este bloco já foi analisado');
      return;
    }
    
    setAnalyzingBlocks(prev => new Set(prev).add(blockId));
    
    try {
      const response = await analyzeBlock(block.type, block.text, state.theme);
      setBlockAnalysis(blockId, response.analysis, 'analyzed');
      
      // Log usage if available (for testing/debugging)
      if (response.usage) {
        console.log(`[Token Usage] ${block.title}:`, response.usage);
      }
      
      // Note: Competencies are evaluated via AI in handleAnalyzeAll, not here
      // This allows individual block analysis without recalculating the whole score
      
      toast.success(`${block.title} analisado com sucesso`);
    } catch (error) {
      setBlockAnalysis(blockId, null, 'unavailable');
      toast.error('Correção indisponível. Tente novamente.');
    } finally {
      setAnalyzingBlocks(prev => {
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
    }
  }, [state.blocks, state.theme, setBlockAnalysis]);
  
  // Analyze all blocks and evaluate competencies with AI
  const handleAnalyzeAll = useCallback(async () => {
    const blocksToAnalyze = state.blocks.filter(b => {
      if (!b.text.trim()) return false;
      const currentHash = hashText(b.text);
      return b.analysis?.textHash !== currentHash;
    });
    
    // Get blocks with content for competency evaluation
    const blocksWithContent = state.blocks.filter(b => b.text.trim().length > 0);
    
    if (blocksWithContent.length === 0) {
      toast.info('Adicione texto antes de analisar');
      return;
    }
    
    setIsAnalyzingAll(true);
    
    // First, analyze individual blocks that need analysis
    if (blocksToAnalyze.length > 0) {
      for (const block of blocksToAnalyze) {
        await handleAnalyzeBlock(block.id);
      }
    }
    
    // Then, evaluate competencies with AI using full essay
    setIsEvaluatingCompetencies(true);
    try {
      console.log('[Competencies] Calling evaluateCompetencies with blocks:', blocksWithContent.length);
      const response = await evaluateCompetencies(blocksWithContent, state.theme);
      console.log('[Competencies] Response:', response);
      
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
        console.log('[Token Usage] Avaliação de competências:', response.usage);
      }
      
      toast.success('Análise completa!');
    } catch (error) {
      console.error('Competency evaluation error:', error);
      toast.error('Erro ao avaliar competências. Tente novamente.');
    } finally {
      setIsEvaluatingCompetencies(false);
    }
    
    setIsAnalyzingAll(false);
  }, [state.blocks, state.theme, handleAnalyzeBlock, setCompetencies, setTotalScore]);
  
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
  }, [canGenerateImproved, state.blocks, setImprovedVersion]);
  
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
                onAnalyze={() => handleAnalyzeBlock(block.id)}
                onRemove={block.type === 'development' ? () => removeDevelopment(block.id) : undefined}
                canRemove={block.type === 'development' && devBlocksCount > 1}
                isAnalyzing={analyzingBlocks.has(block.id)}
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
