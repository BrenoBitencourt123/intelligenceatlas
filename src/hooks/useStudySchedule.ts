import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type StudyArea = 'matematica' | 'linguagens' | 'natureza' | 'humanas';
type SessionType = 'objetivas' | 'redacao' | 'simulado' | 'descanso';

interface DayScheduleResult {
  area: StudyArea | 'mista' | null;
  sessionType: SessionType;
  questionCount: number;
  label: string;
  dayName: string;
  isObjectiveDay: boolean;
  isEssayDay: boolean;
  isRestDay: boolean;
  isLoading: boolean;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const AREA_LABELS: Record<string, string> = {
  matematica: 'Matemática',
  linguagens: 'Linguagens',
  natureza: 'Ciências da Natureza',
  humanas: 'Ciências Humanas',
};

// Fallback hard-coded (usado quando user_preferences não existe)
const FALLBACK: Record<number, Omit<DayScheduleResult, 'isLoading'>> = {
  1: { area: 'matematica', sessionType: 'objetivas', questionCount: 20, label: 'Matemática', dayName: 'Segunda', isObjectiveDay: true, isEssayDay: false, isRestDay: false },
  2: { area: 'linguagens', sessionType: 'objetivas', questionCount: 20, label: 'Linguagens', dayName: 'Terça', isObjectiveDay: true, isEssayDay: false, isRestDay: false },
  3: { area: 'natureza', sessionType: 'objetivas', questionCount: 20, label: 'Ciências da Natureza', dayName: 'Quarta', isObjectiveDay: true, isEssayDay: false, isRestDay: false },
  4: { area: 'humanas', sessionType: 'objetivas', questionCount: 20, label: 'Ciências Humanas', dayName: 'Quinta', isObjectiveDay: true, isEssayDay: false, isRestDay: false },
  5: { area: 'matematica', sessionType: 'objetivas', questionCount: 20, label: 'Matemática', dayName: 'Sexta', isObjectiveDay: true, isEssayDay: false, isRestDay: false },
  6: { area: 'mista', sessionType: 'simulado', questionCount: 90, label: 'Simulado', dayName: 'Sábado', isObjectiveDay: true, isEssayDay: false, isRestDay: false },
  0: { area: null, sessionType: 'descanso', questionCount: 0, label: 'Descanso Ativo', dayName: 'Domingo', isObjectiveDay: false, isEssayDay: false, isRestDay: true },
};

const DAY_NAMES_PT: Record<number, string> = {
  0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado',
};

function buildObjectiveSchedule(area: StudyArea, questionCount: number, dayOfWeek: number): Omit<DayScheduleResult, 'isLoading'> {
  return {
    area,
    sessionType: 'objetivas',
    questionCount,
    label: AREA_LABELS[area] ?? area,
    dayName: DAY_NAMES_PT[dayOfWeek],
    isObjectiveDay: true,
    isEssayDay: false,
    isRestDay: false,
  };
}

export function useStudySchedule(): DayScheduleResult {
  const { user } = useAuth();
  const dayOfWeek = new Date().getDay();
  const [result, setResult] = useState<DayScheduleResult>({ ...FALLBACK[dayOfWeek], isLoading: true });

  useEffect(() => {
    if (!user) {
      setResult({ ...FALLBACK[dayOfWeek], isLoading: false });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const todayName = DAY_NAMES[dayOfWeek];

        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('day_schedule, daily_questions_target')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;

        const todayAreas: string[] = (prefs?.day_schedule as Record<string, string[]> | null)?.[todayName] ?? [];
        const questionCount: number = prefs?.daily_questions_target ?? 20;

        // Sem preferências ou dia sem área definida → fallback com questionCount personalizado
        if (todayAreas.length === 0) {
          const fallback = FALLBACK[dayOfWeek];
          setResult({ ...fallback, questionCount: fallback.questionCount || questionCount, isLoading: false });
          return;
        }

        // Uma única área definida → usa diretamente
        if (todayAreas.length === 1) {
          setResult({ ...buildObjectiveSchedule(todayAreas[0] as StudyArea, questionCount, dayOfWeek), isLoading: false });
          return;
        }

        // Múltiplas áreas → busca priority_score para escolher a mais urgente
        const { data: profiles } = await supabase
          .from('user_topic_profile')
          .select('area, priority_score')
          .eq('user_id', user.id)
          .in('area', todayAreas);

        if (cancelled) return;

        // Calcula prioridade média por área
        const sumByArea: Record<string, number> = {};
        const countByArea: Record<string, number> = {};
        for (const p of profiles ?? []) {
          sumByArea[p.area] = (sumByArea[p.area] ?? 0) + (p.priority_score ?? 0);
          countByArea[p.area] = (countByArea[p.area] ?? 0) + 1;
        }

        // Área com maior priority_score médio = mais precisa de atenção
        // Áreas sem dados = 0.5 (neutro, prioridade padrão)
        const best = todayAreas.reduce((b, a) => {
          const scoreA = countByArea[a] ? sumByArea[a] / countByArea[a] : 0.5;
          const scoreB = countByArea[b] ? sumByArea[b] / countByArea[b] : 0.5;
          return scoreA > scoreB ? a : b;
        }, todayAreas[0]);

        setResult({ ...buildObjectiveSchedule(best as StudyArea, questionCount, dayOfWeek), isLoading: false });
      } catch {
        if (!cancelled) {
          setResult({ ...FALLBACK[dayOfWeek], isLoading: false });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, dayOfWeek]);

  return result;
}
