import { MainLayout } from '@/components/layout/MainLayout';
import { DailyThemeCard } from '@/components/home/DailyThemeCard';
import { ProgressCard } from '@/components/home/ProgressCard';
import { StatsCard } from '@/components/home/StatsCard';
import { getDailyTheme } from '@/data/dailyThemes';

const Home = () => {
  const dailyTheme = getDailyTheme();
  
  // Mock data - futuramente virá do banco/localStorage
  const hasWrittenToday = false;
  const usedEssays = 12;
  const totalEssays = 30;
  const lastScore = 840;
  const monthlyAverage = 760;

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
          <DailyThemeCard 
            title={dailyTheme.title} 
            hasWrittenToday={hasWrittenToday} 
          />

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProgressCard used={usedEssays} total={totalEssays} />
            <StatsCard lastScore={lastScore} monthlyAverage={monthlyAverage} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
