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
import { ArrowRight, Flame, ChevronDown, PenLine, Check, Lock, Sparkles, Clock } from 'lucide-react';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { NotificationBanner } from '@/components/pwa/NotificationBanner';
import { GoalCard } from '@/components/ufu/GoalCard';
import { CURSOS_UFU, COTAS, TOTAL_QUESTOES, type CotaId } from '@/data/ufu/vestibular';
import { cn } from '@/lib/utils';
import { trackUfu } from '@/lib/ufu/track';
import { fetchActiveDays, fetchEssayDays } from '@/lib/activeDays';

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

const DISC_LABEL: Record<string, string> = {
  redacao: 'Redação',
  matematica: 'Matemática',
  linguagens: 'Linguagens',
  humanas: 'Humanas',
  natureza: 'Natureza',
};

// "Próximos assuntos" que aparecem como placeholder até o conteúdo existir no banco.
// Mantém a promessa de amanhã visível — o horizonte é o que segura a sessão de hoje.
const PROXIMOS_ROADMAP: Record<string, string[]> = {
  redacao: ['Carta de reclamação', 'Notícia', 'Resenha crítica'],
  matematica: ['Frações e proporção', 'Função afim', 'Geometria plana'],
  linguagens: ['Interpretação de texto', 'Figuras de linguagem', 'Variação linguística'],
  humanas: ['República Velha', 'Guerra Fria', 'Globalização'],
  natureza: ['Ecologia', 'Cinemática', 'Ligações químicas'],
};

