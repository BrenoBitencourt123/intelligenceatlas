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

      // Today's attempts (exclude extra-session attempts so they don't affect daily metrics)
      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('is_correct')
        .eq('user_id', user.id)
        .eq('session_date', today)
        .eq('extra_session', false);

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

      // Streak: dias consecutivos com qualquer atividade (sessions + essays + trilha)
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('session_date')
        .eq('user_id', user.id)
        .eq('is_extra', false)
        .order('session_date', { ascending: false })
        .limit(60);

      const { data: essays } = await supabase
        .from('essays')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(60);

      // BUGFIX: incluir respostas da trilha (dias só na trilha também mantêm o fogo)
      const { data: trilhaResp } = await (supabase as unknown as { from: (t: string) => any })
        .from('trilha_respostas')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      // Freezes já usados
      const { data: freezesData } = await (supabase as unknown as { from: (t: string) => any })
        .from('streak_freezes')
        .select('used_on, iso_week')
        .eq('user_id', user.id);

      const activeDays = new Set<string>();
      sessions?.forEach((s: { session_date: string }) => activeDays.add(s.session_date));
      essays?.forEach((e: { created_at: string }) => activeDays.add(e.created_at.split('T')[0]));
      (trilhaResp as { created_at: string }[] | null)?.forEach((r) =>
        activeDays.add(r.created_at.split('T')[0]),
      );

      const frozenWeeks = new Set<string>(
        ((freezesData as { iso_week: string }[]) ?? []).map((f) => f.iso_week),
      );
      const frozenDays = new Set<string>(
        ((freezesData as { used_on: string }[]) ?? []).map((f) => f.used_on),
      );

      const dayStr = (d: Date) => d.toISOString().split('T')[0];
      const isoWeekKey = (d: Date): string => {
        const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = dt.getUTCDay() || 7;
        dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${dt.getUTCFullYear()}-${String(weekNum).padStart(2, '0')}`;
      };
      const isoWeekPastDays = (gap: Date, today: Date): string[] => {
        const dayNum = gap.getDay() || 7;
        const monday = new Date(gap);
        monday.setDate(gap.getDate() - (dayNum - 1));
        const out: string[] = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          if (day <= today) out.push(dayStr(day));
        }
        return out;
      };

      const now = new Date();
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const freezesToCreate: { user_id: string; used_on: string; iso_week: string }[] = [];

      let streak = 0;
      const cursor = new Date(todayDate);
      if (!activeDays.has(dayStr(cursor))) cursor.setDate(cursor.getDate() - 1);

      // Máx 60 iterações — não travar em conta usuário-fantasma
      for (let i = 0; i < 60; i++) {
        const key = dayStr(cursor);
        if (activeDays.has(key) || frozenDays.has(key)) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        // Dia vazio — pode ser perdoado?
        const week = isoWeekKey(cursor);
        if (frozenWeeks.has(week)) {
          streak++;
          frozenDays.add(key);
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        const weekDays = isoWeekPastDays(cursor, todayDate);
        const outrosBuracos = weekDays.filter(
          (dstr) => dstr !== key && !activeDays.has(dstr) && !frozenDays.has(dstr),
        ).length;
        if (outrosBuracos === 0) {
          // Único buraco na semana → freeze automático
          freezesToCreate.push({ user_id: user.id, used_on: key, iso_week: week });
          frozenWeeks.add(week);
          frozenDays.add(key);
          streak++;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      }

      // Grava os freezes gerados (idempotente via UNIQUE user_id+iso_week)
      if (freezesToCreate.length > 0) {
        await (supabase as unknown as { from: (t: string) => any })
          .from('streak_freezes')
          .upsert(freezesToCreate, { onConflict: 'user_id,iso_week', ignoreDuplicates: true });
      }

      // Freezes usados na semana ISO atual (para exibição na tela de streak)
      const currentWeek = isoWeekKey(todayDate);
      const frozenDaysThisWeek = Array.from(frozenDays).filter(
        (d) => isoWeekKey(new Date(d + 'T12:00:00')) === currentWeek,
      );


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
        frozenDaysThisWeek,
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
    frozenDaysThisWeek: data?.frozenDaysThisWeek ?? [],
    diagnosticThreshold: DIAGNOSTIC_QUESTIONS_PER_AREA,
    isLoading,
  };
}
