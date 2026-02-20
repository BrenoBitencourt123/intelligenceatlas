import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from './useUserStats';
import { useFreeAreaQuota } from './useFreeAreaQuota';

export const usePlanFeatures = () => {
  const { profile } = useAuth();
  const { totalEssays } = useUserStats();
  const { isAreaLocked } = useFreeAreaQuota();
  // Treat legacy 'basic' accounts as 'pro' to avoid breaking existing users
  const rawPlan = profile?.plan_type || 'free';
  const planType = rawPlan === 'basic' ? 'pro' : rawPlan as 'free' | 'pro';

  const isFree = planType === 'free';
  const isPro = planType === 'pro';

  // Free users get Pro-like essay experience on their first (and only) essay
  const freeHasQuota = isFree && totalEssays < 1;

  return {
    planType,
    isFree,
    isPro,
    // Tema do dia: Pro OU Free com cota disponível (trial)
    hasThemeAccess: isPro || freeHasQuota,
    // Pedagógico (contexto, perguntas, estrutura): Pro OU Free com cota (trial)
    hasPedagogicalAccess: isPro || freeHasQuota,
    // Versão melhorada: Pro OU Free com cota (trial)
    hasImprovedVersionAccess: isPro || freeHasQuota,
    // Fontes de dados: apenas Pro
    hasSourcesAccess: isPro,
    // Limites de redação
    monthlyLimit: isPro ? 60 : 1,
    dailyLimit: isPro ? 2 : 1,
    // Para UI saber se está no modo "degustação"
    isFreeTrial: freeHasQuota,
    // Objetivas: sessão completa (20 questões) apenas Pro; Free usa limite por área
    hasFullSessionAccess: isPro,
    // Flashcards automáticos (gerados em erro): apenas Pro
    hasAutoFlashcards: isPro,
    // Cápsulas de conhecimento (explicação após resposta): apenas Pro
    hasKnowledgeCapsules: isPro,
    // Limite de questões por área para Free (5 one-time por área)
    freeQuestionLimit: 5,
    // Verificar se área está bloqueada para Free
    isAreaLocked,
  };
};
