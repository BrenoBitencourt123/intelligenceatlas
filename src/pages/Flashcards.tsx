import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFlashcardReview } from '@/hooks/useFlashcardReview';
import { Check, Eye, RotateCcw, Trash2, Zap } from 'lucide-react';
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
    totalReviewSeconds,
    reveal,
    rate,
  } = useFlashcardReview();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAll = async () => {
    if (!confirm('Tem certeza que deseja deletar todos os flashcards? Esta ação não pode ser desfeita.')) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('clean-flashcards');
      if (error) throw error;
      toast.success('Todos os flashcards foram deletados');
      window.location.reload();
    } catch {
      toast.error('Erro ao deletar flashcards');
    } finally {
      setIsDeleting(false);
    }
  };

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
        <div className="container max-w-lg mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-1 w-full" />
          <Skeleton className="h-[280px] w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  // Done state
  if (reviewState === 'done') {
    return (
      <MainLayout>
        <div className="container max-w-lg mx-auto px-4 py-10">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Flashcards</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Limpar
              </Button>
            </div>

            {/* Inline stats */}
            {metrics && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{metrics.dueToday} pendentes</span>
                <span className="text-border">·</span>
                <span>{metrics.retentionPct}% retenção</span>
                <span className="text-border">·</span>
                <span>{Math.round(totalReviewSeconds / 60)}min hoje</span>
              </div>
            )}

            {/* Main message */}
            <div className="rounded-2xl border border-border/50 bg-card p-10 text-center space-y-4">
              {reviewed > 0 ? (
                <>
                  <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mx-auto">
                    <Check className="h-7 w-7 text-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">Revisão completa</h2>
                  <p className="text-sm text-muted-foreground">
                    {reviewed} flashcard{reviewed !== 1 ? 's' : ''} revisado{reviewed !== 1 ? 's' : ''} hoje.
                  </p>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mx-auto">
                    <Zap className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">Nenhum card pendente</h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Flashcards são gerados automaticamente quando você erra questões. Continue estudando!
                  </p>
                </>
              )}
            </div>

            {/* Weak topics */}
            {metrics && metrics.weakTopics.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Tópicos com maior falha
                </p>
                <div className="space-y-1">
                  {metrics.weakTopics.map((topic, idx) => (
                    <div
                      key={`${topic.topic}-${topic.subtopic}-${idx}`}
                      className="flex items-center justify-between text-sm py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <span className="text-foreground">
                        {topic.topic}{topic.subtopic ? ` › ${topic.subtopic}` : ''}
                      </span>
                      <span className="text-muted-foreground font-medium tabular-nums">
                        {Math.round(topic.wrongRate * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
        <div className="container max-w-lg mx-auto px-4 py-10">
          <div className="space-y-6">
            {/* Header + progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Flashcards</h1>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {currentIndex + 1} de {totalDue}
                </span>
              </div>
              <Progress value={progressValue} className="h-0.5" />
            </div>

            {/* Flashcard */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm min-h-[260px] flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                {/* Meta badges */}
                <div className="flex items-center gap-2 mb-4">
                  {currentCard.area && (
                    <Badge variant="secondary" className="text-[11px] font-medium rounded-md">
                      {currentCard.area}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[11px] font-medium rounded-md border-border/50">
                    {formatLevelLabel(currentCard.level)}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-medium rounded-md border-border/50">
                    {intervalLabel(currentCard.interval_days)}
                  </Badge>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center">
                  {!isFlipped ? (
                    <MarkdownText
                      content={currentCard.front}
                      className="text-lg font-medium leading-relaxed text-foreground"
                    />
                  ) : (
                    <div className="space-y-5">
                      <MarkdownText
                        content={currentCard.front}
                        className="text-sm leading-relaxed text-muted-foreground"
                      />
                      <div className="h-px bg-border/50" />
                      <MarkdownText
                        content={currentCard.back}
                        className="text-base leading-relaxed text-foreground"
                      />
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {currentCard.correct_count} acertos · {currentCard.wrong_count + currentCard.dont_know_count} falhas
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {reviewState === 'reviewing' ? (
              <Button className="w-full h-12 rounded-xl text-sm font-medium" onClick={handleReveal}>
                <Eye className="h-4 w-4 mr-2" />
                Revelar Resposta
              </Button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRate('again')}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Não lembrei
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-xl"
                  onClick={() => handleRate('hard')}
                >
                  Com esforço
                </Button>
                <Button
                  className="h-12 rounded-xl"
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
