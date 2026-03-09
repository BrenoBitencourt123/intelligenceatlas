import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudySchedule } from '@/hooks/useStudySchedule';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useUserStats } from '@/hooks/useUserStats';
import { useDailyTheme } from '@/hooks/useDailyTheme';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { ArrowRight, Flame } from 'lucide-react';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { NotificationBanner } from '@/components/pwa/NotificationBanner';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const Today = () => {
  const navigate = useNavigate();
  const schedule = useStudySchedule();
  const stats = useStudyStats();
  const userStats = useUserStats();
  const { theme, isLoading: isThemeLoading } = useDailyTheme();
  const { hasThemeAccess, monthlyLimit, isFree } = usePlanFeatures();

  const isScheduleLoading = schedule.isLoading;
  const usedEssays = isFree ? userStats.totalEssays : userStats.monthlyEssays;
  const usagePercentage = Math.min(100, Math.round((usedEssays / monthlyLimit) * 100));

  const currentAreaProgress = schedule.area && schedule.area !== 'mista'
    ? stats.areaProgress.find((item: any) => item.area === schedule.area)
    : null;
  const inDiagnosticMode = Boolean(currentAreaProgress?.inDiagnosticMode);
  const isFirstSession = !stats.isLoading && stats.questionsToday === 0 && stats.streak === 0;

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-10">
        <div className="space-y-8">

          {/* PWA Banners */}
          <div className="space-y-3">
            <InstallBanner />
            <NotificationBanner />
          </div>
          {/* Header — Greeting */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{getGreeting()}</h1>
            <p className="text-sm text-muted-foreground">
              {schedule.dayName} · {schedule.label}
            </p>
          </div>

          {/* Stats — Inline bar */}
          {stats.isLoading ? (
            <Skeleton className="h-5 w-48 rounded" />
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-destructive" />
                {stats.streak} {stats.streak === 1 ? 'dia' : 'dias'}
              </span>
              <span className="text-border">·</span>
              <span>{stats.questionsToday} questões</span>
              <span className="text-border">·</span>
              <span>{stats.accuracyToday}% acerto</span>
            </div>
          )}

          {/* First session welcome */}
          {isFirstSession && schedule.isObjectiveDay && (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <p className="text-lg font-semibold text-foreground">Pronto para começar?</p>
                <p className="text-sm text-muted-foreground">
                  Sua primeira sessão de <strong>{schedule.label}</strong>. O sistema vai aprender com suas respostas e personalizar seu estudo.
                </p>
                <Button onClick={() => navigate('/objetivas')} className="w-full gap-2">
                  Começar {schedule.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Main study card */}
          {isScheduleLoading ? (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-7 w-40 rounded" />
                <Skeleton className="h-10 w-full rounded mt-2" />
              </CardContent>
            </Card>
          ) : schedule.isObjectiveDay && !isFirstSession && (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Área do dia</p>
                  <h2 className="text-xl font-bold text-foreground">{schedule.label}</h2>
                  <p className="text-sm text-muted-foreground">{schedule.questionCount} questões</p>
                </div>
                <Button onClick={() => navigate('/objetivas')} className="w-full gap-2">
                  Começar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Essay card */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Redação</h3>
                {!isFree && (
                  <span className="text-xs text-muted-foreground">{usedEssays}/{monthlyLimit}</span>
                )}
              </div>

              {!isThemeLoading && hasThemeAccess && theme && (
                <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3 leading-relaxed line-clamp-2">
                  "{theme.title}"
                </p>
              )}

              {!isFree && !userStats.isLoading && (
                <div className="space-y-1">
                  <Progress value={usagePercentage} className="h-1" />
                  <p className="text-xs text-muted-foreground">{usedEssays} de {monthlyLimit} correções este mês</p>
                </div>
              )}

              <Button onClick={() => navigate('/redacao')} className="w-full gap-2">
                {schedule.isEssayDay ? 'Escrever Redação' : 'Praticar Redação'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Flashcards — inline row */}
          <div className="flex items-center justify-between px-1">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Flashcards</p>
              <p className="text-xs text-muted-foreground">
                {stats.flashcardsDue > 0 ? `${stats.flashcardsDue} para revisar` : 'Nenhum pendente'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/flashcards')} disabled={stats.flashcardsDue === 0} className="text-sm">
              Revisar
            </Button>
          </div>

          {/* Diagnostic — inline progress */}
          {!stats.isLoading && inDiagnosticMode && (
            <div className="px-1 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Construindo seu perfil</p>
                <span className="text-xs text-muted-foreground">
                  {currentAreaProgress?.attempts ?? 0}/{stats.diagnosticThreshold}
                </span>
              </div>
              <Progress value={currentAreaProgress?.diagnosticProgressPct ?? 0} className="h-1.5" />
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
};

export default Today;
