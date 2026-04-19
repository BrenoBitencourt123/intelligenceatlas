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

  const isFree = (profile?.plan_type ?? 'free') === 'free' || profile?.plan_type === 'basic'
    ? profile?.plan_type === 'free'
    : false;

  // Área bloqueada quando o usuário atingiu o limite diário de questões
  const isAreaLocked = (_area: string) =>
    questionsUsedToday >= FREE_DAILY_QUESTIONS;

  return {
    questionsUsedToday,
    questionsRemainingToday,
    isAreaLocked,
    loading: isLoading,
  };
}
