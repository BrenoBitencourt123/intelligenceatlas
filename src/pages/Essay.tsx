import { useState, useCallback, useEffect } from 'react';
import { useEssayState } from '@/hooks/useEssayState';
import { useDailyTheme } from '@/hooks/useDailyTheme';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useQuotaCheck } from '@/hooks/useQuotaCheck';
import { useUserStats } from '@/hooks/useUserStats';
import { MainLayout } from '@/components/layout/MainLayout';
import { BlockCard } from '@/components/atlas/BlockCard';
import { ResultPanel } from '@/components/atlas/ResultPanel';
import { PasteDivideModal } from '@/components/atlas/PasteDivideModal';
import { MobileResultsBar } from '@/components/atlas/MobileResultsBar';
import { PedagogicalSection } from '@/components/atlas/PedagogicalSection';
import { QuotaExceededModal } from '@/components/atlas/QuotaExceededModal';
import { analyzeEssay, generateImprovedVersion } from '@/lib/ai';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Scissors, Plus, Loader2, AlertCircle } from 'lucide-react';
import { EssaySkeleton } from '@/components/skeletons/EssaySkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Essay = () => {
  const { user } = useAuth();
  const { theme: dailyTheme, isLoading: isThemeLoading } = useDailyTheme();
  const navigate = useNavigate();
  const { planType, hasPedagogicalAccess, hasImprovedVersionAccess, hasSourcesAccess, isFree, weeklyEssayLimit } = usePlanFeatures();
  const { canAnalyze: hasQuota, reason: quotaReason, isLoading: isQuotaLoading, weeklyUsed, weeklyLimit, isWelcomeBonus } = useQuotaCheck();
  const { hasWrittenToday, isLoading: isStatsLoading } = useUserStats();
  const [redoOverride, setRedoOverride] = useState(false);
  const effectiveHasWrittenToday = hasWrittenToday && !redoOverride;
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
    setTheme,
    resetAll,
    analysisProgress,
    analyzedBlockCount,
    totalBlockCount,
    canGenerateImproved,
    estimatedScore,
  } = useEssayState();
  
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [isGeneratingImproved, setIsGeneratingImproved] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  // Theme ALWAYS starts empty on page load - user must fill it manually
  // This prevents auto-fill confusion for users doing multiple essays
  const [customTheme, setCustomTheme] = useState<string>('');
  const [showThemeWarning, setShowThemeWarning] = useState(false);
  
  // Effective theme is just what user typed
  const effectiveTheme = customTheme.trim();
  
  // Sync theme to state when it changes (for saving to database on analysis)
  useEffect(() => {
    if (effectiveTheme !== state.theme) {
      setTheme(effectiveTheme);
    }
  }, [effectiveTheme, state.theme, setTheme]);
  
  // Handle custom theme input change
  const handleCustomThemeChange = (value: string) => {
    setCustomTheme(value);
  };
  
  // Check if can analyze (any block has content AND has quota)
  const canAnalyze = state.blocks.some(b => b.text.trim().length > 0) && hasQuota;
  
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
  const handleAnalyzeAll = useCallback(async (skipThemeCheck = false) => {
    // Check quota first
    if (!hasQuota) {
      setShowQuotaModal(true);
      return;
    }

    const blocksWithContent = state.blocks.filter(b => b.text.trim().length > 0);
    
    if (blocksWithContent.length === 0) {
      toast.info('Adicione texto antes de analisar');
      return;
    }
    
    // Check if theme is empty and show warning (unless user confirmed)
    if (!effectiveTheme && !skipThemeCheck) {
      setShowThemeWarning(true);
      return;
    }
    
    setShowThemeWarning(false);
    setIsAnalyzingAll(true);
    
    try {
      console.log('[Analyze Essay] Calling unified analyzeEssay with blocks:', blocksWithContent.length);
      
      const response = await analyzeEssay(
        blocksWithContent.map(b => ({ id: b.id, type: b.type, text: b.text })),
        effectiveTheme
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
        effectiveTheme,
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
      
      // Check if it's a quota exceeded error from backend
      if (error instanceof Error && error.message.includes('QUOTA_EXCEEDED')) {
        setShowQuotaModal(true);
        return;
      }
      
      // Mark blocks as unavailable on error
      for (const block of blocksWithContent) {
        setBlockAnalysis(block.id, null, 'unavailable');
      }
      
      toast.error('Erro ao analisar redação. Tente novamente.');
    } finally {
      setIsAnalyzingAll(false);
    }
  }, [state.blocks, effectiveTheme, hasQuota, setBlockAnalysis, setCompetencies, setTotalScore, saveEssayToDatabase]);
  
  // Generate improved version
  const handleGenerateImproved = useCallback(async () => {
    if (!canGenerateImproved) {
      toast.error('Analise os blocos essenciais primeiro');
      return;
    }
    
    setIsGeneratingImproved(true);
    
    try {
      const response = await generateImprovedVersion(state.blocks, effectiveTheme);
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
  }, [canGenerateImproved, state.blocks, effectiveTheme, setImprovedVersion]);
  
  // Get development blocks count for remove logic
  const devBlocksCount = state.blocks.filter(b => b.type === 'development').length;

  // Show loading skeleton while theme or stats are loading
  if (isThemeLoading || isStatsLoading) {
    return <EssaySkeleton />;
  }
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Main content */}
        <main className="container max-w-7xl mx-auto px-4 py-6 md:pb-6" style={{ paddingBottom: 'calc(12rem + env(safe-area-inset-bottom))' }}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left column - Editor */}
            <div className="lg:w-[62%] space-y-4">
              {/* Pedagogical context section */}
              <PedagogicalSection 
                theme={dailyTheme} 
                isLocked={!hasPedagogicalAccess} 
                planType={planType} 
                hasSourcesAccess={hasSourcesAccess}
                hasWrittenToday={effectiveHasWrittenToday}
                onRedo={() => {
                  setRedoOverride(true);
                  resetAll();
                }}
              />
              
              {/* Action buttons - all in one line */}
              <div className="flex items-center gap-2 flex-wrap py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPasteModalOpen(true)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Scissors className="h-4 w-4 mr-1.5" />
                  Colar e dividir
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addDevelopment}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Desenvolvimento
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => handleAnalyzeAll()}
                  disabled={!canAnalyze || isAnalyzingAll}
                  className="bg-foreground hover:bg-foreground/80 text-background"
                >
                  {isAnalyzingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Analisar redação
                    </>
                  )}
                </Button>
              </div>
              
              {/* Theme input - below action buttons */}
              <div className="space-y-2">
                <Label htmlFor="theme-input" className="text-sm font-medium text-muted-foreground">
                  Tema da redação
                </Label>
                <Input
                  id="theme-input"
                  value={customTheme}
                  onChange={(e) => handleCustomThemeChange(e.target.value)}
                  placeholder="Digite o tema da sua redação"
                  className={`text-base ${showThemeWarning ? 'border-destructive ring-1 ring-destructive' : ''}`}
                />
                {showThemeWarning ? (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive">
                      Você não preencheu o tema. Deseja continuar sem tema?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowThemeWarning(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAnalyzeAll(true)}
                      >
                        Continuar sem tema
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Informe o tema para que a análise possa avaliar a aderência ao tema proposto
                  </p>
                )}
              </div>
              
              {/* Daily limit warning */}
              {quotaReason === 'daily_limit' && (
                <Alert className="border-accent bg-accent/10">
                  <AlertCircle className="h-4 w-4 text-accent-foreground" />
                  <AlertDescription className="text-foreground">
                    Você atingiu o limite de correções por dia. 
                    Volte amanhã para continuar praticando!
                  </AlertDescription>
                </Alert>
              )}
              
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
              <div className="sticky top-24 space-y-4">
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

                {/* Banner PRO pós-correção — aparece quando free termina de analisar */}
                {isFree && state.totalScore !== null && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-sm font-semibold text-foreground">
                        {weeklyUsed >= weeklyLimit
                          ? 'Próxima correção em 7 dias'
                          : isWelcomeBonus
                            ? `Bônus de boas-vindas: ${weeklyLimit - weeklyUsed} correção restante`
                            : 'Gostou da análise?'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {weeklyUsed >= weeklyLimit
                        ? 'No PRO você corrige toda semana, todo dia — sem esperar.'
                        : 'No PRO: 60 correções por mês, versão melhorada ilimitada e flashcards automáticos ao errar.'}
                    </p>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => navigate('/plano')}
                    >
                      Ver plano PRO
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
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
          onAnalyzeAll={() => handleAnalyzeAll()}
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
        
        {/* Quota Exceeded Modal */}
        <QuotaExceededModal
          open={showQuotaModal}
          onOpenChange={setShowQuotaModal}
          reason={quotaReason}
        />
      </div>
    </MainLayout>
  );
};

export default Essay;
