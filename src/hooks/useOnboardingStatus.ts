import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useOnboardingStatus() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['onboarding-status', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return false;
      }

      return Boolean(data?.id);
    },
  });

  return {
    hasCompletedOnboarding: query.data ?? false,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
