import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const FREE_DAILY_QUESTIONS = 10;
export const FREE_WEEKLY_ESSAYS = 1;
export const WELCOME_BONUS_ESSAYS = 2; // 2 redações na primeira semana

interface FreemiumUsage {
  questionsUsedToday: number;
  questionsRemainingToday: number;
  canAskQuestion: boolean;
  essaysUsedThisWeek: number;
  weeklyEssayLimit: number; // 1 normalmente, 2 na primeira semana (bônus)
  essaysRemainingThisWeek: number;
  canSubmitEssay: boolean;
  isWelcomeBonus: boolean; // true se o usuário criou conta há menos de 7 dias
  isLoading: boolean;
}

export function useFreemiumUsage(): FreemiumUsage {
  const { user, profile } = useAuth();
  const [questionsUsedToday, setQuestionsUsedToday] = useState(0);
  const [essaysUsedThisWeek, setEssaysUsedThisWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    Promise.all([
      // Questões respondidas hoje (sessão extra do Pro não conta para a cota)
      supabase
        .from('question_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('session_date', today)
        .eq('extra_session', false),

      // Redações analisadas nos últimos 7 dias
      supabase
        .from('essays')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('analyzed_at', 'is', null)
        .gte('analyzed_at', sevenDaysAgo),
    ])
      .then(([questionsRes, essaysRes]) => {
        setQuestionsUsedToday(questionsRes.count ?? 0);
        setEssaysUsedThisWeek(essaysRes.count ?? 0);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [user]);

  // Bônus de boas-vindas: conta criada há menos de 7 dias
  const isWelcomeBonus = (() => {
    if (!profile?.created_at) return false;
    const createdAt = new Date(profile.created_at);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return createdAt >= sevenDaysAgo;
  })();

  const weeklyEssayLimit = isWelcomeBonus ? WELCOME_BONUS_ESSAYS : FREE_WEEKLY_ESSAYS;
  const questionsRemainingToday = Math.max(0, FREE_DAILY_QUESTIONS - questionsUsedToday);
  const essaysRemainingThisWeek = Math.max(0, weeklyEssayLimit - essaysUsedThisWeek);

  return {
    questionsUsedToday,
    questionsRemainingToday,
    canAskQuestion: questionsUsedToday < FREE_DAILY_QUESTIONS,
    essaysUsedThisWeek,
    weeklyEssayLimit,
    essaysRemainingThisWeek,
    canSubmitEssay: essaysUsedThisWeek < weeklyEssayLimit,
    isWelcomeBonus,
    isLoading,
  };
}
