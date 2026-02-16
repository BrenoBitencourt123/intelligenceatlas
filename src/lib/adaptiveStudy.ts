export const AREA_VALUES = ['matematica', 'linguagens', 'natureza', 'humanas'] as const;

export type TopicLevel = 0 | 1 | 2 | 3;

const LEVEL_WEIGHT: Record<TopicLevel, number> = {
  0: 1.0,
  1: 0.7,
  2: 0.3,
  3: 0.1,
};

export function normalizeTopic(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : 'Geral';
}

export function normalizeSubtopic(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : '';
}

export function normalizeDifficulty(value: number | null | undefined): 1 | 2 | 3 {
  if (value === 1 || value === 2 || value === 3) return value;
  if ((value ?? 2) < 2) return 1;
  if ((value ?? 2) > 2) return 3;
  return 2;
}

function daysBetween(now: Date, when: Date | null): number {
  if (!when) return 365;
  return Math.max(0, (now.getTime() - when.getTime()) / (1000 * 60 * 60 * 24));
}

export function computePriorityScore(params: {
  attempts: number;
  correct: number;
  level: number;
  nextReviewAt?: string | null;
  lastAttemptAt?: string | null;
  now?: Date;
}): number {
  const now = params.now ?? new Date();
  const attempts = Math.max(0, params.attempts);
  const correct = Math.max(0, params.correct);

  const accuracy = attempts > 0 ? correct / attempts : 0;
  const boundedLevel = Math.min(3, Math.max(0, Math.round(params.level))) as TopicLevel;
  const levelWeight = LEVEL_WEIGHT[boundedLevel];

  const nextReviewAt = params.nextReviewAt ? new Date(params.nextReviewAt) : null;
  const isOverdue = nextReviewAt && nextReviewAt.getTime() <= now.getTime() ? 1 : 0;

  const lastAttemptAt = params.lastAttemptAt ? new Date(params.lastAttemptAt) : null;
  const staleDays = daysBetween(now, lastAttemptAt);
  const recencyPenalty = Math.min(1, staleDays / 14);

  const w1 = 0.5;
  const w2 = 0.3;
  const w3 = 0.15;
  const w4 = 0.05;

  const score =
    w1 * (1 - accuracy) +
    w2 * levelWeight +
    w3 * isOverdue +
    w4 * recencyPenalty;

  return Number(score.toFixed(4));
}

export function nextReviewDateForLevel(level: number, opts?: { forceSoon?: boolean }): string {
  const now = new Date();
  const d = new Date(now);

  if (opts?.forceSoon) {
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }

  if (level <= 1) d.setDate(d.getDate() + 2);
  else if (level === 2) d.setDate(d.getDate() + 5);
  else d.setDate(d.getDate() + 21);

  return d.toISOString();
}

export function seedLevelFromSelfAssessment(value0to10: number): TopicLevel {
  if (value0to10 <= 3) return 0;
  if (value0to10 <= 5) return 1;
  if (value0to10 <= 7) return 2;
  return 3;
}
