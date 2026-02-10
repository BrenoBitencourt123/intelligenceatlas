import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useStudyStats() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['study-stats', user?.id, today],
    queryFn: async () => {
      if (!user) return null;

      // Today's attempts
      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('is_correct')
        .eq('user_id', user.id)
        .eq('session_date', today);

      const questionsToday = attempts?.length ?? 0;
      const correctToday = attempts?.filter(a => a.is_correct).length ?? 0;
      const accuracyToday = questionsToday > 0 ? Math.round((correctToday / questionsToday) * 100) : 0;

      // Flashcards due today
      const { count: flashcardsDue } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review', today);

      // Today's flashcard reviews
      const { count: flashcardsReviewed } = await supabase
        .from('flashcard_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('reviewed_at', `${today}T00:00:00`)
        .lt('reviewed_at', `${today}T23:59:59`);

      // Streak: count consecutive days with any study activity
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('session_date')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })
        .limit(60);

      // Also count essay days
      const { data: essays } = await supabase
        .from('essays')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(60);

      const activeDays = new Set<string>();
      sessions?.forEach(s => activeDays.add(s.session_date));
      essays?.forEach(e => activeDays.add(e.created_at.split('T')[0]));

      let streak = 0;
      const d = new Date();
      // Check if today has activity, if not start from yesterday
      if (!activeDays.has(d.toISOString().split('T')[0])) {
        d.setDate(d.getDate() - 1);
      }
      while (activeDays.has(d.toISOString().split('T')[0])) {
        streak++;
        d.setDate(d.getDate() - 1);
      }

      // Total questions in bank
      const { count: totalQuestions } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        questionsToday,
        correctToday,
        accuracyToday,
        flashcardsDue: flashcardsDue ?? 0,
        flashcardsReviewed: flashcardsReviewed ?? 0,
        streak,
        totalQuestions: totalQuestions ?? 0,
      };
    },
    enabled: !!user,
  });

  return {
    questionsToday: data?.questionsToday ?? 0,
    correctToday: data?.correctToday ?? 0,
    accuracyToday: data?.accuracyToday ?? 0,
    flashcardsDue: data?.flashcardsDue ?? 0,
    flashcardsReviewed: data?.flashcardsReviewed ?? 0,
    streak: data?.streak ?? 0,
    totalQuestions: data?.totalQuestions ?? 0,
    isLoading,
  };
}
