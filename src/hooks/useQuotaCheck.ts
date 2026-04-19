import { useUserStats } from './useUserStats';
import { usePlanFeatures } from './usePlanFeatures';
import { useFreemiumUsage } from './useFreemiumUsage';
import { useAuth } from '@/contexts/AuthContext';

export type QuotaReason = 'weekly_limit' | 'monthly_limit' | 'daily_limit' | null;

interface QuotaCheckResult {
  canAnalyze: boolean;
  reason: QuotaReason;
  remaining: number;
  isLoading: boolean;
  weeklyUsed: number;
  weeklyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  dailyUsed: number;
  dailyLimit: number;
  isFlexibleMode: boolean;
  isWelcomeBonus: boolean;
}

export const useQuotaCheck = (): QuotaCheckResult => {
  const { profile } = useAuth();
  const { monthlyEssays, todayAnalyzedCount, isLoading: isStatsLoading } = useUserStats();
  const { isFree, monthlyLimit, dailyLimit } = usePlanFeatures();
  const {
    essaysUsedThisWeek,
    weeklyEssayLimit,
    essaysRemainingThisWeek,
    isWelcomeBonus,
    isLoading: isFreemiumLoading,
  } = useFreemiumUsage();

  const isFlexibleMode = profile?.flexible_quota ?? false;
  const isLoading = isStatsLoading || isFreemiumLoading;

  // While loading, allow analyze (validated no backend)
  if (isLoading) {
    return {
      canAnalyze: true,
      reason: null,
      remaining: isFree ? weeklyEssayLimit : monthlyLimit,
      isLoading: true,
      weeklyUsed: 0,
      weeklyLimit: weeklyEssayLimit,
      monthlyUsed: 0,
      monthlyLimit,
      dailyUsed: 0,
      dailyLimit,
      isFlexibleMode,
      isWelcomeBonus,
    };
  }

  // Plano free: limite semanal (1/semana, ou 2 na semana de boas-vindas)
  if (isFree) {
    if (essaysUsedThisWeek >= weeklyEssayLimit) {
      return {
        canAnalyze: false,
        reason: 'weekly_limit',
        remaining: 0,
        isLoading: false,
        weeklyUsed: essaysUsedThisWeek,
        weeklyLimit: weeklyEssayLimit,
        monthlyUsed: monthlyEssays,
        monthlyLimit: weeklyEssayLimit,
        dailyUsed: todayAnalyzedCount,
        dailyLimit: 1,
        isFlexibleMode: false,
        isWelcomeBonus,
      };
    }
    return {
      canAnalyze: true,
      reason: null,
      remaining: essaysRemainingThisWeek,
      isLoading: false,
      weeklyUsed: essaysUsedThisWeek,
      weeklyLimit: weeklyEssayLimit,
      monthlyUsed: monthlyEssays,
      monthlyLimit: weeklyEssayLimit,
      dailyUsed: todayAnalyzedCount,
      dailyLimit: 1,
      isFlexibleMode: false,
      isWelcomeBonus,
    };
  }

  // Pro: checar limite mensal
  if (monthlyEssays >= monthlyLimit) {
    return {
      canAnalyze: false,
      reason: 'monthly_limit',
      remaining: 0,
      isLoading: false,
      weeklyUsed: essaysUsedThisWeek,
      weeklyLimit: weeklyEssayLimit,
      monthlyUsed: monthlyEssays,
      monthlyLimit,
      dailyUsed: todayAnalyzedCount,
      dailyLimit,
      isFlexibleMode,
      isWelcomeBonus,
    };
  }

  // Pro com flexible mode: sem limite diário
  if (isFlexibleMode) {
    return {
      canAnalyze: true,
      reason: null,
      remaining: monthlyLimit - monthlyEssays,
      isLoading: false,
      weeklyUsed: essaysUsedThisWeek,
      weeklyLimit: weeklyEssayLimit,
      monthlyUsed: monthlyEssays,
      monthlyLimit,
      dailyUsed: todayAnalyzedCount,
      dailyLimit,
      isFlexibleMode,
      isWelcomeBonus,
    };
  }

  // Pro: checar limite diário
  if (todayAnalyzedCount >= dailyLimit) {
    return {
      canAnalyze: false,
      reason: 'daily_limit',
      remaining: monthlyLimit - monthlyEssays,
      isLoading: false,
      weeklyUsed: essaysUsedThisWeek,
      weeklyLimit: weeklyEssayLimit,
      monthlyUsed: monthlyEssays,
      monthlyLimit,
      dailyUsed: todayAnalyzedCount,
      dailyLimit,
      isFlexibleMode,
      isWelcomeBonus,
    };
  }

  // Tudo ok
  return {
    canAnalyze: true,
    reason: null,
    remaining: monthlyLimit - monthlyEssays,
    isLoading: false,
    weeklyUsed: essaysUsedThisWeek,
    weeklyLimit: weeklyEssayLimit,
    monthlyUsed: monthlyEssays,
    monthlyLimit,
    dailyUsed: todayAnalyzedCount,
    dailyLimit,
    isFlexibleMode,
    isWelcomeBonus,
  };
};
