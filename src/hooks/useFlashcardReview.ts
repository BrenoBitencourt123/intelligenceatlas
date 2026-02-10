import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  area: string | null;
  interval_days: number;
  ease_factor: number;
  review_count: number;
}

type ReviewState = 'loading' | 'reviewing' | 'revealed' | 'done';

const SRS_INTERVALS = [1, 2, 4, 7, 15, 30];

function getNextInterval(currentInterval: number, rating: 'again' | 'hard' | 'easy'): number {
  if (rating === 'again') return 1;
  if (rating === 'hard') return currentInterval;

  // Easy: advance to next interval in the sequence
  const currentIdx = SRS_INTERVALS.indexOf(currentInterval);
  if (currentIdx === -1) {
    // Find closest
    const closest = SRS_INTERVALS.findIndex(i => i >= currentInterval);
    return SRS_INTERVALS[Math.min(closest + 1, SRS_INTERVALS.length - 1)] ?? 30;
  }
  return SRS_INTERVALS[Math.min(currentIdx + 1, SRS_INTERVALS.length - 1)];
}

export function useFlashcardReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewState, setReviewState] = useState<ReviewState>('loading');
  const [reviewed, setReviewed] = useState(0);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['flashcards-due', user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('flashcards')
        .select('id, front, back, area, interval_days, ease_factor, review_count')
        .eq('user_id', user.id)
        .lte('next_review', today)
        .order('next_review', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Flashcard[];
    },
    enabled: !!user,
  });

  const currentCard = cards[currentIndex] ?? null;
  const totalDue = cards.length;

  const reveal = useCallback(() => {
    setReviewState('revealed');
  }, []);

  const rate = useCallback(async (rating: 'again' | 'hard' | 'easy') => {
    if (!currentCard || !user) return;

    const newInterval = getNextInterval(currentCard.interval_days, rating);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);
    const nextReviewStr = nextReview.toISOString().split('T')[0];

    // Adjust ease factor
    let newEase = Number(currentCard.ease_factor);
    if (rating === 'again') newEase = Math.max(1.3, newEase - 0.2);
    else if (rating === 'easy') newEase = Math.min(3.0, newEase + 0.1);

    try {
      // Update flashcard
      await supabase.from('flashcards').update({
        interval_days: newInterval,
        next_review: nextReviewStr,
        ease_factor: newEase,
        review_count: currentCard.review_count + 1,
      }).eq('id', currentCard.id);

      // Record review
      await supabase.from('flashcard_reviews').insert({
        user_id: user.id,
        flashcard_id: currentCard.id,
        rating,
      });

      setReviewed(prev => prev + 1);

      if (currentIndex + 1 >= totalDue) {
        setReviewState('done');
        queryClient.invalidateQueries({ queryKey: ['study-stats'] });
        queryClient.invalidateQueries({ queryKey: ['flashcards-due'] });
      } else {
        setCurrentIndex(prev => prev + 1);
        setReviewState('reviewing');
      }
    } catch (err) {
      console.error('Error saving review:', err);
      toast.error('Erro ao salvar revisão');
    }
  }, [currentCard, user, currentIndex, totalDue, queryClient]);

  const startReview = useCallback(() => {
    setCurrentIndex(0);
    setReviewed(0);
    setReviewState('reviewing');
  }, []);

  // Auto-start when cards load
  if (!isLoading && reviewState === 'loading' && cards.length > 0) {
    setReviewState('reviewing');
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
    reveal,
    rate,
    startReview,
  };
}
