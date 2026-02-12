import { useState } from 'react';
import { PdfViewerModal } from '@/components/atlas/PdfViewerModal';
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
import MarkdownText from '@/components/atlas/MarkdownText';
import { useNavigate } from 'react-router-dom';

const BLOCK_COLORS = [
  'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'bg-green-500/10 text-green-700 dark:text-green-300',
];

const Objectives = () => {
  const navigate = useNavigate();
  const schedule = useStudySchedule();
  const stats = useStudyStats();
  const {
    hasFullSessionAccess,
    hasAutoFlashcards,
    hasKnowledgeCapsules,
    freeQuestionLimit,
    isFree,
    isPro,
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
    startSession,
    answerQuestion,
    nextQuestion,
    resetSession,
  } = useStudySession();
  const pdfUrl = useExamPdf(currentQuestion?.year);
  const flashcards = useFlashcardReview();
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  // Loading state
  if (state === 'loading') {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Carregando questões...</p>
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
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1}/{totalQuestions}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={resetSession}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {pdfUrl && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setPdfModalOpen(true)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver PDF da prova
                </Button>
                <PdfViewerModal
                  open={pdfModalOpen}
                  onOpenChange={setPdfModalOpen}
                  pdfUrl={pdfUrl}
                  title={`ENEM ${currentQuestion?.year} — Prova`}
                />
              </>
            )}

            <Progress value={progress} className="h-1.5" />

            {/* Question */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-2">
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <Badge variant="outline">Q{currentQuestion.number}</Badge>
                    <span className="text-xs text-muted-foreground">ENEM {currentQuestion.year}</span>
                  </div>
                  <MarkdownText content={currentQuestion.statement} className="text-sm leading-relaxed" />
                </div>

                {/* Alternatives */}
                <div className="space-y-2">
                  {alternatives.map((alt) => {
                    let extraClass = 'hover:bg-muted/50 cursor-pointer';

                    if (showFeedback) {
                      extraClass = 'cursor-default';
                      if (alt.letter === currentQuestion.correct_answer) {
                        extraClass = 'border-green-500 bg-green-500/10 cursor-default';
                      } else if (currentAnswer?.selected === alt.letter && !currentAnswer.correct) {
                        extraClass = 'border-red-500 bg-red-500/10 cursor-default';
                      }
                    } else if (currentAnswer?.selected === alt.letter) {
                      extraClass = 'border-primary bg-primary/10';
                    }

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
                        <span className="text-sm">{alt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Knowledge Capsule - Pro only */}
                {showFeedback && hasKnowledgeCapsules && (currentQuestion.explanation || (currentQuestion.tags && currentQuestion.tags.length > 0)) && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/10">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Cápsula de Conhecimento</span>
                    </div>
                    <div className="p-4 space-y-3">
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
                        <MarkdownText content={currentQuestion.explanation} className="text-sm text-muted-foreground leading-relaxed" />
                      )}
                    </div>
                  </div>
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
                <Button className="flex-1" onClick={nextQuestion}>
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

              <Card className="border-2 border-primary/20">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Frente</p>
                    <p className="text-sm leading-relaxed">{currentCard.front}</p>
                  </div>

                  {reviewState === 'revealed' && (
                    <div className="space-y-2 pt-4 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Verso</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentCard.back}</p>
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
              <h2 className="text-lg font-semibold">Área do dia: {schedule.label}</h2>
              <p className="text-sm text-muted-foreground">
                {hasFullSessionAccess
                  ? `Até ${schedule.questionCount} questões divididas em 3 blocos`
                  : `${freeQuestionLimit} questões (degustação gratuita)`}
              </p>
              {!hasFullSessionAccess && (
                <div className="rounded-lg border border-muted bg-muted/30 p-3 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">Sessões completas de 45 questões com 3 blocos</p>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/plano')}>
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    Ver planos
                  </Button>
                </div>
              )}
              <Button
                className="w-full gap-2"
                onClick={() => startSession(schedule.area, hasFullSessionAccess ? undefined : freeQuestionLimit)}
              >
                Iniciar Sessão
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

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
