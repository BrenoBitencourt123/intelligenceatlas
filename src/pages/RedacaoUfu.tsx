import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, Loader2, Sparkles, PenLine, ChevronDown, ShieldAlert, Target,
  Lock, MessageCircle, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  GENEROS_UFU, PROPOSTAS_UFU, CRITERIOS_UFU, REDACAO_TOTAL,
  LINHAS_MIN, LINHAS_MAX, estimarLinhas,
} from "@/data/ufu/redacao";
import { UFU_CONFIG, whatsappBrenoUrl } from "@/lib/ufu/config";
import { trackUfu } from "@/lib/ufu/track";

interface CriterioResultado {
  id: string;
  pontos: number;
  faixa?: string;
  justificativa?: string;
  evidencias?: string[];
  comoSubirUmaFaixa?: string;
}

interface AnaliseUfu {
  eliminado: boolean;
  motivosEliminacao: string[];
  alertas: string[];
  criterios: CriterioResultado[];
  totalScore: number;
  linhasEstimadas: number;
  desviosContados: string[];
  feedbackGeral: string;
  prioridadeUnica: string;
}

interface VersaoEvoluida {
  improvedText: string;
  criteriosAlvo: { id: string; de: number; para: number }[];
  mudancas: { criterioId: string; antes: string; depois: string; porque: string }[];
  oQueNaoMudei: string;
  tarefaReescrita: string;
}

