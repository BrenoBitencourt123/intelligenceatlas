import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudySchedule } from '@/hooks/useStudySchedule';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useDailyTheme } from '@/hooks/useDailyTheme';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { BookOpen, Brain, PenLine, Target, Flame, CheckCircle2, ArrowRight, Calendar } from 'lucide-react';

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
  const { theme, isLoading: isThemeLoading } = useDailyTheme();
  const { hasThemeAccess } = usePlanFeatures();

  const AreaIcon = schedule.area && schedule.area !== 'mista' 
    ? AREA_ICONS[schedule.area] || Target 
    : Target;

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Greeting + Day */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Hoje — {schedule.dayName}</h1>
            <p className="text-muted-foreground">{schedule.label}</p>
          </div>

          {/* Streak + Quick Stats */}
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
                  <span className="text-xs text-muted-foreground">Questões</span>
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

          {/* Main Study Card */}
          {schedule.isObjectiveDay && (
            <Card className="border-2 border-primary/20 bg-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      Área do dia
                    </Badge>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <AreaIcon className="h-5 w-5" />
                      {schedule.label}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {schedule.questionCount} questões • 3 blocos de {Math.floor(schedule.questionCount / 3)}
                    </p>
                  </div>
                </div>
                {stats.totalQuestions === 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Nenhuma questão importada. Importe provas do ENEM para começar.
                    </p>
                    <Button onClick={() => navigate('/importar')} className="w-full gap-2">
                      Importar Questões
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => navigate('/objetivas')} className="w-full mt-4 gap-2">
                    Começar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Essay Day Card */}
          {schedule.isEssayDay && (
            <Card className="border-2 border-primary/20 bg-card">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    Dia de Redação
                  </Badge>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <PenLine className="h-5 w-5" />
                    Redação + Revisão
                  </h2>
                  {!isThemeLoading && hasThemeAccess && theme && (
                    <p className="text-sm text-muted-foreground">Tema: {theme.title}</p>
                  )}
                </div>
                <Button onClick={() => navigate('/redacao')} className="w-full mt-4 gap-2">
                  Escrever Redação
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Rest Day */}
          {schedule.isRestDay && (
            <Card className="bg-card">
              <CardContent className="p-6 text-center space-y-2">
                <span className="text-3xl">😴</span>
                <h2 className="text-xl font-bold text-foreground">Descanso Ativo</h2>
                <p className="text-sm text-muted-foreground">
                  Hoje é dia de descansar. Revise apenas seus flashcards.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Flashcards Card */}
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Flashcards
                  </h3>
                  {stats.isLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {stats.flashcardsDue > 0
                        ? `${stats.flashcardsDue} para revisar`
                        : 'Nenhum pendente hoje'}
                    </p>
                  )}
                </div>
                <Button
                  variant={stats.flashcardsDue > 0 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => navigate('/flashcards')}
                  disabled={stats.flashcardsDue === 0}
                >
                  Revisar
                </Button>
              </div>
              {!stats.isLoading && stats.flashcardsReviewed > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  ✓ {stats.flashcardsReviewed} revisados hoje
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick access to essay (non-essay days) */}
          {!schedule.isEssayDay && (
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenLine className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Redação</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/redacao')}>
                    Acessar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Today;
