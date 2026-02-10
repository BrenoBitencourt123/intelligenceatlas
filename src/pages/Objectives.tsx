import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStudySchedule } from '@/hooks/useStudySchedule';
import { useStudySession } from '@/hooks/useStudySession';
import { ArrowRight, Brain, Check, HelpCircle, ListChecks, Loader2, RotateCcw, X } from 'lucide-react';

const BLOCK_COLORS = [
  'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'bg-green-500/10 text-green-700 dark:text-green-300',
];

const Objectives = () => {
  const schedule = useStudySchedule();
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

            <Progress value={progress} className="h-1.5" />

            {/* Question */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5">Q{currentQuestion.number}</Badge>
                  <p className="text-sm leading-relaxed">{currentQuestion.statement}</p>
                </div>

                {/* Alternatives */}
                <div className="space-y-2">
                  {alternatives.map((alt) => {
                    let variant = 'outline' as const;
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
                        onClick={() => !showFeedback && answerQuestion(alt.letter)}
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

                {/* Feedback / Explanation */}
                {showFeedback && currentQuestion.explanation && (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Explicação:</p>
                    {currentQuestion.explanation}
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
                  onClick={() => answerQuestion(null)}
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

  // Idle screen
  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Questões Objetivas</h1>

          <Card className="border-2 border-primary/20 bg-card">
            <CardContent className="p-6 space-y-3">
              <h2 className="text-lg font-semibold">Área do dia: {schedule.label}</h2>
              <p className="text-sm text-muted-foreground">
                Até {schedule.questionCount} questões divididas em 3 blocos
              </p>
              <Button
                className="w-full gap-2"
                onClick={() => startSession(schedule.area)}
              >
                Iniciar Sessão
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Objectives;
