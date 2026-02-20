import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFlashcardReview } from '@/hooks/useFlashcardReview';
import { Brain, Check, Eye, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import MarkdownText from '@/components/atlas/MarkdownText';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatLevelLabel, intervalLabel } from '@/lib/flashcardsSrs';

const Flashcards = () => {
  const {
    reviewState,
    currentCard,
    currentIndex,
    totalDue,
    reviewed,
    isLoading,
    metrics,
    nextIntervals,
    totalReviewSeconds,
    reveal,
    rate,
    startReview,
  } = useFlashcardReview();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAll = async () => {
    if (!confirm('Tem certeza que deseja deletar todos os flashcards? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('clean-flashcards');
      if (error) throw error;
      
      toast.success('Todos os flashcards foram deletados');
      // Reload page to refresh state
      window.location.reload();
    } catch (err: any) {
      console.error('Error deleting flashcards:', err);
      toast.error('Erro ao deletar flashcards');
    } finally {
      setIsDeleting(false);
    }
  };

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
        <div className="container max-w-2xl mx-auto px-4 py-8 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-1.5 w-full" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
          <Card className="min-h-[240px]">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </MainLayout>
    );
  }

  // Done state
  if (reviewState === 'done') {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
            {metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="bg-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Pendentes hoje</p>
                    <p className="text-2xl font-bold">{metrics.dueToday}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Retencao estimada</p>
                    <p className="text-2xl font-bold">{metrics.retentionPct}%</p>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Tempo hoje</p>
                    <p className="text-2xl font-bold">{Math.round(totalReviewSeconds / 60)}m</p>
                  </CardContent>
                </Card>
              </div>
            )}
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
            {metrics && metrics.weakTopics.length > 0 && (
              <Card className="bg-card">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold">Topicos com maior falha</p>
                  <div className="space-y-2">
                    {metrics.weakTopics.map((topic, idx) => (
                      <div key={`${topic.topic}-${topic.subtopic}-${idx}`} className="flex items-center justify-between text-sm rounded border px-3 py-2">
                        <span>{topic.topic}{topic.subtopic ? ` > ${topic.subtopic}` : ''}</span>
                        <span className="text-muted-foreground">{Math.round(topic.wrongRate * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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

            {metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Card className="bg-card">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                    <p className="font-semibold">{metrics.dueToday}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Retencao</p>
                    <p className="font-semibold">{metrics.retentionPct}%</p>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Prox. intervalos</p>
                    <p className="font-semibold">{nextIntervals.slice(0, 3).map(intervalLabel).join(' • ') || '-'}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Card */}
            <Card className="min-h-[240px] flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {currentCard.area && (
                    <Badge variant="secondary" className="text-xs">{currentCard.area}</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{formatLevelLabel(currentCard.level)}</Badge>
                  <Badge variant="outline" className="text-xs">{intervalLabel(currentCard.interval_days)}</Badge>
                </div>

                <div className="text-xs text-muted-foreground mb-2">
                  {currentCard.topic}{currentCard.subtopic ? ` > ${currentCard.subtopic}` : ''}
                </div>

                {!isFlipped ? (
                  <MarkdownText content={currentCard.front} className="text-lg font-medium leading-relaxed" />
                ) : (
                  <div className="space-y-4">
                    <MarkdownText content={currentCard.front} className="text-base leading-relaxed text-muted-foreground" />
                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Resposta</p>
                      <MarkdownText content={currentCard.back} className="text-base leading-relaxed" />
                    </div>
                    {currentCard.image_url && (
                      <img
                        src={currentCard.image_url}
                        alt="Contexto visual do flashcard"
                        className="w-full rounded border object-contain"
                        loading="lazy"
                      />
                    )}
                    {currentCard.example_context && (
                      <div className="rounded border p-3 text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Contexto da questao</p>
                        <p>{currentCard.example_context}</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Performance: {currentCard.correct_count} acertos • {currentCard.wrong_count + currentCard.dont_know_count} falhas
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
