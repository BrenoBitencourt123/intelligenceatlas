import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudySchedule } from '@/hooks/useStudySchedule';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useUserStats } from '@/hooks/useUserStats';
import { useDailyTheme } from '@/hooks/useDailyTheme';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { BookOpen, Brain, PenLine, Target, Flame, CheckCircle2, ArrowRight, Calendar, Crown } from 'lucide-react';

const AREA_ICONS: Record<string, typeof BookOpen> = {
  matematica: Target,
  linguagens: BookOpen,
  natureza: Brain,
  humanas: Calendar,
};

const Today = () => {
  const navigate = useNavigate();
  const schedule = useStudySchedule();
  const stats = useStudyStats();
  const userStats = useUserStats();
  const { theme, isLoading: isThemeLoading } = useDailyTheme();
  const { hasThemeAccess, monthlyLimit, isFree } = usePlanFeatures();

  const AreaIcon = schedule.area && schedule.area !== 'mista'
    ? AREA_ICONS[schedule.area] || Target
    : Target;

  const usedEssays = isFree ? userStats.totalEssays : userStats.monthlyEssays;
  const usagePercentage = Math.min(100, Math.round((usedEssays / monthlyLimit) * 100));

  const currentAreaProgress = schedule.area && schedule.area !== 'mista'
    ? stats.areaProgress.find((item: any) => item.area === schedule.area)
    : null;
  const inDiagnosticMode = Boolean(currentAreaProgress?.inDiagnosticMode);

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Hoje - {schedule.dayName}</h1>
            <p className="text-muted-foreground">{schedule.label}</p>
          </div>

          {stats.isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <Flame className="h-5 w-5 text-destructive mb-1" />
                  <span className="text-2xl font-bold">{stats.streak}</span>
                  <span className="text-xs text-muted-foreground">Streak</span>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-5 w-5 text-foreground mb-1" />
                  <span className="text-2xl font-bold">{stats.questionsToday}</span>
                  <span className="text-xs text-muted-foreground">Questoes</span>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <Target className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-2xl font-bold">{stats.accuracyToday}%</span>
                  <span className="text-xs text-muted-foreground">Acerto</span>
                </CardContent>
              </Card>
            </div>
          )}

          {schedule.isObjectiveDay && (
            <Card className="border-2 border-primary/20 bg-card">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">Area do dia</Badge>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <AreaIcon className="h-5 w-5" />
                    {schedule.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {schedule.questionCount} questoes
                  </p>
                </div>
                <Button onClick={() => navigate('/objetivas')} className="w-full mt-4 gap-2">
                  Comecar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <PenLine className="h-4 w-4" /> Redacao
                </h3>
                {!isFree && <Badge variant="outline" className="text-xs">{usedEssays}/{monthlyLimit}</Badge>}
              </div>

              {!isThemeLoading && hasThemeAccess && theme && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Tema do dia</p>
                  <p className="text-sm font-medium text-foreground line-clamp-2">{theme.title}</p>
                </div>
              )}

              {!isFree && !userStats.isLoading && (
                <div className="space-y-1">
                  <Progress value={usagePercentage} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">{usedEssays} de {monthlyLimit} correcoes usadas este mes</p>
                </div>
              )}

              <Button onClick={() => navigate('/redacao')} className="w-full gap-2" variant={schedule.isEssayDay ? 'default' : 'outline'}>
                {schedule.isEssayDay ? 'Escrever Redacao' : 'Praticar Redacao'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Brain className="h-4 w-4" /> Flashcards
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.flashcardsDue > 0 ? `${stats.flashcardsDue} para revisar` : 'Nenhum pendente hoje'}
                  </p>
                </div>
                <Button variant={stats.flashcardsDue > 0 ? 'default' : 'outline'} size="sm" onClick={() => navigate('/objetivas')} disabled={stats.flashcardsDue === 0}>
                  Revisar
                </Button>
              </div>
            </CardContent>
          </Card>

          {!stats.isLoading && inDiagnosticMode && (
            <Card className="bg-card">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold">Construindo seu perfil...</h3>
                <p className="text-sm text-muted-foreground">Resolva mais questoes para ativar o modo adaptativo completo.</p>
                <Progress value={currentAreaProgress?.diagnosticProgressPct ?? 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {currentAreaProgress?.attempts ?? 0}/{stats.diagnosticThreshold} respostas nesta area
                </p>
              </CardContent>
            </Card>
          )}

          {!stats.isLoading && !inDiagnosticMode && stats.topWeaknesses.length > 0 && (
            <>
              <Card className="bg-card">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Top 5 fraquezas</h3>
                    <Button variant="outline" size="sm" onClick={() => navigate('/errors')}>Ver por topico</Button>
                  </div>
                  <div className="space-y-2">
                    {stats.topWeaknesses.map((item: any, idx: number) => (
                      <div key={`${item.area}-${item.topic}-${idx}`} className="flex items-center justify-between text-sm rounded border p-2">
                        <span><span className="capitalize">{item.area}</span> - {item.topic}{item.subtopic ? ` > ${item.subtopic}` : ''}</span>
                        <span className="text-muted-foreground">Prioridade {item.priority.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Top 5 forcas</h3>
                    <Badge variant="outline">{stats.overdueReviews} revisoes vencidas</Badge>
                  </div>
                  <div className="space-y-2">
                    {stats.topStrengths.map((item: any, idx: number) => (
                      <div key={`${item.area}-${item.topic}-${idx}`} className="flex items-center justify-between text-sm rounded border p-2">
                        <span><span className="capitalize">{item.area}</span> - {item.topic}{item.subtopic ? ` > ${item.subtopic}` : ''}</span>
                        <span className="text-muted-foreground">N{item.level} - {Math.round(item.accuracy * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Today;
