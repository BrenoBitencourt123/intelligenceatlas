import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ArrowRight, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CURSOS_UFU, COTAS, TOTAL_QUESTOES, type CotaId } from '@/data/ufu/vestibular';
import { cn } from '@/lib/utils';


/**
 * Placar vivo (nível Duolingo): barra gráfica com avatar do aluno,
 * pins "CORTE" e "META" pendurados, sem legenda tricolor embaixo.
 * meta = corte × 1.22.
 */
export function GoalCard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const cursoId = (profile as any)?.curso_ufu as string | undefined;
  const cotaId = (profile as any)?.cota_ufu as CotaId | undefined;
  const placarEstimado = ((profile as any)?.placar_estimado ?? null) as number | null;
  const placarFonte = ((profile as any)?.placar_fonte ?? null) as
    | 'quiz'
    | 'autoavaliacao'
    | 'trilha'
    | 'simulado'
    | null;

  const info = useMemo(() => {
    if (!cursoId || !cotaId) return null;
    const curso = CURSOS_UFU.find((c) => c.id === cursoId);
    if (!curso) return null;
    const corte = curso.cortes[cotaId] ?? null;
    const cota = COTAS.find((c) => c.id === cotaId);
    const meta = corte !== null ? Math.min(TOTAL_QUESTOES, Math.ceil(corte * 1.22)) : null;
    return { curso, cota, corte, meta };
  }, [cursoId, cotaId]);

  if (!cursoId || !cotaId) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Target className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Defina seu curso na UFU</h3>
              <p className="text-sm text-muted-foreground">
                Escolha o curso e a modalidade para calcularmos sua meta de acertos na 2ª fase.
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/onboarding')} className="w-full gap-2">
            Escolher curso
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!info) return null;
  const { curso, cota, corte, meta } = info;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-6 space-y-5">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Sua meta na UFU
          </p>
          <h3 className="text-2xl font-black text-foreground leading-tight">{curso.nome}</h3>
          <p className="text-sm font-medium text-muted-foreground">
            {curso.campus} · {curso.turno} · {cota?.label}
          </p>
        </div>

        {corte === null || meta === null ? (
          <p className="text-sm text-muted-foreground">
            A UFU não publicou nota de corte 2026/2 para esta modalidade neste curso.
            Vamos usar a média histórica assim que a base estiver classificada.
          </p>
        ) : placarEstimado === null ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tabular-nums leading-none text-muted-foreground">
                    ?
                  </span>
                  <span className="text-sm font-bold text-muted-foreground tabular-nums">
                    /{TOTAL_QUESTOES}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-muted text-muted-foreground">
                  sem posição ainda
                </span>
              </div>
              <p className="text-sm text-foreground leading-snug">
                Corte é <span className="font-bold tabular-nums">{corte}</span>, meta é{' '}
                <span className="font-bold tabular-nums">{meta}</span>. Faz o diagnóstico rápido
                pra saber onde você tá agora.
              </p>
            </div>
            <Button
              onClick={() => navigate('/trilha/diagnostico')}
              className="w-full gap-2 h-11 font-bold"
            >
              Fazer diagnóstico
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Passar no corte não garante vaga: pra cada vaga, ~6 candidatos passam pra 2ª fase.
              Por isso sua meta é {meta} acertos — o corte ({corte}) mais uma margem pra ficar na
              frente na classificação final.
            </p>
          </div>
        ) : (
          (() => {
            const posicao = placarEstimado;
            const posPct = Math.min(100, Math.max(0, (posicao / TOTAL_QUESTOES) * 100));
            const cortePct = (corte / TOTAL_QUESTOES) * 100;
            const metaPct = (meta / TOTAL_QUESTOES) * 100;
            const zona: 'fora' | 'risco' | 'segura' =
              posicao >= meta ? 'segura' : posicao >= corte ? 'risco' : 'fora';
            const faltam = Math.max(0, meta - posicao);
            const fraseCoach =
              zona === 'segura'
                ? 'Zona segura. Segue firme — cada acerto amplia sua folga.'
                : zona === 'risco'
                ? `Você já cruzou o corte. Faltam ${faltam} pra zona segura.`
                : `Faltam ${faltam} pra chegar na zona segura. Um treino por vez.`;


            return (
              <div className="space-y-6">
                {/* Placar numérico */}
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={cn(
                        'text-5xl font-black tabular-nums leading-none',
                        zona === 'segura' && 'text-[hsl(var(--status-analyzed))]',
                        zona === 'risco' && 'text-[hsl(var(--status-draft))]',
                        zona === 'fora' && 'text-foreground',
                      )}
                    >
                      {posicao}
                    </span>
                    <span className="text-lg font-bold text-muted-foreground tabular-nums">
                      /{TOTAL_QUESTOES}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md',
                      zona === 'segura' &&
                        'bg-[hsl(var(--status-analyzed)/0.15)] text-[hsl(var(--status-analyzed))]',
                      zona === 'risco' &&
                        'bg-[hsl(var(--status-draft)/0.18)] text-[hsl(var(--status-draft))]',
                      zona === 'fora' &&
                        'bg-[hsl(var(--status-unavailable)/0.15)] text-[hsl(var(--status-unavailable))]',
                    )}
                  >
                    {zona === 'segura'
                      ? 'zona segura'
                      : zona === 'risco'
                      ? 'zona de risco'
                      : 'fora do corte'}
                    {placarFonte === 'autoavaliacao' && ' · estimado'}
                  </span>
                </div>

                {/* Trilha gamificada — px-6 dá espaço pro avatar/pins não estourarem as bordas */}
                <div className="relative pt-12 pb-4 px-6">
                  <div className="relative">
                    {/* Pin CORTE (flutuando acima) */}
                    <div
                      className="absolute -top-11 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                      style={{ left: `${cortePct}%` }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.35 }}
                        className="bg-background border-2 border-[hsl(var(--status-draft))] px-2 py-0.5 rounded-md shadow-sm"
                      >
                        <span className="text-[10px] font-black tabular-nums text-[hsl(var(--status-draft))]">
                          {corte} CORTE
                        </span>
                      </motion.div>
                      <div className="w-0.5 h-6 bg-[hsl(var(--status-draft)/0.5)] mt-0.5" />
                    </div>

                    {/* Pin META */}
                    <div
                      className="absolute -top-11 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                      style={{ left: `${metaPct}%` }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.35 }}
                        className="bg-[hsl(var(--status-analyzed))] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1"
                      >
                        <Flag className="h-3 w-3 text-background" strokeWidth={3} />
                        <span className="text-[10px] font-black tabular-nums text-background">
                          {meta} META
                        </span>
                      </motion.div>
                      <div className="w-0.5 h-6 bg-[hsl(var(--status-analyzed))] mt-0.5" />
                    </div>

                    {/* Barra 3D com 3 zonas */}
                    <div className="relative h-5 w-full rounded-full flex overflow-hidden border border-border shadow-inner bg-muted">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{ transformOrigin: 'left' }}
                        className="flex w-full h-full"
                      >
                        <div
                          className="h-full bg-[hsl(var(--status-unavailable)/0.5)] relative"
                          style={{ width: `${cortePct}%` }}
                        >
                          <div
                            className="absolute inset-0 opacity-40"
                            style={{
                              background:
                                'repeating-linear-gradient(45deg, transparent 0 6px, hsl(var(--background) / 0.6) 6px 8px)',
                            }}
                          />
                        </div>
                        <div
                          className="h-full bg-[hsl(var(--status-draft)/0.7)]"
                          style={{ width: `${metaPct - cortePct}%` }}
                        />
                        <div
                          className="h-full bg-[hsl(var(--status-analyzed))]"
                          style={{ width: `${100 - metaPct}%` }}
                        />
                      </motion.div>
                    </div>

                    {/* Avatar do aluno com número — ancorado ao topo da barra */}
                    <motion.div
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                      initial={{ left: '0%', opacity: 0, scale: 0.6, y: -12 }}
                      animate={{ left: `${posPct}%`, opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="relative flex flex-col items-center">
                        <div
                          className={cn(
                            'w-10 h-10 bg-background rounded-2xl border-[3px] shadow-lg flex items-center justify-center rotate-[-4deg] hover:rotate-0 transition-transform',
                            zona === 'segura' && 'border-[hsl(var(--status-analyzed))]',
                            zona === 'risco' && 'border-[hsl(var(--status-draft))]',
                            zona === 'fora' && 'border-[hsl(var(--status-unavailable))]',
                          )}
                        >
                          <span className="text-sm font-black tabular-nums text-foreground">
                            {posicao}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>


                {/* Frase de coach */}
                <p className="text-sm font-medium text-foreground text-center leading-snug">
                  {fraseCoach}
                </p>

                {/* Contexto — por que a meta é maior que o corte */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Passar no corte não garante vaga: pra cada vaga, ~6 candidatos passam pra 2ª
                  fase. Por isso sua meta é {meta} acertos — o corte ({corte}) mais uma margem
                  pra ficar na frente na classificação final.
                </p>
              </div>
            );
          })()
        )}
      </CardContent>
    </Card>
  );
}
