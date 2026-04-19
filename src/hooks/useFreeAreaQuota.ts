import { useFreemiumUsage, FREE_DAILY_QUESTIONS } from './useFreemiumUsage';
import { useAuth } from '@/contexts/AuthContext';

interface FreeAreaQuota {
  questionsUsedToday: number;
  questionsRemainingToday: number;
  isAreaLocked: (area: string) => boolean;
  loading: boolean;
}

export function useFreeAreaQuota(): FreeAreaQuota {
  const { profile } = useAuth();
  const { questionsUsedToday, questionsRemainingToday, isLoading } = useFreemiumUsage();

  const isFree = (profile?.plan_type ?? 'free') === 'free';

  // Área bloqueada apenas para usuários free que atingiram o limite diário
  const isAreaLocked = (_area: string) =>
    isFree && questionsUsedToday >= FREE_DAILY_QUESTIONS;

  return {
    questionsUsedToday,
    questionsRemainingToday,
    isAreaLocked,
    loading: isLoading,
  };
}
