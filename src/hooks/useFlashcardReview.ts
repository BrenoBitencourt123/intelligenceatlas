import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  area: string | null;
  topic: string;
  subtopic: string;
  level: number;
  interval_days: number;
  review_count: number;
  correct_count: number;
  wrong_count: number;
  dont_know_count: number;
  next_review_at: string;
  last_seen_at: string | null;
  image_url: string | null;
  example_context: string | null;
}

interface FlashcardMetrics {
  dueToday: number;
  intervalBuckets: { d1: number; d3: number; d7: number; d14: number; d30: number };
  weakTopics: Array<{
    topic: string;
    subtopic: string;
    wrongRate: number;
    reviews: number;
  }>;
  retentionPct: number;
}

type ReviewState = 'loading' | 'reviewing' | 'revealed' | 'done';

export function useFlashcardReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewState, setReviewState] = useState<ReviewState>('loading');
  const [reviewed, setReviewed] = useState(0);
  const [cardShownAt, setCardShownAt] = useState<number>(Date.now());
  const [totalReviewSeconds, setTotalReviewSeconds] = useState(0);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['flashcards-smart-due', user?.id, today],
    queryFn: async () => {
      if (!user) return { cards: [] as Flashcard[], metrics: null as FlashcardMetrics | null };

      const { data, error } = await supabase.functions.invoke('flashcards-smart', {
        body: { action: 'get_due' },
      });

      if (error) throw error;
      return {
        cards: (data?.cards ?? []) as Flashcard[],
        metrics: (data?.metrics ?? null) as FlashcardMetrics | null,
      };
    },
    enabled: !!user,
  });

  const cards = data?.cards ?? [];
  const metrics = data?.metrics;
  const currentCard = cards[currentIndex] ?? null;
  const totalDue = cards.length;

  const nextIntervals = useMemo(() => {
    const list = cards.slice(0, 5).map((card) => card.interval_days);
    return list;
  }, [cards]);

  const reveal = useCallback(() => {
    setReviewState('revealed');
  }, []);

  const rate = useCallback(async (rating: 'again' | 'hard' | 'easy') => {
    if (!currentCard || !user) return;

    const responseTimeSec = Math.max(1, Math.round((Date.now() - cardShownAt) / 1000));

    try {
      const { error } = await supabase.functions.invoke('flashcards-smart', {
        body: {
          action: 'review',
          flashcardId: currentCard.id,
          rating,
          responseTimeSec,
        },
      });
      if (error) throw error;

      setReviewed((prev) => prev + 1);
      setTotalReviewSeconds((prev) => prev + responseTimeSec);

      if (currentIndex + 1 >= totalDue) {
        setReviewState('done');
        queryClient.invalidateQueries({ queryKey: ['study-stats'] });
        queryClient.invalidateQueries({ queryKey: ['flashcards-smart-due'] });
      } else {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setCardShownAt(Date.now());
        setReviewState('reviewing');
      }
    } catch (err) {
      console.error('Error saving review:', err);
      toast.error('Erro ao salvar revisao');
    }
  }, [cardShownAt, currentCard, currentIndex, queryClient, totalDue, user]);

  const startReview = useCallback(() => {
    setCurrentIndex(0);
    setReviewed(0);
    setTotalReviewSeconds(0);
    setCardShownAt(Date.now());
    setReviewState('reviewing');
  }, []);

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (!isLoading && reviewState === 'loading' && cards.length > 0) {
    setReviewState('reviewing');
    setCardShownAt(Date.now());
  } else if (!isLoading && reviewState === 'loading' && cards.length === 0) {
    setReviewState('done');
  }

  return {
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
    reload,
  };
}
