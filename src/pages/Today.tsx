import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyStats } from '@/hooks/useStudyStats';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { ArrowRight, Flame, ChevronDown, PenLine, Check, Lock, Sparkles } from 'lucide-react';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { NotificationBanner } from '@/components/pwa/NotificationBanner';
import { GoalCard } from '@/components/ufu/GoalCard';
import { CURSOS_UFU, COTAS, TOTAL_QUESTOES, type CotaId } from '@/data/ufu/vestibular';
import { cn } from '@/lib/utils';

// Trilha tables not yet in generated types
const supabase = supabaseTyped as unknown as { from: (t: string) => any };

type TrilhaNo = {
  id: string;
  disciplina: string;
  titulo: string;
  descricao: string | null;
  nivel_max: number;
  ordem: number;
};
type Progresso = { no_id: string; nivel_atual: number; dourado: boolean };

const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const isEssayDay = () => new Date().getDay() === 6; // sábado

const Today = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const stats = useStudyStats();
  const [nos, setNos] = useState<TrilhaNo[] | null>(null);
  const [progressoMap, setProgressoMap] = useState<Record<string, Progresso>>({});
  const [weekDone, setWeekDone] = useState<Set<number>>(new Set());
  const [essayDays, setEssayDays] = useState<Set<number>>(new Set());
  const [goalOpen, setGoalOpen] = useState(false);

  // Gate: se não fez o diagnóstico, manda pra lá
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabaseTyped
        .from('profiles')
        .select('diagnostico_feito_at' as never)
        .eq('id', user.id)
        .maybeSingle();
      const feito = (data as { diagnostico_feito_at?: string | null } | null)?.diagnostico_feito_at;
      if (!feito) navigate('/trilha/diagnostico', { replace: true });
    })();
  }, [user, navigate]);

  // Load trail nós + user progress + week activity
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: nosData }, { data: progData }] = await Promise.all([
        supabase
          .from('trilha_nos')
          .select('id,disciplina,titulo,descricao,nivel_max,ordem')
          .eq('ativo', true)
          .order('disciplina')
          .order('ordem'),
        supabase.from('trilha_progresso').select('no_id,nivel_atual,dourado').eq('user_id', user.id),
      ]);
      setNos((nosData as TrilhaNo[]) ?? []);
      const pm: Record<string, Progresso> = {};
      ((progData as Progresso[]) ?? []).forEach((p) => (pm[p.no_id] = p));
      setProgressoMap(pm);

      // Week: sunday..saturday of current week
      const now = new Date();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - now.getDay());
      sunday.setHours(0, 0, 0, 0);
      const saturdayEnd = new Date(sunday);
      saturdayEnd.setDate(sunday.getDate() + 7);

      const [{ data: respostas }, { data: attempts }, { data: essays }] = await Promise.all([
        supabase
          .from('trilha_respostas')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', sunday.toISOString())
          .lt('created_at', saturdayEnd.toISOString()),
        supabaseTyped
          .from('question_attempts')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', sunday.toISOString())
          .lt('created_at', saturdayEnd.toISOString()),
        supabaseTyped
          .from('essays')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', sunday.toISOString())
          .lt('created_at', saturdayEnd.toISOString()),
      ]);

      const done = new Set<number>();
      const eDays = new Set<number>();
      const push = (iso: string, target: Set<number>) => {
        target.add(new Date(iso).getDay());
      };
      ((respostas as { created_at: string }[]) ?? []).forEach((r) => push(r.created_at, done));
      ((attempts as { created_at: string }[] | null) ?? []).forEach((r) => push(r.created_at, done));
      ((essays as { created_at: string }[] | null) ?? []).forEach((r) => {
        push(r.created_at, done);
        push(r.created_at, eDays);
      });
      setWeekDone(done);
      setEssayDays(eDays);
    })();
  }, [user]);

  // Cadeado linear: por disciplina, o próximo não-dourado é o "atual"; os seguintes ficam bloqueados.
  const { availableSet, currentByDisc } = useMemo(() => {
    const avail = new Set<string>();
    const curByDisc: Record<string, string> = {};
    if (!nos) return { availableSet: avail, currentByDisc: curByDisc };
    // nos já vem ordenado por (disciplina, ordem)
    const grouped: Record<string, TrilhaNo[]> = {};
    nos.forEach((n) => {
      (grouped[n.disciplina] ??= []).push(n);
    });
    for (const disc of Object.keys(grouped)) {
      let foundCurrent = false;
      for (const n of grouped[disc]) {
        if (progressoMap[n.id]?.dourado) {
          avail.add(n.id);
        } else if (!foundCurrent) {
          avail.add(n.id);
          curByDisc[disc] = n.id;
          foundCurrent = true;
        } else {
          // bloqueado
        }
      }
    }
    return { availableSet: avail, currentByDisc: curByDisc };
  }, [nos, progressoMap]);

  const activeNo = useMemo(() => {
    if (!nos) return null;
    // Prioriza qualquer disciplina com nó atual (primeiro que aparecer)
    const currentId = Object.values(currentByDisc)[0];
    return nos.find((n) => n.id === currentId) ?? null;
  }, [nos, currentByDisc]);

  const missao = useMemo(() => {
    if (isEssayDay()) {
      return { label: 'Redação da semana', sub: 'Corretor DIRPS · 5 critérios', action: () => navigate('/redacao-ufu') };
    }
    if (activeNo) {
      const inProgress = (progressoMap[activeNo.id]?.nivel_atual ?? 0) > 0;
      return {
        label: `${inProgress ? 'Continuar' : 'Começar'}: ${activeNo.titulo}`,
        sub: activeNo.descricao ?? activeNo.disciplina,
        action: () => navigate(`/ufu/no/${activeNo.id}`),
      };
    }
    return { label: 'Revisão livre', sub: 'Flashcards do que você já viu', action: () => navigate('/flashcards') };
  }, [activeNo, progressoMap, navigate]);

  // Placar compacto
  const cursoId = (profile as { curso_ufu?: string } | null | undefined)?.curso_ufu;
  const cotaId = (profile as { cota_ufu?: CotaId } | null | undefined)?.cota_ufu;
  const placar = useMemo(() => {
    if (!cursoId || !cotaId) return null;
    const curso = CURSOS_UFU.find((c) => c.id === cursoId);
    if (!curso) return null;
    const corte = curso.cortes[cotaId] ?? null;
    const meta = corte !== null ? Math.min(TOTAL_QUESTOES, Math.ceil(corte * 1.22)) : null;
    const cota = COTAS.find((c) => c.id === cotaId);
    const acertos = (profile as { placar_estimado?: number | null } | null)?.placar_estimado ?? 0;
    const fonte = (profile as { placar_fonte?: string | null } | null)?.placar_fonte ?? null;
    const estimado = fonte === 'autoavaliacao';
    const zona =
      corte === null || meta === null
        ? 'sem base'
        : acertos >= meta
        ? 'zona segura'
        : acertos >= corte
        ? 'zona de risco'
        : 'fora do corte';
    return { curso, cota, corte, meta, acertos, zona, estimado };
  }, [cursoId, cotaId, profile]);

  const todayDow = new Date().getDay();

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <InstallBanner />
            <NotificationBanner />
          </div>

          {/* ── Placar compacto ── */}
          {placar ? (
            <Collapsible open={goalOpen} onOpenChange={setGoalOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 text-sm min-w-0">
                  <span className="font-bold tabular-nums shrink-0">
                    {placar.acertos}/{placar.meta ?? '—'}
                  </span>
                  <span className="text-muted-foreground shrink-0">·</span>
                  <span className="text-muted-foreground truncate">{placar.zona}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {!stats.isLoading && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Flame className="h-3.5 w-3.5 text-destructive" />
                      <span className="tabular-nums">{stats.streak}</span>
                    </span>
                  )}
                  <ChevronDown
                    className={cn('h-4 w-4 text-muted-foreground transition-transform', goalOpen && 'rotate-180')}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <GoalCard />
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <GoalCard />
          )}

          {/* ── Card-missão (herói) ── */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Missão de hoje · ~10 min
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                  {missao.label}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-2">{missao.sub}</p>
              </div>
              <Button onClick={missao.action} size="lg" className="w-full gap-2">
                COMEÇAR
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* ── A trilha ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-1">
              Sua trilha
            </h3>
            {nos === null ? (
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
            ) : nos.length === 0 ? (
              <Card className="border-dashed border-border/60 bg-muted/20 shadow-none">
                <CardContent className="p-6 text-sm text-muted-foreground text-center">
                  Novos nós chegando em breve.
                </CardContent>
              </Card>
            ) : (
              <ol className="flex flex-col items-center gap-6 py-2">
                {nos.map((no, i) => {
                  const p = progressoMap[no.id];
                  const dourado = !!p?.dourado;
                  const isCurrent = !dourado && currentByDisc[no.disciplina] === no.id;
                  const locked = !dourado && !isCurrent;
                  return (
                    <li key={no.id} className="flex flex-col items-center gap-2 text-center">
                      <button
                        onClick={() => (isCurrent || dourado) && navigate(`/ufu/no/${no.id}`)}
                        disabled={locked}
                        title={locked ? 'Bloqueado' : dourado ? 'Concluído' : 'Próximo'}
                        className={cn(
                          'w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all',
                          dourado &&
                            'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-900/40 dark:border-amber-500 dark:text-amber-100',
                          isCurrent &&
                            'bg-primary text-primary-foreground border-primary shadow-lg animate-pulse hover:scale-105',
                          locked && 'bg-muted border-border text-muted-foreground/50',
                        )}
                      >
                        {dourado ? (
                          <Check className="h-8 w-8" strokeWidth={3} />
                        ) : isCurrent ? (
                          <Sparkles className="h-7 w-7" />
                        ) : (
                          <Lock className="h-6 w-6" />
                        )}
                      </button>
                      <div className="max-w-[220px]">
                        <p className={cn('text-sm font-semibold leading-tight', locked && 'text-muted-foreground')}>
                          {no.titulo}
                        </p>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
                          {no.disciplina === 'redacao' ? 'Redação' : no.disciplina}
                        </p>
                      </div>
                      {i < nos.length - 1 && <div className="h-6 w-px bg-border mt-1" />}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* ── Calendário da semana ── */}
          <section className="pt-2">
            <div className="flex items-center justify-between gap-1 px-1">
              {DIAS.map((letra, dow) => {
                const done = weekDone.has(dow);
                const essay = essayDays.has(dow);
                const isToday = dow === todayDow;
                return (
                  <div key={dow} className="flex flex-col items-center gap-1.5 flex-1">
                    <span
                      className={cn(
                        'text-[10px] uppercase tracking-wider',
                        isToday ? 'text-foreground font-bold' : 'text-muted-foreground',
                      )}
                    >
                      {letra}
                    </span>
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center border',
                        done
                          ? 'bg-foreground text-background border-foreground'
                          : isToday
                          ? 'border-foreground border-dashed'
                          : 'border-border',
                      )}
                    >
                      {essay ? (
                        <PenLine className="h-3.5 w-3.5" />
                      ) : done ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default Today;