export default function RedacaoUfu() {
  const { user } = useAuth();
  const [propostaId, setPropostaId] = useState<string>("");
  const [genreId, setGenreId] = useState<string>("");
  const [theme, setTheme] = useState("");
  const [text, setText] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState<AnaliseUfu | null>(null);
  const [evoluindo, setEvoluindo] = useState(false);
  const [evolucao, setEvolucao] = useState<VersaoEvoluida | null>(null);
  const [criterioAberto, setCriterioAberto] = useState<string | null>(null);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [semCreditos, setSemCreditos] = useState(false);

  const refetchSaldo = async () => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).rpc("ufu_correcoes_saldo", { p_user: user.id });
    if (typeof data === "number") {
      setSaldo(data);
      setSemCreditos(data <= 0);
    }
  };

  useEffect(() => {
    refetchSaldo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const genero = GENEROS_UFU.find((g) => g.id === genreId);
  const linhas = useMemo(() => estimarLinhas(text), [text]);
  const nomeCriterio = (id: string) => CRITERIOS_UFU.find((c) => c.id === id)?.nome ?? id;
  const maxCriterio = (id: string) => CRITERIOS_UFU.find((c) => c.id === id)?.max ?? 0;

  const linhasOk = linhas >= LINHAS_MIN && linhas <= LINHAS_MAX;
  const linhasPct = Math.min(100, (linhas / LINHAS_MAX) * 100);

  function aplicarProposta(id: string) {
    setPropostaId(id);
    const p = PROPOSTAS_UFU.find((pp) => pp.id === id);
    if (p) {
      setGenreId(p.generoId);
      setTheme(p.titulo.split("—")[1]?.trim() ?? p.titulo);
    }
  }

  async function analisar() {
    if (!genero) {
      toast({ title: "Escolha o gênero", description: "Na UFU, fugir do gênero zera a redação.", variant: "destructive" });
      return;
    }
    if (semCreditos) {
      trackUfu("calc_completed", { evento: "paywall_visto" });
      return;
    }
    setAnalisando(true);
    setAnalise(null);
    setEvolucao(null);
    try {
      const proposta = PROPOSTAS_UFU.find((p) => p.id === propostaId);
      const { data, error } = await supabase.functions.invoke("analyze-essay-ufu", {
        body: {
          text, theme, genreId,
          genreLabel: genero.label,
          genreElementos: genero.elementos,
          proposta: proposta?.enunciado,
        },
      });
      if (error) {
        const parsed = await parseFnError(error);
        // Edge function respondeu 402 com { code: "sem_creditos" } → mostra paywall sem toast de erro
        if (parsed?.code === "sem_creditos") {
          setSemCreditos(true);
          setSaldo(0);
          trackUfu("calc_completed", { evento: "paywall_visto" });
          return;
        }
        throw new Error(parsed?.message ?? "Erro na correção");
      }
      if (data?.error) throw new Error(data.error);
      setAnalise(data as AnaliseUfu);
      await refetchSaldo();

      if (user) {
        await supabase.from("essays").insert({
          user_id: user.id,
          theme: theme || genero.label,
          blocks: [{ id: "ufu_text", type: "ufu_text", text }] as never,
          analysis: { banca: "ufu", genreId, ...data } as never,
          total_score: data.totalScore,
          analyzed_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      toast({ title: "Não deu pra corrigir", description: (e as Error).message, variant: "destructive" });
    } finally {
      setAnalisando(false);
    }
  }

  async function gerarEvolucao() {
    if (!analise) return;
    setEvoluindo(true);
    try {
      const { data, error } = await supabase.functions.invoke("improve-essay-ufu", {
        body: { text, theme, genreLabel: genero?.label, criterios: analise.criterios },
      });
      if (error) throw new Error((await parseFnError(error))?.message ?? "Erro ao evoluir");
      if (data?.error) throw new Error(data.error);
      setEvolucao(data as VersaoEvoluida);
    } catch (e) {
      toast({ title: "Não deu pra gerar a versão evoluída", description: (e as Error).message, variant: "destructive" });
    } finally {
      setEvoluindo(false);
    }
  }

  return (
    <MainLayout>
      {/* Header interno da página (não sticky — o TopNav já é sticky no desktop) */}
      <div className="border-b border-border bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">Redação</h1>
            <span className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              Banca UFU · DIRPS
            </span>
            {saldo !== null && (
              <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">
                {saldo} {saldo === 1 ? "correção disponível" : "correções disponíveis"}
              </span>
            )}
          </div>
          {analise && !analise.eliminado && (
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="text-2xl font-extrabold">{analise.totalScore}</span>
              <span className="text-sm text-muted-foreground">/{REDACAO_TOTAL}</span>
            </div>
          )}
        </div>
      </div>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] items-start">
          {/* ═══ Coluna esquerda: proposta + editor ═══ */}
          <div className="space-y-5">
            {/* Setup */}
            <section className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Proposta real (opcional)
                  </label>
                  <Select value={propostaId} onValueChange={aplicarProposta}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Já caiu na UFU" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPOSTAS_UFU.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Gênero solicitado *
                  </label>
                  <Select value={genreId} onValueChange={setGenreId}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Fugir do gênero zera" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENEROS_UFU.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Tema / recorte da proposta
                </label>
                <Input
                  className="rounded-lg"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex.: desafios da adoção no Brasil"
                />
              </div>
              {genero && (
                <div className="pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    O que a banca procura em {genero.label.toLowerCase()}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {genero.elementos.map((el, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                        {el}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Editor */}
            <section className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border">
                <span className="text-sm font-semibold">Sua redação</span>
                <span
                  className={cn(
                    "text-xs tabular-nums font-medium",
                    linhas === 0 && "text-muted-foreground",
                    linhas > 0 && !linhasOk && "text-destructive",
                    linhasOk && "text-status-analyzed",
                  )}
                >
                  {linhas} de {LINHAS_MAX} linhas · mín. {LINHAS_MIN}
                </span>
              </div>
              {/* régua de linhas */}
              <div className="h-1 bg-muted">
                <div
                  className={cn(
                    "h-full transition-all",
                    linhas > 0 && !linhasOk ? "bg-destructive" : "bg-primary",
                  )}
                  style={{ width: `${linhasPct}%` }}
                />
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole ou digite sua redação completa. A folha oficial tem 34 linhas — menos de 15 zera e elimina."
                className="min-h-[380px] border-0 rounded-none focus-visible:ring-0 px-5 py-4 text-[15px] leading-7 resize-y"
              />
              <div className="p-4 border-t border-border">
                {semCreditos ? (
                  <PaywallCard userEmail={user?.email ?? ""} />
                ) : (
                  <Button
                    className="w-full rounded-xl h-12 text-[15px]"
                    onClick={analisar}
                    disabled={analisando || !text.trim()}
                  >
                    {analisando
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <PenLine className="h-4 w-4" />}
                    {analisando ? "Corrigindo como a banca..." : "Corrigir na rubrica da UFU"}
                  </Button>
                )}
              </div>
            </section>
          </div>

          {/* ═══ Coluna direita: resultado ═══ */}
          <div className="lg:sticky lg:top-24 space-y-5">
            <AnimatePresence mode="wait">
              {!analise && (
                <motion.section
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-card rounded-xl border border-dashed border-border p-8 text-center space-y-2"
                >
                  <Target className="h-6 w-6 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Correção nos 5 critérios oficiais</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    80 pontos, notas por faixa (a banca não dá 17), checagem das
                    7 condições de nota zero e o caminho pra subir uma faixa em cada critério.
                  </p>
                </motion.section>
              )}

              {analise && (
                <motion.div
                  key="resultado"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  {/* Score hero / eliminação */}
                  {analise.eliminado ? (
                    <section className="rounded-xl border-2 border-destructive bg-destructive/5 p-5 space-y-2">
                      <div className="flex items-center gap-2 text-destructive font-bold">
                        <ShieldAlert className="h-5 w-5" />
                        NOTA ZERO — eliminado
                      </div>
                      <ul className="text-sm space-y-1 list-disc pl-5">
                        {analise.motivosEliminacao.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </section>
                  ) : (
                    <section className="bg-card rounded-xl border border-border shadow-panel p-6 text-center">
                      <p className="text-6xl font-extrabold tabular-nums tracking-tight">
                        {analise.totalScore}
                        <span className="text-2xl font-semibold text-muted-foreground">/{REDACAO_TOTAL}</span>
                      </p>
                      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(analise.totalScore / REDACAO_TOTAL) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.15 }}
                        />
                      </div>
                    </section>
                  )}

                  {analise.alertas.length > 0 && !analise.eliminado && (
                    <section className="rounded-xl border border-status-draft/40 bg-status-draft/10 p-4 text-sm space-y-1">
                      <p className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-4 w-4" /> Alertas da banca
                      </p>
                      {analise.alertas.map((a, i) => (
                        <p key={i} className="text-muted-foreground">{a}</p>
                      ))}
                    </section>
                  )}

                  {/* Critérios */}
                  <section className="bg-card rounded-xl border border-border shadow-card divide-y divide-border overflow-hidden">
                    {analise.criterios.map((cr) => {
                      const max = maxCriterio(cr.id);
                      const aberto = criterioAberto === cr.id;
                      return (
                        <div key={cr.id}>
                          <button
                            className="w-full px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
                            onClick={() => setCriterioAberto(aberto ? null : cr.id)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium">{nomeCriterio(cr.id)}</span>
                              <span className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-bold tabular-nums">{cr.pontos}<span className="text-muted-foreground font-normal">/{max}</span></span>
                                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", aberto && "rotate-180")} />
                              </span>
                            </div>
                            <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${max ? (cr.pontos / max) * 100 : 0}%` }}
                              />
                            </div>
                            {cr.faixa && (
                              <p className="mt-1.5 text-xs text-muted-foreground">{cr.faixa}</p>
                            )}
                          </button>
                          <AnimatePresence>
                            {aberto && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 space-y-2 text-sm">
                                  {cr.justificativa && (
                                    <p className="text-muted-foreground">{cr.justificativa}</p>
                                  )}
                                  {cr.evidencias?.map((ev, i) => (
                                    <p key={i} className="border-l-2 border-border pl-3 italic text-muted-foreground text-[13px]">
                                      "{ev}"
                                    </p>
                                  ))}
                                  {cr.comoSubirUmaFaixa && (
                                    <p className="rounded-lg bg-muted p-3 text-[13px] leading-relaxed">
                                      <span className="font-semibold">Pra subir uma faixa: </span>
                                      {cr.comoSubirUmaFaixa}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                    {analise.desviosContados.length > 0 && (
                      <div className="px-4 py-3.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Desvios contados ({analise.desviosContados.length})
                        </p>
                        <div className="space-y-1 text-[13px] text-muted-foreground">
                          {analise.desviosContados.map((d, i) => <p key={i}>{d}</p>)}
                        </div>
                      </div>
                    )}
                  </section>

                  {analise.feedbackGeral && (
                    <p className="text-sm leading-relaxed text-muted-foreground px-1">
                      {analise.feedbackGeral}
                    </p>
                  )}
                  {analise.prioridadeUnica && (
                    <section className="rounded-xl bg-primary text-primary-foreground p-4 text-sm leading-relaxed">
                      <span className="font-bold">Se melhorar UMA coisa: </span>
                      {analise.prioridadeUnica}
                    </section>
                  )}

                  {!analise.eliminado && !evolucao && (
                    <Button
                      className="w-full rounded-xl h-12"
                      variant="outline"
                      onClick={gerarEvolucao}
                      disabled={evoluindo}
                    >
                      {evoluindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {evoluindo ? "Evoluindo sua redação..." : "Ver minha redação uma faixa acima"}
                    </Button>
                  )}
                  <GrupoWhatsappButton />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ═══ Versão evoluída (largura total) ═══ */}
        <AnimatePresence>
          {evolucao && (
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px] items-start"
            >
              <div className="bg-card rounded-xl border border-border shadow-panel overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="font-bold">Sua redação, uma faixa acima</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mesmas ideias, mesmo repertório — evoluída em{" "}
                      {evolucao.criteriosAlvo.map((a) => nomeCriterio(a.id)).join(" e ")}
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <div className="p-5 text-[15px] leading-7 whitespace-pre-wrap">
                  {evolucao.improvedText}
                </div>
              </div>

              <div className="space-y-4 lg:sticky lg:top-24">
                <section className="bg-card rounded-xl border border-border shadow-card divide-y divide-border overflow-hidden">
                  <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    O que mudou (e por quê)
                  </p>
                  {evolucao.mudancas.map((m, i) => (
                    <div key={i} className="px-4 py-3 space-y-1.5 text-[13px]">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {nomeCriterio(m.criterioId)}
                      </p>
                      <p className="line-through decoration-destructive/50 text-muted-foreground leading-relaxed">
                        {m.antes}
                      </p>
                      <p className="font-medium leading-relaxed">{m.depois}</p>
                      <p className="text-muted-foreground leading-relaxed">{m.porque}</p>
                    </div>
                  ))}
                </section>
                {evolucao.oQueNaoMudei && (
                  <p className="text-xs text-muted-foreground px-1 leading-relaxed">
                    <span className="font-semibold">De propósito, não mexi em: </span>
                    {evolucao.oQueNaoMudei}
                  </p>
                )}
                <section className="rounded-xl bg-primary text-primary-foreground p-4 space-y-1">
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <PenLine className="h-4 w-4" /> Agora é sua vez — a prova é à caneta
                  </p>
                  <p className="text-sm leading-relaxed opacity-90">{evolucao.tarefaReescrita}</p>
                </section>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </MainLayout>
  );
}

async function parseFnError(error: unknown): Promise<{ message: string | null; code?: string } | null> {
  try {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.json();
      return { message: body?.error ?? null, code: body?.code };
    }
  } catch { /* noop */ }
  return { message: (error as Error)?.message ?? null };
}