const Today = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const stats = useStudyStats();
  const [nos, setNos] = useState<TrilhaNo[] | null>(null);
  const [progressoMap, setProgressoMap] = useState<Record<string, Progresso>>({});
  const [weekDone, setWeekDone] = useState<Set<number>>(new Set());
  const [essayDays, setEssayDays] = useState<Set<number>>(new Set());
  const [goalOpen, setGoalOpen] = useState(false);

  // "COMEÇAR AQUI" — mostra só na primeira visita à trilha
  const [primeiraVisitaTrilha, setPrimeiraVisitaTrilha] = useState(false);
  useEffect(() => {
    try {
      const visto = localStorage.getItem('ufu_trilha_visto');
      if (!visto) {
        setPrimeiraVisitaTrilha(true);
        localStorage.setItem('ufu_trilha_visto', new Date().toISOString());
      }
    } catch {
      /* storage bloqueado — sem tag, sem crise */
    }
  }, []);

  // Push click: se veio de push de streak em risco, registra e limpa a URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from === 'push-streak') {
      trackUfu('push_click', { tipo: 'streak_risk' });
      params.delete('from');
      const qs = params.toString();
      window.history.replaceState({}, '', `/hoje${qs ? `?${qs}` : ''}`);
    }
  }, []);

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

      // Week: sunday..saturday of current week — fonte única (activeDays.ts)
      const now = new Date();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - now.getDay());
      sunday.setHours(0, 0, 0, 0);
      const saturdayEnd = new Date(sunday);
      saturdayEnd.setDate(sunday.getDate() + 7);

      const [active, essays] = await Promise.all([
        fetchActiveDays(user.id, {
          sinceIso: sunday.toISOString(),
          untilIso: saturdayEnd.toISOString(),
        }),
        fetchEssayDays(user.id, {
          sinceIso: sunday.toISOString(),
          untilIso: saturdayEnd.toISOString(),
        }),
      ]);

      const done = new Set<number>();
      const eDays = new Set<number>();
      active.forEach((day) => {
        const d = new Date(day + 'T12:00:00');
        done.add(d.getDay());
      });
      essays.forEach((day) => {
        const d = new Date(day + 'T12:00:00');
        eDays.add(d.getDay());
      });
      setWeekDone(done);
      setEssayDays(eDays);
    })();
  }, [user]);

  // Cadeado linear: por disciplina, o próximo não-dourado é o "atual"; os seguintes ficam bloqueados.
  const { currentByDisc } = useMemo(() => {
    const curByDisc: Record<string, string> = {};
    if (!nos) return { currentByDisc: curByDisc };
    const grouped: Record<string, TrilhaNo[]> = {};
    nos.forEach((n) => {
      (grouped[n.disciplina] ??= []).push(n);
    });
    for (const disc of Object.keys(grouped)) {
      let foundCurrent = false;
      for (const n of grouped[disc]) {
        if (!progressoMap[n.id]?.dourado && !foundCurrent) {
          curByDisc[disc] = n.id;
          foundCurrent = true;
        }
      }
    }
    return { currentByDisc: curByDisc };
  }, [nos, progressoMap]);

  const activeNo = useMemo(() => {
    if (!nos) return null;
    const currentId = Object.values(currentByDisc)[0];
    return nos.find((n) => n.id === currentId) ?? null;
  }, [nos, currentByDisc]);

  // Trilha renderizada: sempre >= 3 itens visíveis (nó atual + 2 futuros).
  // Se o banco não tem futuros ainda, completa com placeholders "Em breve".
  type LinhaTrilha =
    | { kind: 'no'; no: TrilhaNo; status: 'dourado' | 'atual' | 'bloqueado' }
    | { kind: 'placeholder'; disciplina: string; titulo: string; key: string };

  const linhas: LinhaTrilha[] = useMemo(() => {
    if (!nos) return [];
    const out: LinhaTrilha[] = nos.map((no) => {
      const p = progressoMap[no.id];
      const dourado = !!p?.dourado;
      const isCurrent = !dourado && currentByDisc[no.disciplina] === no.id;
      const status: 'dourado' | 'atual' | 'bloqueado' = dourado
        ? 'dourado'
        : isCurrent
        ? 'atual'
        : 'bloqueado';
      return { kind: 'no', no, status };
    });

    // Se só existe o nó atual (ou nada depois dele), adiciona horizonte da disciplina ativa.
    const discAtiva = activeNo?.disciplina;
    if (discAtiva) {
      const bloqueadosFuturos = out.filter(
        (l) => l.kind === 'no' && l.no.disciplina === discAtiva && l.status === 'bloqueado',
      ).length;
      const faltam = Math.max(0, 2 - bloqueadosFuturos);
      const proximos = PROXIMOS_ROADMAP[discAtiva] ?? [];
      for (let i = 0; i < faltam; i++) {
        const titulo = proximos[i] ?? 'Em breve';
        out.push({
          kind: 'placeholder',
          disciplina: discAtiva,
          titulo,
          key: `ph-${discAtiva}-${i}`,
        });
      }
    }
    return out;
  }, [nos, progressoMap, currentByDisc, activeNo]);

  const missao = useMemo(() => {
    if (isEssayDay()) {
      return {
        label: 'Redação da semana',
        sub: 'Corretor DIRPS · 5 critérios',
        action: () => navigate('/redacao-ufu'),
        isEssay: true,
      };
    }
    if (activeNo) {
      const inProgress = (progressoMap[activeNo.id]?.nivel_atual ?? 0) > 0;
      return {
        label: `${inProgress ? 'Continuar' : 'Começar'}: ${activeNo.titulo}`,
        sub: activeNo.descricao ?? DISC_LABEL[activeNo.disciplina] ?? activeNo.disciplina,
        action: () => navigate(`/ufu/no/${activeNo.id}`),
        isEssay: false,
      };
    }
    return {
      label: 'Revisão livre',
      sub: 'Flashcards do que você já viu',
      action: () => navigate('/flashcards'),
      isEssay: false,
    };
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
    const zona: 'segura' | 'risco' | 'fora' | 'sem-base' =
      corte === null || meta === null
        ? 'sem-base'
        : acertos >= meta
        ? 'segura'
        : acertos >= corte
        ? 'risco'
        : 'fora';
    // Copy de distância — a cor é o afeto, o número é a evidência.
    let distancia = '';
    if (corte !== null && meta !== null) {
      if (zona === 'fora') distancia = `faltam ${corte - acertos} pra zona de risco`;
      else if (zona === 'risco') distancia = `faltam ${meta - acertos} pra zona segura`;
      else if (zona === 'segura') distancia = `folga de ${acertos - meta}`;
    }
    return { curso, cota, corte, meta, acertos, zona, estimado, distancia };
  }, [cursoId, cotaId, profile]);

  const todayDow = new Date().getDay();

  // Fogo do streak — cor por nível
  const streakClass = stats.isLoading
    ? 'text-muted-foreground'
    : stats.streak >= 3
    ? 'text-orange-500 animate-pulse'
    : stats.streak >= 1
    ? 'text-orange-500'
    : 'text-muted-foreground';

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
              <CollapsibleTrigger
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors',
                  placar.zona === 'segura' &&
                    'border-[hsl(var(--status-analyzed)/0.4)] hover:bg-[hsl(var(--status-analyzed)/0.06)]',
                  placar.zona === 'risco' &&
                    'border-[hsl(var(--status-draft)/0.4)] hover:bg-[hsl(var(--status-draft)/0.06)]',
                  placar.zona === 'fora' &&
                    'border-[hsl(var(--status-unavailable)/0.4)] hover:bg-[hsl(var(--status-unavailable)/0.06)]',
                  placar.zona === 'sem-base' && 'border-border hover:bg-muted/50',
                )}
              >
                <div className="flex items-center gap-3 text-sm min-w-0">
                  <span
                    className={cn(
                      'font-bold tabular-nums shrink-0',
                      placar.zona === 'segura' && 'text-[hsl(var(--status-analyzed))]',
                      placar.zona === 'risco' && 'text-[hsl(var(--status-draft))]',
                      placar.zona === 'fora' && 'text-[hsl(var(--status-unavailable))]',
                    )}
                  >
                    {placar.acertos}/{placar.meta ?? '—'}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded',
                      placar.zona === 'segura' &&
                        'bg-[hsl(var(--status-analyzed)/0.15)] text-[hsl(var(--status-analyzed))]',
                      placar.zona === 'risco' &&
                        'bg-[hsl(var(--status-draft)/0.15)] text-[hsl(var(--status-draft))]',
                      placar.zona === 'fora' &&
                        'bg-[hsl(var(--status-unavailable)/0.15)] text-[hsl(var(--status-unavailable))]',
                      placar.zona === 'sem-base' && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {placar.zona === 'segura'
                      ? 'zona segura'
                      : placar.zona === 'risco'
                      ? 'zona de risco'
                      : placar.zona === 'fora'
                      ? 'fora do corte'
                      : 'sem base'}
                  </span>
                  {placar.distancia && (
                    <span className="text-muted-foreground truncate hidden sm:inline">
                      · {placar.distancia}
                      {placar.estimado && (
                        <span className="ml-1 text-[10px] opacity-60">(estimado)</span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ChevronDown
                    className={cn('h-4 w-4 text-muted-foreground transition-transform', goalOpen && 'rotate-180')}
                  />
                </div>
              </CollapsibleTrigger>
              {placar.distancia && (
                <p className="sm:hidden text-xs text-muted-foreground px-4 pt-1.5">
                  {placar.distancia}
                  {placar.estimado && <span className="ml-1 opacity-60">(estimado)</span>}
                </p>
              )}
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
              {/* Em dia de redação, mostrar rota alternativa — nunca beco sem saída. */}
              {missao.isEssay && activeNo && (
                <button
                  onClick={() => navigate(`/ufu/no/${activeNo.id}`)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center gap-1"
                >
                  ou continuar a trilha
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
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
            ) : linhas.length === 0 ? (
              <Card className="border-dashed border-border/60 bg-muted/20 shadow-none">
                <CardContent className="p-6 text-sm text-muted-foreground text-center">
                  Novos nós chegando em breve.
                </CardContent>
              </Card>
            ) : (
              <ol className="flex flex-col items-center gap-2 py-2">
                {linhas.map((linha, i) => {
                  const prev = linhas[i - 1];
                  // Linha entre nós: sólida se o de cima é dourado, senão pontilhada
                  const prevDourado =
                    prev && prev.kind === 'no' && prev.status === 'dourado';
                  return (
                    <li key={linha.kind === 'no' ? linha.no.id : linha.key} className="flex flex-col items-center gap-2 text-center">
                      {i > 0 && (
                        <div
                          className={cn(
                            'h-6 w-0.5',
                            prevDourado
                              ? 'bg-[hsl(var(--status-analyzed))]'
                              : 'bg-border',
                          )}
                        />
                      )}

                      {linha.kind === 'no' ? (
                        <TrilhaNoDot
                          no={linha.no}
                          status={linha.status}
                          firstVisitHint={
                            linha.status === 'atual' && primeiraVisitaTrilha
                          }
                          onClick={() => {
                            if (linha.status !== 'bloqueado') navigate(`/ufu/no/${linha.no.id}`);
                          }}
                        />
                      ) : (
                        <TrilhaPlaceholderDot titulo={linha.titulo} disciplina={linha.disciplina} />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* ── Calendário da semana + streak ── */}
          <section className="pt-2 space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sua semana
              </h3>
              {!stats.isLoading && (
                <span className="flex items-center gap-1.5 text-sm">
                  <Flame className={cn('h-4 w-4', streakClass)} />
                  <span
                    className={cn(
                      'tabular-nums font-semibold',
                      stats.streak >= 1 ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {stats.streak}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stats.streak === 1 ? 'dia seguido' : 'dias seguidos'}
                  </span>
                </span>
              )}
            </div>
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

function TrilhaNoDot({
  no,
  status,
  firstVisitHint,
  onClick,
}: {
  no: TrilhaNo;
  status: 'dourado' | 'atual' | 'bloqueado';
  firstVisitHint: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {status === 'atual' && firstVisitHint && (
        <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-bounce">
          ▼ Começar aqui
        </span>
      )}
      <button
        onClick={onClick}
        disabled={status === 'bloqueado'}
        title={
          status === 'bloqueado' ? 'Bloqueado' : status === 'dourado' ? 'Concluído' : 'Próximo'
        }
        className={cn(
          'rounded-full flex items-center justify-center transition-all relative',
          status === 'atual' &&
            'w-24 h-24 bg-primary text-primary-foreground border-4 border-primary shadow-xl hover:scale-105',
          status === 'dourado' &&
            'w-20 h-20 border-4 bg-[hsl(var(--status-draft)/0.18)] border-[hsl(var(--status-draft))] text-[hsl(var(--status-draft))] shadow-md',
          status === 'bloqueado' &&
            'w-16 h-16 border-2 border-dashed border-border bg-muted/50 text-muted-foreground/50',
        )}
      >
        {status === 'atual' && (
          <span className="absolute inset-0 rounded-full border-4 border-primary/40 animate-ping" />
        )}
        {status === 'dourado' ? (
          <Check className="h-8 w-8" strokeWidth={3} />
        ) : status === 'atual' ? (
          <Sparkles className="h-8 w-8" />
        ) : (
          <Lock className="h-5 w-5" />
        )}
      </button>
      <div className="max-w-[220px]">
        <p
          className={cn(
            'text-sm font-semibold leading-tight',
            status === 'bloqueado' && 'text-muted-foreground',
          )}
        >
          {no.titulo}
        </p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
          {DISC_LABEL[no.disciplina] ?? no.disciplina}
        </p>
      </div>
    </div>
  );
}

function TrilhaPlaceholderDot({ titulo, disciplina }: { titulo: string; disciplina: string }) {
  return (
    <div className="flex flex-col items-center gap-2 opacity-60">
      <div className="w-16 h-16 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground/60">
        <Clock className="h-5 w-5" />
      </div>
      <div className="max-w-[220px]">
        <p className="text-sm font-medium leading-tight text-muted-foreground">Em breve: {titulo}</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mt-0.5">
          {DISC_LABEL[disciplina] ?? disciplina}
        </p>
      </div>
    </div>
  );
}

export default Today;
