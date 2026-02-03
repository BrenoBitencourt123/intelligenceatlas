import { useUserStats } from './useUserStats';
import { usePlanFeatures } from './usePlanFeatures';

export type QuotaReason = 'limit_reached' | 'monthly_limit' | 'daily_limit' | null;

interface QuotaCheckResult {
  canAnalyze: boolean;
  reason: QuotaReason;
  remaining: number;
  isLoading: boolean;
  monthlyUsed: number;
  monthlyLimit: number;
  dailyUsed: number;
  dailyLimit: number;
}

export const useQuotaCheck = (): QuotaCheckResult => {
  const { totalEssays, monthlyEssays, todayAnalyzedCount, isLoading } = useUserStats();
  const { isFree, monthlyLimit, dailyLimit } = usePlanFeatures();

  // While loading, allow analyze (will be validated on backend)
  if (isLoading) {
    return {
      canAnalyze: true,
      reason: null,
      remaining: monthlyLimit,
      isLoading: true,
      monthlyUsed: 0,
      monthlyLimit,
      dailyUsed: 0,
      dailyLimit,
    };
  }

  // Free plan: blocked after 1 TOTAL analysis (permanent, not monthly)
  if (isFree) {
    if (totalEssays >= 1) {
      return {
        canAnalyze: false,
        reason: 'limit_reached',
        remaining: 0,
        isLoading: false,
        monthlyUsed: totalEssays,
        monthlyLimit: 1,
        dailyUsed: todayAnalyzedCount,
        dailyLimit: 1,
      };
    }
    return {
      canAnalyze: true,
      reason: null,
      remaining: 1 - totalEssays,
      isLoading: false,
      monthlyUsed: totalEssays,
      monthlyLimit: 1,
      dailyUsed: todayAnalyzedCount,
      dailyLimit: 1,
    };
  }

  // Basic/Pro: check monthly limit first
  if (monthlyEssays >= monthlyLimit) {
    return {
      canAnalyze: false,
      reason: 'monthly_limit',
      remaining: 0,
      isLoading: false,
      monthlyUsed: monthlyEssays,
      monthlyLimit,
      dailyUsed: todayAnalyzedCount,
      dailyLimit,
    };
  }

  // Basic/Pro: check daily limit
  if (todayAnalyzedCount >= dailyLimit) {
    return {
      canAnalyze: false,
      reason: 'daily_limit',
      remaining: monthlyLimit - monthlyEssays,
      isLoading: false,
      monthlyUsed: monthlyEssays,
      monthlyLimit,
      dailyUsed: todayAnalyzedCount,
      dailyLimit,
    };
  }

  // All checks passed
  return {
    canAnalyze: true,
    reason: null,
    remaining: monthlyLimit - monthlyEssays,
    isLoading: false,
    monthlyUsed: monthlyEssays,
    monthlyLimit,
    dailyUsed: todayAnalyzedCount,
    dailyLimit,
  };
};
