import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useStudySchedule } from './useStudySchedule';

export const AREA_LABELS: Record<string, string> = {
  matematica: 'Matemática',
  linguagens: 'Linguagens',
  natureza: 'Ciências da Natureza',
  humanas: 'Ciências Humanas',
};

const ALL_AREAS = ['matematica', 'linguagens', 'natureza', 'humanas'] as const;
const BLOCK_LABELS = ['Aquecimento', 'Aprendizado', 'Consolidação'] as const;

export interface DayBlock {
  blockLabel: string;
  topic: string;
  count: number;
}

export interface DayBlocksPlan {
  mainArea: string | null;
  mainAreaLabel: string;
  blocks: DayBlock[];
  reviewArea: string | null;
  reviewAreaLabel: string;
  hasReview: boolean;
  isMista: boolean;
  isRestDay: boolean;
  isObjectiveDay: boolean;
  isEssayDay: boolean;
  questionCount: number;
  dayName: string;
  label: string;
  isLoading: boolean;
}

export function useDayBlocks(): DayBlocksPlan {
  const { user } = useAuth();
  const schedule = useStudySchedule();
  const today = new Date().toISOString().split('T')[0];

  const mainArea =
    schedule.area && schedule.area !== 'mista' && !schedule.isRestDay
      ? schedule.area
      : null;

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['day-blocks', user?.id, mainArea, today],
    queryFn: async () => {
      if (!user || !mainArea) return null;

      const { data: profiles } = await supabase
        .from('user_topic_profile')
        .select('area, topic, priority_score, next_review_at, attempts')
        .eq('user_id', user.id);

      const allProfiles = profiles ?? [];

      // ─── Block topics for main area ───────────────────────────
      // Sort subtopics by priority (highest = weakest/most urgent)
      const mainProfiles = allProfiles
        .filter(p => p.area === mainArea && p.topic !== 'Geral' && p.attempts > 0)
        .sort((a, b) => b.priority_score - a.priority_score);

      // Block order for warm-up UX:
      //   Block 1 (Aquecimento)  → rank[2]: slightly less urgent — builds confidence
      //   Block 2 (Aprendizado)  → rank[0]: most urgent — peak focus
      //   Block 3 (Consolidação) → rank[1]: second most urgent — deepens work
      const getTopicAt = (rank: number): string =>
        mainProfiles[rank]?.topic ?? mainProfiles[0]?.topic ?? (AREA_LABELS[mainArea] ?? mainArea);

      const rankOrder = mainProfiles.length >= 3 ? [2, 0, 1] : [0, 0, 0];
      const blocks: DayBlock[] = BLOCK_LABELS.map((label, i) => ({
        blockLabel: label,
        topic: getTopicAt(rankOrder[i]),
        count: 5,
      }));

      // ─── Review area ──────────────────────────────────────────
      // Pick another area with the most overdue topics; fallback to highest priority sum
      const otherAreas = ALL_AREAS.filter(a => a !== mainArea);
      const overdueByArea: Record<string, number> = {};
      const sumPriorityByArea: Record<string, number> = {};

      for (const p of allProfiles) {
        if (p.area === mainArea) continue;
        if (p.next_review_at && p.next_review_at <= `${today}T23:59:59`) {
          overdueByArea[p.area] = (overdueByArea[p.area] ?? 0) + 1;
        }
        sumPriorityByArea[p.area] = (sumPriorityByArea[p.area] ?? 0) + p.priority_score;
      }

      const areasWithOverdue = otherAreas.filter(a => (overdueByArea[a] ?? 0) > 0);

      let reviewArea: string =
        areasWithOverdue.length > 0
          ? areasWithOverdue.reduce((best, a) =>
              (overdueByArea[a] ?? 0) > (overdueByArea[best] ?? 0) ? a : best,
            )
          : otherAreas.reduce(
              (best, a) =>
                (sumPriorityByArea[a] ?? 0) > (sumPriorityByArea[best] ?? 0) ? a : best,
              otherAreas[0] ?? 'humanas',
            );

      return { blocks, reviewArea };
    },
    enabled: !!user && !schedule.isLoading && !!mainArea,
    staleTime: 5 * 60 * 1000,
  });

  const isMista = schedule.area === 'mista';
  const isLoading =
    schedule.isLoading || (!!mainArea && !!user && queryLoading && !data);

  // Mista / rest day — pass through schedule data without block logic
  if (!mainArea) {
    return {
      mainArea: schedule.area ?? null,
      mainAreaLabel: schedule.label,
      blocks: [],
      reviewArea: null,
      reviewAreaLabel: '',
      hasReview: false,
      isMista,
      isRestDay: schedule.isRestDay,
      isObjectiveDay: schedule.isObjectiveDay,
      isEssayDay: schedule.isEssayDay,
      questionCount: schedule.questionCount,
      dayName: schedule.dayName,
      label: schedule.label,
      isLoading: schedule.isLoading,
    };
  }

  const reviewArea = data?.reviewArea ?? null;

  return {
    mainArea,
    mainAreaLabel: AREA_LABELS[mainArea] ?? mainArea,
    blocks: data?.blocks ?? [],
    reviewArea,
    reviewAreaLabel: reviewArea ? (AREA_LABELS[reviewArea] ?? reviewArea) : '',
    hasReview: !!reviewArea,
    isMista: false,
    isRestDay: false,
    isObjectiveDay: schedule.isObjectiveDay,
    isEssayDay: schedule.isEssayDay,
    // Cap main session at 15 questions (3 blocks × 5)
    questionCount: Math.min(15, schedule.questionCount),
    dayName: schedule.dayName,
    label: schedule.label,
    isLoading,
  };
}
