import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useStudySchedule } from '@/hooks/useStudySchedule';
import { useStudySession } from '@/hooks/useStudySession';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useExamPdf } from '@/hooks/useExamPdf';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { ArrowRight, BookOpen, Brain, Check, Crown, FileText, HelpCircle, RotateCcw, Target, X, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import MarkdownText from '@/components/atlas/MarkdownText';
import { useQuestionPedagogy } from '@/hooks/useQuestionPedagogy';
import { PreConceptBlock, PostAnswerBlocks } from '@/components/atlas/PedagogyBlocks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QuestionImageGallery } from '@/components/study/QuestionImageGallery';
import { InlineStatementRenderer } from '@/components/study/InlineStatementRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { TopicMap } from '@/components/objectives/TopicMap';

const AREA_LABELS: Record<string, string> = {
  matematica: 'Matemática',
  linguagens: 'Linguagens',
  natureza: 'Ciências da Natureza',
  humanas: 'Ciências Humanas',
};

const Objectives = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const previewQuestionId = searchParams.get('previewQuestionId');
  const areaOverride = searchParams.get('area');
  const schedule = useStudySchedule();
  const effectiveArea = areaOverride || schedule.area;
  const stats = useStudyStats();
  const {
    hasFullSessionAccess,
    hasAutoFlashcards,
    hasKnowledgeCapsules,
    freeQuestionLimit,
    isFree,
    isPro,
    isAreaLocked,
  } = usePlanFeatures();
  const {
    state,
    currentQuestion,
    currentIndex,
    totalQuestions,
    currentBlock,
    blockLabels,
    progress,
    showFeedback,
    answers,
    result,
    hasSavedSession,
    startSession,
    resumeSession,
    exitSessionView,
    startPreviewQuestion,
    answerQuestion,
    confirmAnswer,
    nextQuestion,
    resetSession,
  } = useStudySession();
  const [pendingGuessAnswer, setPendingGuessAnswer] = useState<string | null>(null);
  const { available: pdfAvailable, openPdf, loading: pdfLoading } = useExamPdf(currentQuestion?.year);
  const { pedagogy, loading: pedagogyLoading } = useQuestionPedagogy(
    currentQuestion ? {
      id: currentQuestion.id,
      statement: currentQuestion.statement,
      alternatives: currentQuestion.alternatives as { letter: string; text: string }[],
      correct_answer: currentQuestion.correct_answer,
      explanation: currentQuestion.explanation,
      area: currentQuestion.area,
      tags: currentQuestion.tags,
    } : null,
    state === 'active' && hasKnowledgeCapsules
  );
  const { user } = useAuth();
  const [blockTransition, setBlockTransition] = useState<{
    completedBlock: number;
    correct: number;
    total: number;
  } | null>(null);

  // Open a specific question directly when arriving from admin preview.
  useEffect(() => {
    if (!previewQuestionId) return;
    if (state !== 'idle') return;

    startPreviewQuestion(previewQuestionId).then((ok) => {
      if (ok) {
        const next = new URLSearchParams(searchParams);
        next.delete('previewQuestionId');
        setSearchParams(next, { replace: true });
      }
    });
  }, [previewQuestionId, state, startPreviewQuestion, searchParams, setSearchParams]);

  // Loading state
  if (state === 'loading') {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-2 w-full" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-20 w-full rounded-xl" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Result screen ──────────────────────────────────────────────
  if (state === 'result' && result) {
    const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    return (
      <MainLayout>
        <div className="container max-w-lg mx-auto px-4 py-12">
          <div className="space-y-8">
            {/* Score hero */}
            <div className="text-center space-y-2">
              <p className="text-6xl font-black tracking-tight text-foreground">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">
                {result.correct} de {result.total} questões corretas
              </p>
            </div>

            {/* Block breakdown — horizontal bars */}
            <div className="space-y-3">
              {result.blocks.map((block, i) => {
                const blockAcc = block.total > 0 ? Math.round((block.correct / block.total) * 100) : 0;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{blockLabels[i]}</span>
                      <span className="font-medium text-foreground">{block.correct}/{block.total}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-foreground transition-all"
                        style={{ width: `${blockAcc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Meta */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>⏱ {result.durationMinutes} min</span>
              <span className="w-px h-3 bg-border" />
              <span>🧠 {result.flashcardsGenerated} flashcards</span>
            </div>

            {/* Flashcard CTA */}
            {flashcards.totalDue > 0 && (
              <button
                onClick={() => { resetSession(); setFlashcardMode(true); }}
                className="w-full flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{flashcards.totalDue} flashcards para revisar</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            )}

            <Button className="w-full" variant="outline" onClick={resetSession}>
              Voltar ao Início
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Active question ────────────────────────────────────────────
  if (state === 'active' && currentQuestion) {
    const currentAnswer = answers[currentIndex];
    const alternatives = currentQuestion.alternatives as { letter: string; text: string }[];
    const warmSz = Math.max(1, Math.round(totalQuestions * 0.25));
    const consSz = Math.max(1, Math.round(totalQuestions * 0.25));
    const blockBounds = [0, warmSz, totalQuestions - consSz, totalQuestions];

    const currentBlockStart = blockBounds[currentBlock];
    const currentBlockEnd = blockBounds[currentBlock + 1];
    const currentBlockTotal = currentBlockEnd - currentBlockStart;
    const currentBlockAnswered = Object.keys(answers).filter((key) => {
      const i = Number(key);
      return i >= currentBlockStart && i < currentBlockEnd;
    }).length;
    const currentBlockPct = currentBlockTotal > 0
      ? Math.round((currentBlockAnswered / currentBlockTotal) * 100) : 0;

    const handleNext = () => {
      const lastIndexOfBlock = blockBounds[currentBlock + 1] - 1;
      if (currentIndex === lastIndexOfBlock && currentBlock < 2) {
        const blockAnswers = Object.entries(answers)
          .filter(([i]) => { const n = parseInt(i); return n >= currentBlockStart && n < currentBlockEnd; })
          .map(([, a]) => a);
        setBlockTransition({
          completedBlock: currentBlock,
          correct: blockAnswers.filter((a) => a.correct).length,
          total: currentBlockTotal,
        });
      } else {
        nextQuestion();
      }
    };

    // Block transition screen — monochromatic
    if (blockTransition !== null) {
      const nextBlockIndex = blockTransition.completedBlock + 1;
      const nextBlockTotal = blockBounds[nextBlockIndex + 1] - blockBounds[nextBlockIndex];
      const accuracy = blockTransition.total > 0
        ? Math.round((blockTransition.correct / blockTransition.total) * 100) : 0;
      return (
        <MainLayout>
          <div className="container max-w-md mx-auto px-4 py-8 pb-24 flex flex-col items-center justify-center min-h-[70vh]">
            <div className="w-full rounded-2xl border border-border bg-card p-6 space-y-6">
              {/* Completed block */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-foreground text-background text-xl font-bold">✓</div>
                <h2 className="text-xl font-bold text-foreground mt-3">
                  {blockLabels[blockTransition.completedBlock]} concluído
                </h2>
              </div>

              {/* Score */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Acertos</span>
                  <span className="font-semibold text-foreground">
                    {blockTransition.correct}/{blockTransition.total} · {accuracy}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>

              {/* Next block preview */}
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">A seguir</p>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">
                    {nextBlockIndex + 1}
                  </span>
                  <span className="font-medium text-foreground">{blockLabels[nextBlockIndex]}</span>
                  <span className="text-muted-foreground text-sm">· {nextBlockTotal} questões</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => { setBlockTransition(null); nextQuestion(); }}
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </MainLayout>
      );
    }

    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-4 pb-24">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-foreground">
                  {currentIndex + 1}/{totalQuestions}
                </span>
                {totalQuestions === 1 && (
                  <Badge variant="outline" className="text-xs">Preview</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {pdfAvailable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground"
                    onClick={openPdf}
                    disabled={pdfLoading}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exitSessionView}
                  title="Voltar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Minimal stepper — dots */}
            {totalQuestions > 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                        i < currentBlock
                          ? 'bg-foreground'
                          : i === currentBlock
                          ? 'bg-foreground'
                          : 'bg-muted-foreground/30'
                      }`} />
                      <span className={`text-xs hidden sm:inline ${
                        i === currentBlock ? 'font-medium text-foreground' : 'text-muted-foreground'
                      }`}>
                        {blockLabels[i]}
                      </span>
                      {i < 2 && <div className="w-4 h-px bg-border shrink-0" />}
                    </div>
                  ))}
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                    {currentBlockAnswered}/{currentBlockTotal}
                  </span>
                </div>
                <Progress value={currentBlockPct} className="h-1" />
              </div>
            )}

            {/* Question card */}
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="p-5 space-y-5">
                {(() => {
                  const allImages = currentQuestion.images || [];
                  const ALT_LETTERS = ['A', 'B', 'C', 'D', 'E'];
                  const statementImages = allImages.filter(
                    (img: any) => !img.caption || !ALT_LETTERS.includes(img.caption.trim().toUpperCase())
                  );
                  const altImageMap = new Map<string, any[]>();
                  allImages.forEach((img: any) => {
                    if (img.caption && ALT_LETTERS.includes(img.caption.trim().toUpperCase())) {
                      const letter = img.caption.trim().toUpperCase();
                      if (!altImageMap.has(letter)) altImageMap.set(letter, []);
                      altImageMap.get(letter)!.push(img);
                    }
                  });
                  return (
                    <>
                      {/* Question meta */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Q{currentQuestion.number}</span>
                        <span className="w-px h-3 bg-border" />
                        <span>ENEM {currentQuestion.year}</span>
                      </div>

                      {/* Statement */}
                      <InlineStatementRenderer
                        statement={currentQuestion.statement || ''}
                        images={statementImages}
                        questionNumber={currentQuestion.number}
                      />

                      {/* Pre-concept */}
                      {hasKnowledgeCapsules && !showFeedback && (
                        <PreConceptBlock pedagogy={pedagogy} loading={pedagogyLoading} />
                      )}

                      {/* Alternatives */}
                      <div className="space-y-2">
                        {alternatives.map((alt) => {
                          const altImages = altImageMap.get(alt.letter) || [];
                          const hasAltImage = altImages.length > 0 || (alt as any).image_url;

                          let stateClass = 'border-border hover:bg-muted/50 cursor-pointer';

                          if (showFeedback) {
                            stateClass = 'cursor-default border-border';
                            if (alt.letter === currentQuestion.correct_answer) {
                              stateClass = 'border-green-500 bg-green-500/10 cursor-default';
                            } else if (currentAnswer?.selected === alt.letter && !currentAnswer.correct) {
                              stateClass = 'border-red-500 bg-red-500/10 cursor-default';
                            }
                          } else if (pendingGuessAnswer === alt.letter) {
                            stateClass = 'border-foreground bg-foreground/5 ring-1 ring-foreground/20';
                          } else if (currentAnswer?.selected === alt.letter) {
                            stateClass = 'border-foreground bg-foreground/5';
                          }

                          const handleAltClick = async () => {
                            if (showFeedback || pendingGuessAnswer) return;
                            const result = await answerQuestion(alt.letter, hasAutoFlashcards);
                            if (result.suspectedGuess) {
                              setPendingGuessAnswer(alt.letter);
                            }
                          };

                          return (
                            <button
                              key={alt.letter}
                              className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${stateClass}`}
                              onClick={handleAltClick}
                              disabled={showFeedback || !!pendingGuessAnswer}
                            >
                              <span className="text-xs font-semibold shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground">
                                {alt.letter}
                              </span>
                              <span className={`text-sm flex-1 ${hasAltImage ? 'flex items-center gap-2' : ''}`}>
                                {alt.text && <span>{alt.text}</span>}
                                {(alt as any).image_url && (
                                  <img
                                    src={(alt as any).image_url}
                                    alt={`Alternativa ${alt.letter}`}
                                    className="max-h-20 max-w-[180px] rounded border object-contain bg-muted/10"
                                    loading="lazy"
                                  />
                                )}
                                {altImages.map((img: any, idx: number) => (
                                  <img
                                    key={idx}
                                    src={img.url}
                                    alt={`Alternativa ${alt.letter}`}
                                    className="max-h-20 max-w-[180px] rounded border object-contain bg-muted/10"
                                    loading="lazy"
                                  />
                                ))}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

                {/* Guess confirmation */}
                {pendingGuessAnswer && !showFeedback && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                    <div className="flex items-start gap-2.5">
                      <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Isso foi um chute?</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          O Atlas aprende com suas respostas para personalizar seu estudo.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          const letter = pendingGuessAnswer;
                          setPendingGuessAnswer(null);
                          await confirmAnswer(letter, hasAutoFlashcards, false);
                        }}
                      >
                        Não, respondi consciente
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          const letter = pendingGuessAnswer;
                          setPendingGuessAnswer(null);
                          await confirmAnswer(letter, hasAutoFlashcards, true);
                        }}
                      >
                        Sim, foi chute
                      </Button>
                    </div>
                  </div>
                )}

                {showFeedback && hasKnowledgeCapsules && (
                  <>
                    {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {currentQuestion.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {currentQuestion.explanation && (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">Justificativa</span>
                        </div>
                        <div className="p-4">
                          <MarkdownText content={currentQuestion.explanation} className="text-sm text-muted-foreground leading-relaxed" />
                        </div>
                      </div>
                    )}

                    <PostAnswerBlocks
                      pedagogy={pedagogy}
                      loading={pedagogyLoading}
                      showPostAnswer={true}
                    />
                  </>
                )}

                {showFeedback && !hasKnowledgeCapsules && currentQuestion.explanation && (
                  <div className="rounded-lg border border-border p-4 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Quer explicações detalhadas após cada questão?</p>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/plano')}>
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                      Plano Pro
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {!showFeedback ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => answerQuestion(null, hasAutoFlashcards)}
                >
                  Não sei
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleNext}>
                  {currentIndex + 1 >= totalQuestions ? 'Ver Resultado' : 'Próxima'}
                  {currentIndex + 1 < totalQuestions && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Flashcard review ───────────────────────────────────────────
  if (flashcardMode && flashcards.totalDue > 0) {
    const { reviewState, currentCard, currentIndex: fcIndex, totalDue, reviewed, reveal, rate } = flashcards;

    if (reviewState === 'done') {
      return (
        <MainLayout>
          <div className="container max-w-lg mx-auto px-4 py-12">
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <span className="text-4xl">🎉</span>
                <h2 className="text-xl font-bold text-foreground">Revisão concluída!</h2>
                <p className="text-muted-foreground">{reviewed} flashcards revisados</p>
              </div>
              <Button className="w-full" variant="outline" onClick={() => setFlashcardMode(false)}>
                Voltar às Objetivas
              </Button>
            </div>
          </div>
        </MainLayout>
      );
    }

    if (currentCard) {
      return (
        <MainLayout>
          <div className="container max-w-2xl mx-auto px-4 py-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Flashcards</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">{fcIndex + 1}/{totalDue}</span>
                  <Button variant="ghost" size="sm" onClick={() => setFlashcardMode(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card min-h-[240px] flex flex-col">
                <div className="p-6 flex-1 flex flex-col justify-center">
                  {currentCard.area && (
                    <Badge variant="secondary" className="self-start mb-3 text-xs">
                      {currentCard.area}
                    </Badge>
                  )}

                  {reviewState === 'reviewing' ? (
                    <MarkdownText content={currentCard.front} className="text-lg font-medium leading-relaxed" />
                  ) : (
                    <div className="space-y-4">
                      <MarkdownText content={currentCard.front} className="text-base leading-relaxed text-muted-foreground" />
                      <div className="border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Resposta</p>
                        <MarkdownText content={currentCard.back} className="text-base leading-relaxed" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {reviewState === 'reviewing' ? (
                <Button className="w-full" onClick={reveal}>
                  <Eye className="h-4 w-4 mr-2" />
                  Mostrar Resposta
                </Button>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" onClick={() => rate('again')} className="text-xs border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10">
                    Não lembrei
                  </Button>
                  <Button variant="outline" onClick={() => rate('hard')} className="text-xs">
                    Com esforço
                  </Button>
                  <Button variant="outline" onClick={() => rate('easy')} className="text-xs border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10">
                    Fácil
                  </Button>
                </div>
              )}
            </div>
          </div>
        </MainLayout>
      );
    }
  }

  // ── Idle dashboard ─────────────────────────────────────────────
  const questionLimit = hasFullSessionAccess ? schedule.questionCount : freeQuestionLimit;
  const dailyTarget = 20;
  const dailyPct = Math.min(100, Math.round((stats.questionsToday / dailyTarget) * 100));

  // Weak topics (top 3 by priority score, with at least 1 attempt)
  const weakTopics = stats.topWeaknesses
    .filter((t: any) => t.priority > 0)
    .slice(0, 3);

  return (
    <MainLayout>
      <div className="container max-w-lg mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Questões Objetivas</h1>
            {!stats.isLoading && stats.questionsToday > 0 && (
              <p className="text-sm text-muted-foreground">
                Hoje: {stats.questionsToday} questões · {stats.accuracyToday}% acerto
              </p>
            )}
          </div>

          {/* Daily progress card */}
          {!stats.isLoading && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Progresso do dia</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {stats.questionsToday}/{dailyTarget}
                </span>
              </div>
              <Progress value={dailyPct} className="h-2" />
              {stats.questionsToday >= dailyTarget && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  🎉 Meta diária atingida!
                </p>
              )}
            </div>
          )}

          {/* Session card */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            {schedule.isLoading ? (
              <Skeleton className="h-6 w-48 rounded" />
            ) : (
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {areaOverride ? `Revisão: ${AREA_LABELS[areaOverride] ?? areaOverride}` : schedule.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {hasFullSessionAccess
                    ? `${schedule.questionCount} questões · 3 blocos`
                    : `${freeQuestionLimit} questões (degustação)`}
                </p>
              </div>
            )}

            {/* Free area locked paywall */}
            {isFree && isAreaLocked(effectiveArea) ? (
              <div className="rounded-lg border border-border p-4 space-y-3 text-center">
                <Crown className="h-5 w-5 text-amber-500 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Degustação encerrada</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assine o PRO para continuar sem limites.
                  </p>
                </div>
                <Button className="w-full gap-2" onClick={() => navigate('/plano')}>
                  <Crown className="h-4 w-4" />
                  Ver plano PRO
                </Button>
              </div>
            ) : (
              <>
                {!hasFullSessionAccess && (
                  <div className="rounded-lg border border-border p-3 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">Sessões completas de 20 questões</p>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/plano')}>
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                      Ver planos
                    </Button>
                  </div>
                )}
                {hasSavedSession ? (
                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={resumeSession}
                    >
                      Continuar estudo
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        startSession(
                          effectiveArea,
                          hasFullSessionAccess ? undefined : freeQuestionLimit,
                          false,
                          true
                        )
                      }
                      title="Resetar"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full gap-2"
                    disabled={schedule.isLoading}
                    onClick={() => startSession(effectiveArea, hasFullSessionAccess ? undefined : freeQuestionLimit)}
                  >
                    Iniciar Sessão
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Weak topics */}
          {!stats.isLoading && weakTopics.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  Tópicos para reforçar
                </h3>
                <button
                  onClick={() => navigate('/errors')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                >
                  Ver todos
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-2">
                {weakTopics.map((t: any, i: number) => {
                  const topicLabel = t.topic?.includes('__')
                    ? t.topic.split('__').pop()
                    : t.topic;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{topicLabel}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.area}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-destructive/70"
                            style={{ width: `${Math.round(t.priority * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Flashcard line */}
          <button
            onClick={() => {
              if (flashcards.totalDue > 0) {
                flashcards.startReview();
                setFlashcardMode(true);
              }
            }}
            disabled={flashcards.totalDue === 0}
            className="w-full flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-default"
          >
            <div className="flex items-center gap-2.5">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Flashcards</span>
              <span className="text-xs text-muted-foreground">
                {flashcards.totalDue > 0 ? `${flashcards.totalDue} pendentes` : 'Nenhum pendente'}
              </span>
            </div>
            {flashcards.totalDue > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </button>
          {!hasAutoFlashcards && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 -mt-4 ml-1">
              <Crown className="h-3 w-3 text-amber-500" />
              Flashcards automáticos: Plano Pro
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Objectives;
