import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserStats {
  totalEssays: number;
  lastScore: number | null;
  monthlyAverage: number | null;
  monthlyEssays: number;
  hasWrittenToday: boolean;
  isLoading: boolean;
}

export const useUserStats = (): UserStats => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalEssays: 0,
    lastScore: null,
    monthlyAverage: null,
    monthlyEssays: 0,
    hasWrittenToday: false,
    isLoading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setStats(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Get all essays for this user
        const { data: essays, error } = await supabase
          .from('essays')
          .select('id, total_score, created_at, analyzed_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[useUserStats] Error fetching essays:', error);
          setStats(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Calculate stats
        const totalEssays = essays?.length || 0;
        const lastScore = essays?.[0]?.total_score ?? null;

        // Filter analyzed essays for this month
        const monthlyEssays = essays?.filter(e => {
          const essayDate = new Date(e.created_at);
          return essayDate >= startOfMonth && e.total_score !== null;
        }) || [];

        const monthlyEssaysCount = monthlyEssays.length;

        // Calculate monthly average
        const monthlyScores = monthlyEssays
          .map(e => e.total_score)
          .filter((score): score is number => score !== null);
        
        const monthlyAverage = monthlyScores.length > 0
          ? Math.round(monthlyScores.reduce((a, b) => a + b, 0) / monthlyScores.length)
          : null;

        // Check if user has written today
        const hasWrittenToday = essays?.some(e => {
          const essayDate = new Date(e.created_at);
          return essayDate >= startOfToday;
        }) || false;

        setStats({
          totalEssays,
          lastScore,
          monthlyAverage,
          monthlyEssays: monthlyEssaysCount,
          hasWrittenToday,
          isLoading: false,
        });
      } catch (error) {
        console.error('[useUserStats] Unexpected error:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, [user]);

  return stats;
};
