import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks whether there are any UFU-tagged questions available in the bank.
 * Used to gate study UIs while the DIRPS question bank is being ingested.
 */
export function useUfuAvailability() {
  const { data, isLoading } = useQuery({
    queryKey: ['ufu-questions-available'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('exam', 'ufu')
        .not('correct_answer', 'is', null);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    hasUfuQuestions: (data ?? 0) > 0,
    ufuQuestionCount: data ?? 0,
    isLoading,
  };
}
