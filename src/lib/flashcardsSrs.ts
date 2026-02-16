export type FlashcardRating = 'again' | 'hard' | 'easy';

export const FLASHCARD_INTERVALS = [1, 3, 7, 14, 30, 45] as const;

export function formatLevelLabel(level: number): string {
  const normalized = Math.max(0, Math.min(3, Math.round(level)));
  return `N${normalized}`;
}

export function intervalLabel(days: number): string {
  if (days <= 1) return '1 dia';
  if (days < 7) return `${days} dias`;
  if (days === 7) return '1 semana';
  if (days === 14) return '2 semanas';
  if (days === 30) return '1 mes';
  return `${days} dias`;
}

export function nearestInterval(days: number): number {
  if (!Number.isFinite(days) || days <= 1) return 1;
  const found = FLASHCARD_INTERVALS.find((value) => days <= value);
  return found ?? FLASHCARD_INTERVALS[FLASHCARD_INTERVALS.length - 1];
}
