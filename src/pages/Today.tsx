import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useDayBlocks } from '@/hooks/useDayBlocks';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useUserStats } from '@/hooks/useUserStats';
import { useDailyTheme } from '@/hooks/useDailyTheme';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useFreemiumUsage } from '@/hooks/useFreemiumUsage';
import { ArrowRight, Flame, Crown } from 'lucide-react';
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
  const freemium = useFreemiumUsage();
  const dayPlan = useDayBlocks();
  const stats = useStudyStats();
  const userStats = useUserStats();
  const { theme, isLoading: isThemeLoading } = useDailyTheme();
  const { hasThemeAccess, monthlyLimit, isFree } = usePlanFeatures();

  const usedEssays = isFree ? userStats.totalEssays : userStats.monthlyEssays;
  const usagePercentage = Math.min(100, Math.round((usedEssays / monthlyLimit) * 100));

  const currentAreaProgress =
    dayPlan.mainArea && dayPlan.mainArea !== 'mista'
      ? stats.areaProgress.find((item: any) => item.area === dayPlan.mainArea)
      : null;
  const inDiagnosticMode = Boolean(currentAreaProgress?.inDiagnosticMode);

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-10">
        <div className="space-y-8">

          {/* PWA Banners */}
          <div className="space-y-3">
            <InstallBanner />
            <NotificationBanner />
          </div>

          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{getGreeting()}</h1>
            <p className="text-sm text-muted-foreground">
              {dayPlan.dayName} · {dayPlan.mainAreaLabel || dayPlan.label}
            </p>
          </div>

          {/* Stats inline bar */}
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

          {/* ── Foco do dia (blocos) ── */}
          {dayPlan.isLoading ? (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-7 w-40 rounded" />
                <Skeleton className="h-3 w-full rounded mt-1" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-10 w-full rounded mt-2" />
              </CardContent>
            </Card>
          ) : dayPlan.isObjectiveDay && !dayPlan.isMista && dayPlan.mainArea ? (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Foco do dia
                  </p>
                  <h2 className="text-xl font-bold text-foreground">{dayPlan.mainAreaLabel}</h2>
                  <p className="text-sm text-muted-foreground">
                    {dayPlan.questionCount} questões · 3 blocos
                  </p>
                </div>

                {/* Block list */}
                {dayPlan.blocks.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {dayPlan.blocks.map((block, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                        <span className="text-muted-foreground w-24 shrink-0">{block.blockLabel}</span>
                        <span
                          className="text-foreground font-medium truncate"
                          title={block.topic}
                        >
                          {block.topic}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto tabular-nums shrink-0">
                          {block.count}q
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Button onClick={() => navigate('/objetivas')} className="w-full gap-2">
                  Começar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : dayPlan.isMista ? (
            /* Simulado (sábado) */
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Simulado
                  </p>
                  <h2 className="text-xl font-bold text-foreground">Prova Mista</h2>
                  <p className="text-sm text-muted-foreground">{dayPlan.questionCount} questões · todas as áreas</p>
                </div>
                <Button onClick={() => navigate('/objetivas')} className="w-full gap-2">
                  Começar Simulado
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* ── Revisão rápida ── */}
          {!dayPlan.isLoading && dayPlan.hasReview && dayPlan.reviewArea && (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Revisão rápida
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {dayPlan.reviewAreaLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">5 questões · ~10 min</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() =>
                    navigate(`/objetivas?area=${dayPlan.reviewArea}&count=5`)
                  }
                >
                  Revisar
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Redação ── */}
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
                  <p className="text-xs text-muted-foreground">
                    {usedEssays} de {monthlyLimit} correções este mês
                  </p>
                </div>
              )}

              <Button onClick={() => navigate('/redacao')} className="w-full gap-2">
                {dayPlan.isEssayDay ? 'Escrever Redação' : 'Praticar Redação'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* ── Flashcards ── */}
          <div className="flex items-center justify-between px-1">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Flashcards</p>
              <p className="text-xs text-muted-foreground">
                {stats.flashcardsDue > 0
                  ? `${stats.flashcardsDue} para revisar`
                  : 'Nenhum pendente'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/flashcards')}
              disabled={stats.flashcardsDue === 0}
              className="text-sm"
            >
              Revisar
            </Button>
          </div>

          {/* ── Progresso diagnóstico ── */}
          {!stats.isLoading && inDiagnosticMode && (
            <div className="px-1 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Construindo seu perfil</p>
                <span className="text-xs text-muted-foreground">
                  {currentAreaProgress?.attempts ?? 0}/{stats.diagnosticThreshold}
                </span>
              </div>
              <Progress
                value={currentAreaProgress?.diagnosticProgressPct ?? 0}
                className="h-1.5"
              />
            </div>
          )}

          {/* ── Card PRO (free users) ── */}
          {isFree && !freemium.isLoading && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-sm font-semibold text-foreground">
                    {freemium.isWelcomeBonus
                      ? `Bônus de boas-vindas ativo · ${freemium.essaysRemainingThisWeek} correção restante`
                      : `Plano grátis · ${freemium.questionsRemainingToday} questões hoje`}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No PRO: questões ilimitadas, 60 redações/mês, flashcards automáticos e plano diário
                  personalizado.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 border-amber-500/40 hover:bg-amber-500/10"
                  onClick={() => navigate('/plano')}
                >
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  Ver plano PRO
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </MainLayout>
  );
};

export default Today;
