import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStudySchedule } from '@/hooks/useStudySchedule';
import { useStudySession } from '@/hooks/useStudySession';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useFlashcardReview } from '@/hooks/useFlashcardReview';
import { useExamPdf } from '@/hooks/useExamPdf';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { ArrowRight, BookOpen, Brain, Check, Crown, FileText, HelpCircle, Loader2, RotateCcw, Target, X, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import MarkdownText from '@/components/atlas/MarkdownText';
import { useQuestionPedagogy } from '@/hooks/useQuestionPedagogy';
import { PreConceptBlock, PostAnswerBlocks } from '@/components/atlas/PedagogyBlocks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QuestionImageGallery } from '@/components/study/QuestionImageGallery';
import { InlineStatementRenderer } from '@/components/study/InlineStatementRenderer';

const BLOCK_COLORS = [
  'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'bg-green-500/10 text-green-700 dark:text-green-300',
];

const Objectives = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const previewQuestionId = searchParams.get('previewQuestionId');
  const schedule = useStudySchedule();
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
  const flashcards = useFlashcardReview();
  const [flashcardMode, setFlashcardMode] = useState(false);
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

  // Result screen
  if (state === 'result' && result) {
    const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Resultado da Sessão</h1>

            <Card className="border-2 border-primary/20">
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">{result.correct}/{result.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">{accuracy}% de acertos</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {result.blocks.map((block, i) => (
                    <div key={i} className={`rounded-lg p-3 text-center ${BLOCK_COLORS[i]}`}>
                      <p className="text-xs font-medium opacity-75">{blockLabels[i]}</p>
                      <p className="text-lg font-bold">{block.correct}/{block.total}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                  <span>⏱ {result.durationMinutes} min</span>
                  <span>🧠 {result.flashcardsGenerated} flashcards gerados</span>
                </div>
              </CardContent>
            </Card>

            {/* Suggest flashcard review after session */}
            {flashcards.totalDue > 0 && (
              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{flashcards.totalDue} flashcards para revisar</span>
                    </div>
                    <Button size="sm" onClick={() => { resetSession(); setFlashcardMode(true); }}>
                      Revisar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button className="w-full" onClick={resetSession}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Active question
  if (state === 'active' && currentQuestion) {
    const currentAnswer = answers[currentIndex];
    const alternatives = currentQuestion.alternatives as { letter: string; text: string }[];
    const warmSz = Math.max(1, Math.round(totalQuestions * 0.25));
    const consSz = Math.max(1, Math.round(totalQuestions * 0.25));
    const blockBounds = [0, warmSz, totalQuestions - consSz, totalQuestions];

    // Current block progress
    const currentBlockStart = blockBounds[currentBlock];
    const currentBlockEnd = blockBounds[currentBlock + 1];
    const currentBlockTotal = currentBlockEnd - currentBlockStart;
    const currentBlockAnswered = Object.keys(answers).filter((key) => {
      const i = Number(key);
      return i >= currentBlockStart && i < currentBlockEnd;
    }).length;
    const currentBlockPct = currentBlockTotal > 0
      ? Math.round((currentBlockAnswered / currentBlockTotal) * 100) : 0;

    // Handle next: intercept at block boundary
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

    // Block transition screen
    if (blockTransition !== null) {
      const nextBlockIndex = blockTransition.completedBlock + 1;
      const nextBlockTotal = blockBounds[nextBlockIndex + 1] - blockBounds[nextBlockIndex];
      const accuracy = blockTransition.total > 0
        ? Math.round((blockTransition.correct / blockTransition.total) * 100) : 0;
      const BLOCK_BG = [
        'bg-blue-500/10 border-blue-500/30',
        'bg-amber-500/10 border-amber-500/30',
        'bg-green-500/10 border-green-500/30',
      ];
      const CHECK_COLORS = ['text-blue-600 dark:text-blue-400', 'text-amber-600 dark:text-amber-400', 'text-green-600 dark:text-green-400'];
      return (
        <MainLayout>
          <div className="container max-w-md mx-auto px-4 py-8 pb-24 flex flex-col items-center justify-center min-h-[70vh]">
            <div className={`w-full rounded-2xl border p-6 space-y-6 ${BLOCK_BG[blockTransition.completedBlock]}`}>
              {/* Completed block header */}
              <div className="text-center space-y-1">
                <div className={`text-4xl font-bold ${CHECK_COLORS[blockTransition.completedBlock]}`}>✓</div>
                <h2 className="text-xl font-bold">
                  {blockLabels[blockTransition.completedBlock]} concluído!
                </h2>
              </div>

              {/* Score */}
              <div className="bg-background/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Acertos</span>
                  <span className="font-semibold">
                    {blockTransition.correct} de {blockTransition.total} · {accuracy}%
                  </span>
                </div>
                <Progress value={accuracy} className="h-2" />
              </div>

              {/* Separator + next block preview */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">A seguir</p>
                <div className="flex items-center gap-2">
                  <Badge className={BLOCK_COLORS[nextBlockIndex]}>
                    {nextBlockIndex + 1}
                  </Badge>
                  <span className="font-medium">{blockLabels[nextBlockIndex]}</span>
                  <span className="text-muted-foreground text-sm">· {nextBlockTotal} questões</span>
                </div>
              </div>

              {/* CTA */}
              <Button
                className="w-full"
                onClick={() => { setBlockTransition(null); nextQuestion(); }}
              >
                Iniciar {blockLabels[nextBlockIndex]}
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
              <div className="flex items-center gap-2">
                <Badge className={BLOCK_COLORS[currentBlock] || BLOCK_COLORS[0]}>
                  {blockLabels[currentBlock] || `Bloco ${currentBlock + 1}`}
                </Badge>
                {totalQuestions === 1 && (
                  <Badge variant="outline">Preview</Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1}/{totalQuestions}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitSessionView}
                title="Voltar para a tela de Objetivas"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {pdfAvailable && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={openPdf}
                disabled={pdfLoading}
              >
                <FileText className="h-3.5 w-3.5" />
                {pdfLoading ? 'Abrindo...' : 'Ver PDF da prova'}
              </Button>
            )}

            {/* Stepper + single block progress */}
            {totalQuestions > 1 && (
              <div className="space-y-2">
                {/* Step indicator */}
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        i < currentBlock
                          ? 'bg-green-500 text-white'
                          : i === currentBlock
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {i < currentBlock ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs hidden sm:inline ${
                        i === currentBlock ? 'font-medium text-foreground' : 'text-muted-foreground'
                      }`}>
                        {blockLabels[i]}
                      </span>
                      {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                    </div>
                  ))}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {currentBlockAnswered}/{currentBlockTotal}
                  </span>
                </div>
                {/* Single bar for current block */}
                <Progress value={currentBlockPct} className="h-1.5" />
              </div>
            )}

            {/* Question */}
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Split images: statement images vs alternative images */}
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
                      {/* Question number + year tag */}
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline">Q{currentQuestion.number}</Badge>
                        <span className="text-xs text-muted-foreground">ENEM {currentQuestion.year}</span>
                      </div>

                      {/* Statement with inline images at {{IMG_N}} positions */}
                      <InlineStatementRenderer
                        statement={currentQuestion.statement || ''}
                        images={statementImages}
                        questionNumber={currentQuestion.number}
                      />

                      {/* Pre-concept block - before alternatives */}
                      {hasKnowledgeCapsules && !showFeedback && (
                        <PreConceptBlock pedagogy={pedagogy} loading={pedagogyLoading} />
                      )}

                      {/* Alternatives */}
                      <div className="space-y-2">
                        {alternatives.map((alt) => {
                          let extraClass = 'hover:bg-muted/50 cursor-pointer';
                          const altImages = altImageMap.get(alt.letter) || [];
                          const hasAltImage = altImages.length > 0 || (alt as any).image_url;

                          if (showFeedback) {
                            extraClass = 'cursor-default';
                            if (alt.letter === currentQuestion.correct_answer) {
                              extraClass = 'border-green-500 bg-green-500/10 cursor-default';
                            } else if (currentAnswer?.selected === alt.letter && !currentAnswer.correct) {
                              extraClass = 'border-red-500 bg-red-500/10 cursor-default';
                            }
                          } else if (pendingGuessAnswer === alt.letter) {
                            extraClass = 'border-primary bg-primary/10 ring-2 ring-primary/30';
                          } else if (currentAnswer?.selected === alt.letter) {
                            extraClass = 'border-primary bg-primary/10';
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
                              className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3 ${extraClass}`}
                              onClick={() => !showFeedback && answerQuestion(alt.letter, hasAutoFlashcards)}
                              disabled={showFeedback}
                            >
                              <span className="font-bold text-sm shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
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

                {/* Post-answer pedagogical blocks - Pro only */}
                {showFeedback && hasKnowledgeCapsules && (
                  <>
                    {/* Tags */}
                    {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {currentQuestion.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Correct answer justification */}
                    {currentQuestion.explanation && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">Justificativa</span>
                        </div>
                        <div className="p-4">
                          <MarkdownText content={currentQuestion.explanation} className="text-sm text-muted-foreground leading-relaxed" />
                        </div>
                      </div>
                    )}

                    {/* AI-generated pedagogy blocks */}
                    <PostAnswerBlocks
                      pedagogy={pedagogy}
                      loading={pedagogyLoading}
                      showPostAnswer={true}
                    />
                  </>
                )}

                {/* Locked capsule hint for non-Pro */}
                {showFeedback && !hasKnowledgeCapsules && currentQuestion.explanation && (
                  <div className="rounded-lg border border-muted bg-muted/30 p-4 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Quer explicações detalhadas após cada questão?</p>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/plano')}>
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                      Plano Pro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex gap-2">
              {!showFeedback ? (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => answerQuestion(null, hasAutoFlashcards)}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Não sei
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleNext}>
                  {currentIndex + 1 >= totalQuestions ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Ver Resultado
                    </>
                  ) : (
                    <>
                      Próxima
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Inline flashcard review mode
  if (flashcardMode && flashcards.totalDue > 0) {
    const { reviewState, currentCard, currentIndex: fcIndex, totalDue, reviewed, reveal, rate } = flashcards;

    if (reviewState === 'done') {
      return (
        <MainLayout>
          <div className="container max-w-2xl mx-auto px-4 py-8">
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <span className="text-4xl">🎉</span>
                <h2 className="text-xl font-bold text-foreground">Revisão concluída!</h2>
                <p className="text-muted-foreground">{reviewed} flashcards revisados</p>
              </div>
              <Button className="w-full" onClick={() => setFlashcardMode(false)}>
                <ArrowRight className="h-4 w-4 mr-2" />
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
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Flashcards
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{fcIndex + 1}/{totalDue}</span>
                  <Button variant="ghost" size="sm" onClick={() => setFlashcardMode(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Card className="border-2 border-primary/20 min-h-[240px] flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col justify-center">
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
                      <div className="border-t pt-4">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Resposta</p>
                        <MarkdownText content={currentCard.back} className="text-base leading-relaxed" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {reviewState === 'reviewing' ? (
                <Button className="w-full" onClick={reveal}>
                  <Eye className="h-4 w-4 mr-2" />
                  Mostrar Resposta
                </Button>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="destructive" onClick={() => rate('again')} className="text-xs">
                    Não lembrei
                  </Button>
                  <Button variant="outline" onClick={() => rate('hard')} className="text-xs">
                    Com esforço
                  </Button>
                  <Button variant="default" onClick={() => rate('easy')} className="text-xs">
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

  // Idle screen with dashboard
  const questionLimit = hasFullSessionAccess ? schedule.questionCount : freeQuestionLimit;

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Questões Objetivas</h1>

          {/* Today's stats */}
          {!stats.isLoading && stats.questionsToday > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-card">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Target className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="text-xl font-bold">{stats.questionsToday}</span>
                  <span className="text-xs text-muted-foreground">Questões hoje</span>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Check className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="text-xl font-bold">{stats.accuracyToday}%</span>
                  <span className="text-xs text-muted-foreground">Acerto hoje</span>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Start session card */}
          <Card className="border-2 border-primary/20 bg-card">
            <CardContent className="p-6 space-y-3">
              {schedule.isLoading ? (
                <Skeleton className="h-6 w-48 rounded" />
              ) : (
                <h2 className="text-lg font-semibold">Área do dia: {schedule.label}</h2>
              )}
              <p className="text-sm text-muted-foreground">
                {hasFullSessionAccess
                  ? `Até ${schedule.questionCount} questões divididas em 3 blocos`
                  : `${freeQuestionLimit} questões (degustação gratuita)`}
              </p>

              {/* Free area locked paywall */}
              {isFree && isAreaLocked(schedule.area) ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4 space-y-3 text-center">
                   <Crown className="h-6 w-6 text-amber-500 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold">Degustação gratuita encerrada</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Você já usou suas {freeQuestionLimit} questões gratuitas.
                      Assine o PRO para continuar estudando sem limites.
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
                    <div className="rounded-lg border border-muted bg-muted/30 p-3 text-center space-y-2">
                      <p className="text-xs text-muted-foreground">Sessões de 20 questões com 3 blocos</p>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/plano')}>
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                        Ver planos
                      </Button>
                    </div>
                  )}
                  {hasSavedSession ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
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
                            schedule.area,
                            hasFullSessionAccess ? undefined : freeQuestionLimit,
                            false,
                            true
                          )
                        }
                        title="Resetar respostas de hoje"
                        aria-label="Resetar respostas de hoje"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full gap-2"
                      disabled={schedule.isLoading}
                      onClick={() => startSession(schedule.area, hasFullSessionAccess ? undefined : freeQuestionLimit)}
                    >
                      Iniciar Sessão
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="bg-card">
              <CardContent className="p-4 space-y-1">
                <Badge className={BLOCK_COLORS[0]}>Bloco 1</Badge>
                <p className="text-sm font-medium">Aquecimento</p>
                <p className="text-xs text-muted-foreground">
                  5 questões para entrar no ritmo e mapear o foco inicial.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4 space-y-1">
                <Badge className={BLOCK_COLORS[1]}>Bloco 2</Badge>
                <p className="text-sm font-medium">Aprendizado</p>
                <p className="text-xs text-muted-foreground">
                  10 questões para aprender e consolidar os conceitos.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4 space-y-1">
                <Badge className={BLOCK_COLORS[2]}>Bloco 3</Badge>
                <p className="text-sm font-medium">Consolidacao</p>
                <p className="text-xs text-muted-foreground">
                  5 questões finais para fixar e fechar com segurança.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Flashcards card */}
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Flashcards</p>
                    <p className="text-xs text-muted-foreground">
                      {flashcards.totalDue > 0
                        ? `${flashcards.totalDue} para revisar`
                        : 'Nenhum pendente'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={flashcards.totalDue > 0 ? 'default' : 'outline'}
                  disabled={flashcards.totalDue === 0}
                  onClick={() => { flashcards.startReview(); setFlashcardMode(true); }}
                >
                  Revisar
                </Button>
              </div>
              {!hasAutoFlashcards && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Crown className="h-3 w-3 text-amber-500" />
                  Flashcards automáticos em erros: Plano Pro
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Objectives;

