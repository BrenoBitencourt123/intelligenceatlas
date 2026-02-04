import { useUserStats } from './useUserStats';
import { usePlanFeatures } from './usePlanFeatures';
import { useAuth } from '@/contexts/AuthContext';

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
  isFlexibleMode: boolean;
}

export const useQuotaCheck = (): QuotaCheckResult => {
  const { profile } = useAuth();
  const { totalEssays, monthlyEssays, todayAnalyzedCount, isLoading } = useUserStats();
  const { isFree, monthlyLimit, dailyLimit } = usePlanFeatures();
  
  const isFlexibleMode = profile?.flexible_quota ?? false;

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
      isFlexibleMode,
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
        isFlexibleMode: false,
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
      isFlexibleMode: false,
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
      isFlexibleMode,
    };
  }

  // If flexible mode is ON, skip daily limit check
  if (isFlexibleMode) {
    return {
      canAnalyze: true,
      reason: null,
      remaining: monthlyLimit - monthlyEssays,
      isLoading: false,
      monthlyUsed: monthlyEssays,
      monthlyLimit,
      dailyUsed: todayAnalyzedCount,
      dailyLimit,
      isFlexibleMode,
    };
  }

  // Basic/Pro with daily limit: check daily limit
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
      isFlexibleMode,
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
    isFlexibleMode,
  };
};
