import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from './useUserStats';
import { useFreeAreaQuota } from './useFreeAreaQuota';
import { useFreemiumUsage, FREE_DAILY_QUESTIONS } from './useFreemiumUsage';

export const usePlanFeatures = () => {
  const { profile } = useAuth();
  const { weeklyEssays } = useUserStats();
  const { isAreaLocked, questionsUsedToday, questionsRemainingToday } = useFreeAreaQuota();
  const { weeklyEssayLimit, isWelcomeBonus, canSubmitEssay } = useFreemiumUsage();

  // Tratar legacy 'basic' como 'pro'
  const rawPlan = profile?.plan_type || 'free';
  const planType = rawPlan === 'basic' ? 'pro' : rawPlan as 'free' | 'pro';

  const isFree = planType === 'free';
  const isPro = planType === 'pro';

  // Free com cota semanal disponível (inclui bônus de boas-vindas)
  const freeHasQuota = isFree && canSubmitEssay;

  return {
    planType,
    isFree,
    isPro,
    // Tema do dia: Pro OU Free com cota semanal
    hasThemeAccess: isPro || freeHasQuota,
    // Pedagógico: Pro OU Free com cota semanal
    hasPedagogicalAccess: isPro || freeHasQuota,
    // Versão melhorada: Pro OU Free com cota semanal
    hasImprovedVersionAccess: isPro || freeHasQuota,
    // Fontes: apenas Pro
    hasSourcesAccess: isPro,
    // Limites de redação
    monthlyLimit: isPro ? 60 : weeklyEssayLimit,
    dailyLimit: isPro ? 2 : 1,
    weeklyEssayLimit,
    // Free trial: primeira semana com bônus
    isFreeTrial: isWelcomeBonus && isFree,
    // Sessão completa (20 questões): apenas Pro
    hasFullSessionAccess: isPro,
    // Flashcards automáticos ao errar: apenas Pro
    hasAutoFlashcards: isPro,
    // Cápsulas de conhecimento: apenas Pro
    hasKnowledgeCapsules: isPro,
    // Limite diário de questões para free (10/dia com reset diário)
    freeQuestionLimit: FREE_DAILY_QUESTIONS,
    // Questões usadas/restantes hoje
    questionsUsedToday,
    questionsRemainingToday,
    // Verificar se área está bloqueada (limite diário atingido)
    isAreaLocked,
  };
};
