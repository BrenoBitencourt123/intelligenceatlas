import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFlashcardReview } from '@/hooks/useFlashcardReview';
import { Brain, Check, Eye, Loader2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import MarkdownText from '@/components/atlas/MarkdownText';

const Flashcards = () => {
  const {
    reviewState,
    currentCard,
    currentIndex,
    totalDue,
    reviewed,
    isLoading,
    reveal,
    rate,
    startReview,
  } = useFlashcardReview();
  const [isFlipped, setIsFlipped] = useState(false);

  // Handle reveal with flip animation state
  const handleReveal = () => {
    setIsFlipped(true);
    reveal();
  };

  const handleRate = async (rating: 'again' | 'hard' | 'easy') => {
    setIsFlipped(false);
    await rate(rating);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Done state
  if (reviewState === 'done') {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
            <Card className="bg-card">
              <CardContent className="p-8 text-center space-y-4">
                {reviewed > 0 ? (
                  <>
                    <Check className="h-12 w-12 mx-auto text-green-500" />
                    <h2 className="text-lg font-semibold">Revisão completa!</h2>
                    <p className="text-sm text-muted-foreground">
                      Você revisou {reviewed} flashcard{reviewed !== 1 ? 's' : ''} hoje.
                    </p>
                  </>
                ) : (
                  <>
                    <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Nenhum flashcard para revisar</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Flashcards são gerados automaticamente quando você erra questões objetivas. Continue estudando!
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Reviewing state
  if ((reviewState === 'reviewing' || reviewState === 'revealed') && currentCard) {
    const progressValue = totalDue > 0 ? Math.round((currentIndex / totalDue) * 100) : 0;

    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-foreground">Flashcards</h1>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1}/{totalDue}
              </span>
            </div>

            <Progress value={progressValue} className="h-1.5" />

            {/* Card */}
            <Card className="min-h-[240px] flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col justify-center">
                {currentCard.area && (
                  <Badge variant="secondary" className="self-start mb-3 text-xs">
                    {currentCard.area}
                  </Badge>
                )}

                {!isFlipped ? (
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

            {/* Actions */}
            {reviewState === 'reviewing' ? (
              <Button className="w-full" size="lg" onClick={handleReveal}>
                <Eye className="h-4 w-4 mr-2" />
                Revelar Resposta
              </Button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleRate('again')}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Não lembrei
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleRate('hard')}
                >
                  Com esforço
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => handleRate('easy')}
                >
                  Fácil
                </Button>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  return null;
};

export default Flashcards;
