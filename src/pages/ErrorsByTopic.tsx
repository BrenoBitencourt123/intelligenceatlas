import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, BookOpen, Brain, Target, Calendar, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

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

const AREA_CONFIG: Record<string, { label: string; icon: typeof BookOpen }> = {
  matematica: { label: 'Matemática', icon: Target },
  linguagens: { label: 'Linguagens', icon: BookOpen },
  natureza: { label: 'Ciências da Natureza', icon: Brain },
  humanas: { label: 'Ciências Humanas', icon: Calendar },
};

function getMasteryLevel(accuracy: number, level: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (level >= 3 && accuracy >= 75) return { label: 'Dominado', variant: 'outline' };
  if (level >= 2 && accuracy >= 55) return { label: 'Em progresso', variant: 'secondary' };
  return { label: 'Prioridade', variant: 'destructive' };
}

function isOverdue(nextReviewAt: string | null): boolean {
  if (!nextReviewAt) return false;
  return new Date(nextReviewAt).getTime() <= Date.now();
}

function daysBetweenNow(date: string | null): number {
  if (!date) return 365;
  return Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)));
}

/* ── Insights Sheet ── */
function InsightsSheet({ open, onOpenChange, rows }: { open: boolean; onOpenChange: (v: boolean) => void; rows: TopicRow[] }) {
  const weaknesses = useMemo(() =>
    [...rows].sort((a, b) => b.priority_score - a.priority_score).slice(0, 5),
    [rows]
  );

  const strengths = useMemo(() =>
    [...rows]
      .filter(r => r.attempts > 0)
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return (b.correct / b.attempts) - (a.correct / a.attempts);
      })
      .slice(0, 5),
    [rows]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-lg">Análise de Desempenho</SheetTitle>
          <SheetDescription>
            Seus pontos fortes e fracos, calculados pelo algoritmo adaptativo.
          </SheetDescription>
        </SheetHeader>

        {/* How it works */}
        <div className="rounded-lg bg-muted/50 p-4 mb-6">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Como funciona</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O <strong>score de prioridade</strong> combina 4 fatores: taxa de erro (50%), nível de domínio (30%), 
            revisões vencidas no SRS (15%) e tempo sem praticar (5%). Quanto maior o score, mais atenção o tópico precisa.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">
            O <strong>nível (N0–N3)</strong> sobe com acertos consecutivos e desce com erros. 
            Cada nível define o intervalo até a próxima revisão: N0–N1 = 2 dias, N2 = 5 dias, N3 = 21 dias.
          </p>
        </div>

        {/* Weaknesses */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Top 5 fraquezas</h4>
          <div className="space-y-2">
            {weaknesses.map((row) => {
              const accuracy = row.attempts > 0 ? Math.round((row.correct / row.attempts) * 100) : 0;
              const overdue = isOverdue(row.next_review_at);
              const staleDays = daysBetweenNow(row.last_attempt_at);

              return (
                <div key={row.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{row.topic}</span>
                    <span className="text-sm font-bold tabular-nums text-foreground">{row.priority_score.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Acerto: <strong className="text-foreground">{accuracy}%</strong> ({row.correct}/{row.attempts})</span>
                    <span>Nível: <strong className="text-foreground">N{row.level}</strong></span>
                    <span>Erros: <strong className="text-foreground">{row.wrong}</strong></span>
                    <span>Sem praticar: <strong className="text-foreground">{staleDays}d</strong></span>
                  </div>
                  {overdue && (
                    <div className="flex items-center gap-1 text-xs text-destructive font-medium">
                      <Clock className="h-3 w-3" /> Revisão vencida
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths */}
        <div className="pb-6">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Top 5 forças</h4>
          <div className="space-y-2">
            {strengths.map((row) => {
              const accuracy = row.attempts > 0 ? Math.round((row.correct / row.attempts) * 100) : 0;

              return (
                <div key={row.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{row.topic}</span>
                    <span className="text-sm font-medium tabular-nums text-muted-foreground">N{row.level} · {accuracy}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Acertos: <strong className="text-foreground">{row.correct}/{row.attempts}</strong></span>
                    <span>Nível: <strong className="text-foreground">N{row.level}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Area Card ── */
function AreaCard({ area, list }: { area: string; list: TopicRow[] }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const cfg = AREA_CONFIG[area] || { label: area, icon: Target };
  const Icon = cfg.icon;

  const totalAttempts = list.reduce((s, r) => s + r.attempts, 0);
  const totalCorrect = list.reduce((s, r) => s + r.correct, 0);
  const areaAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const overdueCount = list.filter(r => isOverdue(r.next_review_at)).length;
  const avgLevel = list.length > 0 ? Math.round(list.reduce((s, r) => s + r.level, 0) / list.length) : 0;

  const sorted = [...list].sort((a, b) => {
    const aOver = isOverdue(a.next_review_at) ? 1 : 0;
    const bOver = isOverdue(b.next_review_at) ? 1 : 0;
    if (bOver !== aOver) return bOver - aOver;
    return b.priority_score - a.priority_score;
  });

  return (
    <Card>
      <CardContent className="p-0">
        <button
          className="w-full px-4 py-4 flex items-center gap-3 text-left"
          onClick={() => setExpanded(e => !e)}
        >
          <Icon className="h-4 w-4 text-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{cfg.label}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {areaAccuracy}% acerto · N{avgLevel} médio · {list.length} tópicos
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5 gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {overdueCount}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2.5"
              onClick={e => { e.stopPropagation(); navigate(`/objetivas?area=${area}`); }}
            >
              Estudar
            </Button>
            {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-border/50">
            {sorted.map((row) => {
              const accuracy = row.attempts > 0 ? Math.round((row.correct / row.attempts) * 100) : 0;
              const mastery = getMasteryLevel(accuracy, row.level);
              const overdue = isOverdue(row.next_review_at);

              return (
                <div key={row.id} className="px-4 py-3 border-b border-border/30 last:border-b-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-medium text-foreground truncate">
                      {row.topic}{row.subtopic ? ` › ${row.subtopic}` : ''}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{row.attempts} tentativas</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={mastery.variant} className="text-[10px] h-5 px-1.5">
                      {mastery.label}
                    </Badge>
                    {overdue && (
                      <Badge variant="destructive" className="text-[10px] h-5 px-1.5 gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        Revisar hoje
                      </Badge>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3" /> {row.correct}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <AlertCircle className="h-3 w-3" /> {row.wrong}
                      </span>
                      <span>N{row.level}</span>
                      <span>{accuracy}%</span>
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

/* ── Page ── */
export default function ErrorsByTopic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsOpen, setInsightsOpen] = useState(false);

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
    return [...map.entries()].sort(([, a], [, b]) => {
      const aOver = a.filter(r => isOverdue(r.next_review_at)).length;
      const bOver = b.filter(r => isOverdue(r.next_review_at)).length;
      return bOver - aOver;
    });
  }, [rows]);

  const totalOverdue = rows.filter(r => isOverdue(r.next_review_at)).length;

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Mapa de Tópicos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Domínio e revisões por competência</p>
          </div>
          {totalOverdue > 0 && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertCircle className="h-3 w-3" />
              {totalOverdue} vencidas
            </Badge>
          )}
        </div>

        {/* Insights button */}
        {!loading && rows.length > 0 && (
          <Button
            variant="outline"
            className="w-full justify-between h-11"
            onClick={() => setInsightsOpen(true)}
          >
            <span className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Fraquezas e forças
            </span>
            <span className="text-xs text-muted-foreground">Ver análise →</span>
          </Button>
        )}

        <InsightsSheet open={insightsOpen} onOpenChange={setInsightsOpen} rows={rows} />

        {/* Area cards */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
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
          <div className="space-y-3">
            {grouped.map(([area, list]) => (
              <AreaCard key={area} area={area} list={list} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
