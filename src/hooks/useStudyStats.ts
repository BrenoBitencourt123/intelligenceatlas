import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DIAGNOSTIC_QUESTIONS_PER_AREA = 60;

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

      // Total questions in bank (global, not user-specific)
      const { count: totalQuestions } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      const { data: topicProfiles } = await supabase
        .from('user_topic_profile')
        .select('area,topic,subtopic,level,attempts,correct,priority_score,next_review_at')
        .eq('user_id', user.id);

      const sortedByPriority = [...(topicProfiles || [])].sort((a, b) => b.priority_score - a.priority_score);
      const topWeaknesses = sortedByPriority.slice(0, 5).map((row) => ({
        area: row.area,
        topic: row.topic,
        subtopic: row.subtopic,
        priority: row.priority_score,
      }));

      const topStrengths = [...(topicProfiles || [])]
        .map((row) => ({
          area: row.area,
          topic: row.topic,
          subtopic: row.subtopic,
          level: row.level,
          attempts: row.attempts,
          accuracy: row.attempts > 0 ? row.correct / row.attempts : 0,
        }))
        .filter((row) => row.attempts > 0)
        .sort((a, b) => {
          if (b.level !== a.level) return b.level - a.level;
          return b.accuracy - a.accuracy;
        })
        .slice(0, 5);

      const areaProgress = Object.values((topicProfiles || []).reduce((acc, row) => {
        const key = row.area;
        const current = acc[key] || { area: key, attempts: 0, correct: 0 };
        current.attempts += row.attempts;
        current.correct += row.correct;
        acc[key] = current;
        return acc;
      }, {} as Record<string, { area: string; attempts: number; correct: number }>)).map((row) => ({
        area: row.area,
        attempts: row.attempts,
        accuracy: row.attempts > 0 ? Math.round((row.correct / row.attempts) * 100) : 0,
        diagnosticProgressPct: Math.min(100, Math.round((row.attempts / DIAGNOSTIC_QUESTIONS_PER_AREA) * 100)),
        inDiagnosticMode: row.attempts < DIAGNOSTIC_QUESTIONS_PER_AREA,
      }));

      const overdueReviews = (topicProfiles || []).filter((row) => (
        row.next_review_at && row.next_review_at <= `${today}T23:59:59`
      )).length;

      return {
        questionsToday,
        correctToday,
        accuracyToday,
        flashcardsDue: flashcardsDue ?? 0,
        flashcardsReviewed: flashcardsReviewed ?? 0,
        streak,
        totalQuestions: totalQuestions ?? 0,
        topWeaknesses,
        topStrengths,
        areaProgress,
        overdueReviews,
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
    topWeaknesses: data?.topWeaknesses ?? [],
    topStrengths: data?.topStrengths ?? [],
    areaProgress: data?.areaProgress ?? [],
    overdueReviews: data?.overdueReviews ?? 0,
    diagnosticThreshold: DIAGNOSTIC_QUESTIONS_PER_AREA,
    isLoading,
  };
}
