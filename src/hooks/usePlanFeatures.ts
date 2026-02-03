import { useAuth } from '@/contexts/AuthContext';

export const usePlanFeatures = () => {
  const { profile } = useAuth();
  const planType = (profile?.plan_type || 'free') as 'free' | 'basic' | 'pro';
  
  const isFree = planType === 'free';
  const isBasic = planType === 'basic';
  const isPro = planType === 'pro';
  
  return {
    planType,
    isFree,
    isBasic,
    isPro,
    // Tema do dia: apenas Pro
    hasThemeAccess: isPro,
    // Pedagógico (contexto, perguntas, estrutura): apenas Pro
    hasPedagogicalAccess: isPro,
    // Versão melhorada: Basic e Pro
    hasImprovedVersionAccess: isBasic || isPro,
    // Limites
    monthlyLimit: isPro ? 60 : isBasic ? 30 : 1,
    dailyLimit: isPro ? 2 : 1,
  };
};
