import { useState, useCallback } from 'react';
import { useEssayState } from '@/hooks/useEssayState';
import { useDailyTheme } from '@/hooks/useDailyTheme';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { MainLayout } from '@/components/layout/MainLayout';
import { BlockCard } from '@/components/atlas/BlockCard';
import { ResultPanel } from '@/components/atlas/ResultPanel';
import { PasteDivideModal } from '@/components/atlas/PasteDivideModal';
import { MobileResultsBar } from '@/components/atlas/MobileResultsBar';
import { PedagogicalSection } from '@/components/atlas/PedagogicalSection';
import { analyzeEssay, generateImprovedVersion } from '@/lib/ai';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Scissors, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Essay = () => {
  const { user } = useAuth();
  const { theme, isLoading: isThemeLoading } = useDailyTheme();
  const { planType, hasPedagogicalAccess, hasImprovedVersionAccess } = usePlanFeatures();
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
  
  // Save essay to database
  const saveEssayToDatabase = useCallback(async (
    essayTheme: string,
    blocks: typeof state.blocks,
    analysis: Record<string, unknown>,
    totalScore: number
  ) => {
    if (!user) {
      console.warn('[Save Essay] No user logged in, skipping save');
      return;
    }

    try {
      const blocksData = blocks.map(b => ({
        id: b.id,
        type: b.type,
        title: b.title,
        text: b.text,
        wordCount: b.wordCount,
      }));

      const { error } = await supabase.from('essays').insert([{
        user_id: user.id,
        theme: essayTheme,
        blocks: blocksData as unknown as import('@/integrations/supabase/types').Json,
        analysis: analysis as unknown as import('@/integrations/supabase/types').Json,
        total_score: totalScore,
        analyzed_at: new Date().toISOString(),
      }]);

      if (error) {
        console.error('[Save Essay] Error:', error);
        toast.error('Erro ao salvar redação no histórico');
        return;
      }

      console.log('[Save Essay] Essay saved successfully');
      toast.success('Redação salva no seu histórico!');
    } catch (error) {
      console.error('[Save Essay] Unexpected error:', error);
    }
  }, [user]);

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

      // Save to database after successful analysis
      await saveEssayToDatabase(
        state.theme,
        state.blocks,
        {
          blockAnalyses: response.blockAnalyses,
          competencies: response.competencies,
        },
        response.totalScore
      );
      
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
  }, [state.blocks, state.theme, setBlockAnalysis, setCompetencies, setTotalScore, saveEssayToDatabase]);
  
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

  // Show loading skeleton while theme is loading
  if (isThemeLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background">
          <main className="container max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-[62%] space-y-4">
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
              </div>
              <div className="hidden lg:block lg:w-[38%]">
                <Skeleton className="h-96 rounded-lg" />
              </div>
            </div>
          </main>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Main content */}
        <main className="container max-w-7xl mx-auto px-4 py-6 pb-40 md:pb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left column - Editor */}
            <div className="lg:w-[62%] space-y-4">
              {/* Pedagogical context section */}
              <PedagogicalSection theme={theme} isLocked={!hasPedagogicalAccess} />
              
              {/* Action buttons - reorganized with hierarchy */}
              <div className="space-y-3 py-2">
                {/* Secondary buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPasteModalOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Scissors className="h-4 w-4 mr-1.5" />
                    Colar e dividir
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addDevelopment}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Desenvolvimento
                  </Button>
                </div>
                
                {/* Primary button */}
                <Button
                  size="lg"
                  onClick={handleAnalyzeAll}
                  disabled={!canAnalyze || isAnalyzingAll}
                  className="w-full md:w-auto bg-foreground hover:bg-foreground/90 text-background"
                >
                  {isAnalyzingAll ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Analisar redação
                    </>
                  )}
                </Button>
              </div>
              
              {/* Essay blocks */}
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
                  canGenerateImproved={canGenerateImproved && hasImprovedVersionAccess}
                  onGenerateImproved={handleGenerateImproved}
                  onToggleOriginal={toggleShowOriginal}
                  isGenerating={isGeneratingImproved}
                  hasImprovedVersionAccess={hasImprovedVersionAccess}
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
          canGenerateImproved={canGenerateImproved && hasImprovedVersionAccess}
          onGenerateImproved={handleGenerateImproved}
          onToggleOriginal={toggleShowOriginal}
          onAnalyzeAll={handleAnalyzeAll}
          isAnalyzing={isAnalyzingAll}
          isGenerating={isGeneratingImproved}
          canAnalyze={canAnalyze}
          hasImprovedVersionAccess={hasImprovedVersionAccess}
        />
        
        {/* Paste & Divide Modal */}
        <PasteDivideModal
          open={pasteModalOpen}
          onOpenChange={setPasteModalOpen}
          onApply={applyDividedText}
        />
      </div>
    </MainLayout>
  );
};

export default Essay;
