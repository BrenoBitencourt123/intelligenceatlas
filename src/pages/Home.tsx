import { MainLayout } from '@/components/layout/MainLayout';
import { DailyThemeCard } from '@/components/home/DailyThemeCard';
import { ProgressCard } from '@/components/home/ProgressCard';
import { StatsCard } from '@/components/home/StatsCard';
import { useDailyTheme } from '@/hooks/useDailyTheme';
import { useUserStats } from '@/hooks/useUserStats';
import { Skeleton } from '@/components/ui/skeleton';

const Home = () => {
  const { theme, isLoading: isThemeLoading } = useDailyTheme();
  const { 
    totalEssays, 
    lastScore, 
    monthlyAverage, 
    monthlyEssays,
    hasWrittenToday,
    isLoading: isStatsLoading 
  } = useUserStats();
  
  // Monthly limit based on plan (basic = 30)
  const monthlyLimit = 30;

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Greeting */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Olá! 👋</h1>
            <p className="text-muted-foreground">
              Pronto para treinar sua redação hoje?
            </p>
          </div>

          {/* Daily theme CTA */}
          {isThemeLoading ? (
            <Skeleton className="h-32 rounded-lg" />
          ) : (
            <DailyThemeCard 
              title={theme.title} 
              hasWrittenToday={hasWrittenToday} 
            />
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isStatsLoading ? (
              <>
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
              </>
            ) : (
              <>
                <ProgressCard used={monthlyEssays} total={monthlyLimit} />
                <StatsCard lastScore={lastScore} monthlyAverage={monthlyAverage} />
              </>
            )}
          </div>

          {/* Total essays info */}
          {!isStatsLoading && totalEssays > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Você já escreveu {totalEssays} {totalEssays === 1 ? 'redação' : 'redações'} no total
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
