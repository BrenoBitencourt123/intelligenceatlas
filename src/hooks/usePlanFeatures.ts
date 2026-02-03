import { useAuth } from '@/contexts/AuthContext';

export const usePlanFeatures = () => {
  const { profile } = useAuth();
  const isPro = profile?.plan_type === 'pro';
  
  return {
    isPro,
    hasThemeAccess: isPro,
    hasPedagogicalAccess: isPro,
    monthlyLimit: isPro ? 60 : 30,
    dailyLimit: isPro ? 2 : 1,
  };
};
