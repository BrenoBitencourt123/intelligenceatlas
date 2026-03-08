import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, TrendingUp, BookOpen, Brain, Target, Calendar, ChevronDown, ChevronUp, TrendingDown, Shield } from 'lucide-react';

interface TopicRow {
  id: string;
  area: string;
  topic: string;
  subtopic: string;
  level: number;
  attempts: number;
  correct: number;
  wrong: number;
  dont_know: number;
  priority_score: number;
  last_attempt_at: string | null;
  next_review_at: string | null;
}

const AREA_CONFIG: Record<string, { label: string; icon: typeof BookOpen; color: string; bg: string }> = {
  matematica: { label: 'Matemática', icon: Target, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  linguagens: { label: 'Linguagens', icon: BookOpen, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  natureza: { label: 'Ciências da Natureza', icon: Brain, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  humanas: { label: 'Ciências Humanas', icon: Calendar, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

function getMasteryLevel(accuracy: number, level: number): { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (level >= 3 && accuracy >= 75) return { label: 'Dominado', color: 'text-green-600', variant: 'outline' };
  if (level >= 2 && accuracy >= 55) return { label: 'Em progresso', color: 'text-amber-600', variant: 'secondary' };
  return { label: 'Prioridade', color: 'text-destructive', variant: 'destructive' };
}

function isOverdue(nextReviewAt: string | null): boolean {
  if (!nextReviewAt) return false;
  return new Date(nextReviewAt).getTime() <= Date.now();
}

function daysUntilReview(nextReviewAt: string | null): string {
  if (!nextReviewAt) return '-';
  const diff = Math.ceil((new Date(nextReviewAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return `em ${diff} dias`;
}

function AreaCard({ area, list }: { area: string; list: TopicRow[] }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const cfg = AREA_CONFIG[area] || { label: area, icon: Target, color: 'text-foreground', bg: 'bg-muted/40 border-border' };
  const Icon = cfg.icon;

  const totalAttempts = list.reduce((s, r) => s + r.attempts, 0);
  const totalCorrect = list.reduce((s, r) => s + r.correct, 0);
  const areaAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const overdueCount = list.filter(r => isOverdue(r.next_review_at)).length;
  const avgLevel = list.length > 0 ? Math.round(list.reduce((s, r) => s + r.level, 0) / list.length) : 0;

  // Sort: overdue first, then by priority_score desc
  const sorted = [...list].sort((a, b) => {
    const aOver = isOverdue(a.next_review_at) ? 1 : 0;
    const bOver = isOverdue(b.next_review_at) ? 1 : 0;
    if (bOver !== aOver) return bOver - aOver;
    return b.priority_score - a.priority_score;
  });

  return (
    <Card className={`border ${cfg.bg}`}>
      <CardContent className="p-0">
        {/* Area header */}
        <button
          className="w-full p-5 flex items-center gap-3 text-left"
          onClick={() => setExpanded(e => !e)}
        >
          <div className={`p-2 rounded-lg bg-background/60`}>
            <Icon className={`h-5 w-5 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-foreground">{cfg.label}</h2>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {overdueCount} para revisar
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Progress value={areaAccuracy} className="h-1.5 flex-1 max-w-[120px]" />
              <span className="text-xs text-muted-foreground">{areaAccuracy}% acerto · N{avgLevel} médio · {list.length} tópicos</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={e => { e.stopPropagation(); navigate('/objetivas'); }}
            >
              Estudar
            </Button>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {/* Topic list */}
        {expanded && (
          <div className="border-t border-border/60 divide-y divide-border/40">
            {sorted.map((row) => {
              const accuracy = row.attempts > 0 ? Math.round((row.correct / row.attempts) * 100) : 0;
              const mastery = getMasteryLevel(accuracy, row.level);
              const overdue = isOverdue(row.next_review_at);
              const reviewText = daysUntilReview(row.next_review_at);

              return (
                <div key={row.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {row.topic}{row.subtopic ? ` › ${row.subtopic}` : ''}
                        </span>
                        <Badge variant={mastery.variant} className="text-xs shrink-0">
                          {mastery.label}
                        </Badge>
                        {overdue && (
                          <Badge variant="destructive" className="text-xs shrink-0 gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            Revisar hoje
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Progress value={accuracy} className="h-1 flex-1 max-w-[100px]" />
                        <span className="text-xs text-muted-foreground">{accuracy}%</span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {row.correct} certas
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-destructive" />
                          {row.wrong} erradas
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          N{row.level}
                        </span>
                        {row.next_review_at && (
                          <span className={`flex items-center gap-1 ${overdue ? 'text-destructive font-medium' : ''}`}>
                            <Clock className="h-3 w-3" />
                            Revisar {reviewText}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-xs text-muted-foreground">{row.attempts} tentativas</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ErrorsByTopic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('user_topic_profile')
        .select('id,area,topic,subtopic,level,attempts,correct,wrong,dont_know,priority_score,last_attempt_at,next_review_at')
        .eq('user_id', user.id)
        .order('priority_score', { ascending: false });

      if (error) console.error('Error loading topic errors:', error);
      setRows((data as TopicRow[]) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const grouped = useMemo(() => {
    const map = new Map<string, TopicRow[]>();
    for (const row of rows) {
      const list = map.get(row.area) || [];
      list.push(row);
      map.set(row.area, list);
    }
    // Sort areas: those with overdue first
    return [...map.entries()].sort(([, a], [, b]) => {
      const aOver = a.filter(r => isOverdue(r.next_review_at)).length;
      const bOver = b.filter(r => isOverdue(r.next_review_at)).length;
      return bOver - aOver;
    });
  }, [rows]);

  const totalOverdue = rows.filter(r => isOverdue(r.next_review_at)).length;

  return (
    <MainLayout>
      <div className="container max-w-3xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Mapa de Tópicos</h1>
            <p className="text-muted-foreground text-sm">Prioridades, domínio e revisões por competência</p>
          </div>
          {totalOverdue > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {totalOverdue} vencidas
            </Badge>
          )}
        </div>

        {/* Top 5 weaknesses & strengths summary */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <h3 className="font-semibold text-sm">Top 5 fraquezas</h3>
                </div>
                <div className="space-y-2">
                  {[...rows]
                    .sort((a, b) => b.priority_score - a.priority_score)
                    .slice(0, 5)
                    .map((row) => (
                      <div key={row.id} className="flex items-center justify-between text-xs rounded-lg border p-2">
                        <span className="text-foreground truncate flex-1 mr-2">
                          {AREA_CONFIG[row.area]?.label || row.area} - {row.topic}
                        </span>
                        <Badge variant="destructive" className="text-xs shrink-0">
                          {row.priority_score.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-sm">Top 5 forças</h3>
                </div>
                <div className="space-y-2">
                  {[...rows]
                    .filter(r => r.attempts > 0)
                    .sort((a, b) => {
                      if (b.level !== a.level) return b.level - a.level;
                      const accA = a.correct / a.attempts;
                      const accB = b.correct / b.attempts;
                      return accB - accA;
                    })
                    .slice(0, 5)
                    .map((row) => {
                      const acc = Math.round((row.correct / row.attempts) * 100);
                      return (
                        <div key={row.id} className="flex items-center justify-between text-xs rounded-lg border p-2">
                          <span className="text-foreground truncate flex-1 mr-2">
                            {AREA_CONFIG[row.area]?.label || row.area} - {row.topic}
                          </span>
                          <span className="text-muted-foreground shrink-0">N{row.level} · {acc}%</span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-3">
              <Brain className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="font-medium">Nenhum dado ainda</p>
              <p className="text-sm text-muted-foreground">Resolva algumas questões objetivas para gerar seu mapa adaptativo.</p>
              <Button onClick={() => navigate('/objetivas')} className="mt-2">
                Começar a estudar
              </Button>
            </CardContent>
          </Card>
        ) : (
          grouped.map(([area, list]) => (
            <AreaCard key={area} area={area} list={list} />
          ))
        )}
      </div>
    </MainLayout>
  );
}
