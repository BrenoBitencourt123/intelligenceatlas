import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from './useUserStats';

export const usePlanFeatures = () => {
  const { profile } = useAuth();
  const { totalEssays } = useUserStats();
  const planType = (profile?.plan_type || 'free') as 'free' | 'basic' | 'pro';
  
  const isFree = planType === 'free';
  const isBasic = planType === 'basic';
  const isPro = planType === 'pro';
  
  // Free users get Pro-like experience on their first (and only) essay
  const freeHasQuota = isFree && totalEssays < 1;
  
  return {
    planType,
    isFree,
    isBasic,
    isPro,
    // Tema do dia: Pro OU Free com cota disponível (trial)
    hasThemeAccess: isPro || freeHasQuota,
    // Pedagógico (contexto, perguntas, estrutura): Pro OU Free com cota (trial)
    hasPedagogicalAccess: isPro || freeHasQuota,
    // Versão melhorada: Basic, Pro, OU Free com cota (trial)
    hasImprovedVersionAccess: isBasic || isPro || freeHasQuota,
    // Fontes de dados: apenas Pro
    hasSourcesAccess: isPro,
    // Limites
    monthlyLimit: isPro ? 60 : isBasic ? 30 : 1,
    dailyLimit: isPro ? 2 : 1,
    // Para UI saber se está no modo "degustação Pro"
    isFreeTrial: freeHasQuota,
    // Objetivas: sessão completa (45 questões) para Basic e Pro, 5 para Free
    hasFullSessionAccess: isBasic || isPro,
    // Flashcards automáticos (gerados em erro): apenas Pro
    hasAutoFlashcards: isPro,
    // Cápsulas de conhecimento (explicação após resposta): apenas Pro
    hasKnowledgeCapsules: isPro,
    // Limite de questões por dia para Free
    freeQuestionLimit: 5,
  };
};
