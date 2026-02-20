import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const FREE_QUESTION_LIMIT = 5;

interface FreeAreaQuota {
  attemptsPerArea: Record<string, number>;
  isAreaLocked: (area: string) => boolean;
  loading: boolean;
}

export function useFreeAreaQuota(): FreeAreaQuota {
  const { user } = useAuth();
  const [attemptsPerArea, setAttemptsPerArea] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from('user_topic_profile')
      .select('area, attempts')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return;
        const totals: Record<string, number> = {};
        for (const row of data) {
          if (row.area) {
            totals[row.area] = (totals[row.area] ?? 0) + (row.attempts ?? 0);
          }
        }
        setAttemptsPerArea(totals);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const isAreaLocked = (area: string) =>
    (attemptsPerArea[area] ?? 0) >= FREE_QUESTION_LIMIT;

  return { attemptsPerArea, isAreaLocked, loading };
}
