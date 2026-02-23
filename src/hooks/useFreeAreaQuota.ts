import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const FREE_QUESTION_LIMIT = 5;

interface FreeAreaQuota {
  totalAttempts: number;
  isAreaLocked: (area: string) => boolean;
  loading: boolean;
}

export function useFreeAreaQuota(): FreeAreaQuota {
  const { user } = useAuth();
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from('user_topic_profile')
      .select('attempts')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        const total = data.reduce((sum, row) => sum + (row.attempts ?? 0), 0);
        setTotalAttempts(total);
        setLoading(false);
      }, () => setLoading(false));
  }, [user]);

  // Any area is locked once the user has used 5 questions TOTAL
  const isAreaLocked = (_area: string) => totalAttempts >= FREE_QUESTION_LIMIT;

  return { totalAttempts, isAreaLocked, loading };
}
