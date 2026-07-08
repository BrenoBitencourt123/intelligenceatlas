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

  // Retorno do Stripe Checkout: /redacao-ufu?pago=cs_...
  useEffect(() => {
    if (!user) return;
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("pago");
    const cancelado = url.searchParams.get("cancelado");
    if (cancelado) {
      toast({ title: "Pagamento cancelado", description: "Nenhuma cobrança foi feita." });
      url.searchParams.delete("cancelado");
      window.history.replaceState({}, "", url.pathname + (url.search || ""));
      return;
    }
    if (!sessionId || !sessionId.startsWith("cs_")) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-checkout-ufu", {
          body: { session_id: sessionId },
        });
        if (error) throw new Error((await parseFnError(error))?.message ?? "Erro ao confirmar pagamento");
        if (data?.creditado) {
          toast({
            title: "Pagamento confirmado ✓",
            description: `${data.qtd} ${data.qtd === 1 ? "correção liberada" : "correções liberadas"}. Bons estudos!`,
          });
          await refetchSaldo();
          setSemCreditos(false);
        } else {
          toast({
            title: "Pagamento em processamento",
            description: "Assim que o Stripe confirmar, seu crédito aparece aqui.",
          });
        }
      } catch (e) {
        toast({ title: "Não deu pra confirmar", description: (e as Error).message, variant: "destructive" });
      } finally {
        url.searchParams.delete("pago");
        window.history.replaceState({}, "", url.pathname + (url.search || ""));
      }
    })();
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

  const pctLinhas = Math.min(100, (analise?.totalScore ?? 0) / REDACAO_TOTAL * 100);

  return (
    <MainLayout>
      {/* ─── Header editorial ─── */}
      <header className="border-b border-border bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Banca UFU · DIRPS
                </span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  80 pontos · 34 linhas
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Corretor de redação UFU
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                Rubrica oficial da DIRPS, faixas reais (a banca não dá 17) e o caminho para subir uma faixa em cada critério.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {saldo !== null && (
                <div className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium tabular-nums">
                  <span className="text-foreground">{saldo}</span>
                  <span className="text-muted-foreground ml-1">
                    {saldo === 1 ? "correção" : "correções"}
                  </span>
                </div>
              )}
              {analise && !analise.eliminado && (
                <div className="rounded-xl border border-border bg-card px-4 py-2 flex items-baseline gap-1 tabular-nums">
                  <span className="text-2xl font-extrabold text-foreground">{analise.totalScore}</span>
                  <span className="text-sm text-muted-foreground">/{REDACAO_TOTAL}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] items-start">
          {/* ═══ Coluna esquerda ═══ */}
          <div className="space-y-6">
            {/* ─── Setup: proposta + gênero + tema ─── */}
            <section className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">1</span>
                  <h2 className="text-sm font-bold text-foreground">Configure a proposta</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-8">
                  O gênero é obrigatório — fugir dele zera na hora.
                </p>
              </div>

              <div className="p-5 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Proposta real da UFU <span className="text-muted-foreground/60 normal-case tracking-normal font-normal">(opcional)</span>
                  </label>
                  <Select value={propostaId} onValueChange={aplicarProposta}>
                    <SelectTrigger className="rounded-lg h-11">
                      <SelectValue placeholder="Escolher uma proposta que já caiu" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPOSTAS_UFU.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    Gênero solicitado
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GENEROS_UFU.map((g) => {
                      const active = g.id === genreId;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGenreId(g.id)}
                          className={cn(
                            "text-left rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-background hover:border-foreground/30 hover:bg-muted/40 text-foreground",
                          )}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tema / recorte da proposta
                  </label>
                  <Input
                    className="rounded-lg h-11"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Ex.: desafios da adoção no Brasil"
                  />
                </div>

                <AnimatePresence>
                  {genero && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg bg-muted/50 border border-border/60 p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          A banca vai procurar em {genero.label.toLowerCase()}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {genero.elementos.map((el, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-background border border-border text-foreground">
                              {el}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* ─── Editor: folha de redação ─── */}
            <section className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-border/60">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">2</span>
                    <h2 className="text-sm font-bold text-foreground">Sua redação</h2>
                  </div>
                  <span
                    className={cn(
                      "text-xs tabular-nums font-semibold px-2.5 py-1 rounded-full border",
                      linhas === 0 && "text-muted-foreground border-border bg-muted/40",
                      linhas > 0 && !linhasOk && "text-destructive border-destructive/30 bg-destructive/5",
                      linhasOk && "text-status-analyzed border-status-analyzed/30 bg-status-analyzed/5",
                    )}
                  >
                    {linhas}/{LINHAS_MAX} linhas
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-8">
                  Folha oficial: 34 linhas. Menos de {LINHAS_MIN} zera e elimina.
                </p>
              </div>

              {/* régua fina */}
              <div className="h-[3px] bg-muted">
                <div
                  className={cn(
                    "h-full transition-all",
                    linhas > 0 && !linhasOk ? "bg-destructive" : "bg-primary",
                  )}
                  style={{ width: `${linhasPct}%` }}
                />
              </div>

              <div className="relative bg-[linear-gradient(to_bottom,transparent_calc(1.75rem-1px),hsl(var(--border)/0.35)_calc(1.75rem-1px),hsl(var(--border)/0.35)_1.75rem)] bg-[length:100%_1.75rem]">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escreva ou cole sua redação aqui..."
                  className="min-h-[420px] border-0 rounded-none focus-visible:ring-0 bg-transparent px-6 py-3 text-[15px] leading-7 resize-y font-serif placeholder:font-sans placeholder:text-muted-foreground/70"
                />
              </div>

              <div className="p-5 border-t border-border/60 bg-muted/30">
                {semCreditos ? (
                  <PaywallCard userEmail={user?.email ?? ""} />
                ) : (
                  <Button
                    className="w-full rounded-xl h-12 text-[15px] font-semibold"
                    onClick={analisar}
                    disabled={analisando || !text.trim()}
                  >
                    {analisando
                      ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      : <PenLine className="h-4 w-4 mr-2" />}
                    {analisando ? "Corrigindo como a banca..." : "Corrigir na rubrica da UFU"}
                  </Button>
                )}
                {!semCreditos && (
                  <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">
                    Correção em ~30s · avalia os 5 critérios oficiais e as 7 condições de nota zero
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* ═══ Coluna direita — resultado ═══ */}
          <aside className="lg:sticky lg:top-24 space-y-5">
            <AnimatePresence mode="wait">
              {!analise && (
                <motion.section
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-card rounded-2xl border border-dashed border-border p-6 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-bold">O que você vai receber</p>
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {[
                      "Nota por faixa nos 5 critérios oficiais",
                      "Checagem das 7 condições de nota zero",
                      "Evidências do seu texto (não só opinião)",
                      "O caminho para subir uma faixa em cada critério",
                      "Versão evoluída com as mesmas ideias",
                    ].map((item, i) => (
                      <li key={i} className="flex gap-2.5 text-muted-foreground leading-relaxed">
                        <span className="text-primary shrink-0 mt-0.5">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
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
                    <section className="rounded-2xl border-2 border-destructive bg-destructive/5 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-destructive font-bold">
                        <ShieldAlert className="h-5 w-5" />
                        NOTA ZERO — eliminado
                      </div>
                      <ul className="text-sm space-y-1.5 list-disc pl-5 text-foreground/90">
                        {analise.motivosEliminacao.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </section>
                  ) : (
                    <section className="bg-card rounded-2xl border border-border shadow-panel p-6 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
                        Nota final DIRPS
                      </p>
                      <p className="text-7xl font-extrabold tabular-nums tracking-tight leading-none">
                        {analise.totalScore}
                        <span className="text-2xl font-semibold text-muted-foreground align-top ml-1">/{REDACAO_TOTAL}</span>
                      </p>
                      <div className="mt-5 h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pctLinhas}%` }}
                          transition={{ duration: 0.6, delay: 0.15 }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2 tabular-nums">
                        {analise.linhasEstimadas} linhas escritas
                      </p>
                    </section>
                  )}

                  {analise.alertas.length > 0 && !analise.eliminado && (
                    <section className="rounded-xl border border-status-draft/40 bg-status-draft/10 p-4 space-y-1.5">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <AlertTriangle className="h-4 w-4" /> Alertas da banca
                      </p>
                      {analise.alertas.map((a, i) => (
                        <p key={i} className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                      ))}
                    </section>
                  )}

                  {analise.prioridadeUnica && (
                    <section className="rounded-2xl bg-foreground text-background p-5 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">
                        Se melhorar uma coisa
                      </p>
                      <p className="text-sm leading-relaxed">{analise.prioridadeUnica}</p>
                    </section>
                  )}

                  {/* Critérios */}
                  <section className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                    <div className="px-5 py-3 border-b border-border/60">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Os 5 critérios
                      </p>
                    </div>
                    <div className="divide-y divide-border/60">
                      {analise.criterios.map((cr) => {
                        const max = maxCriterio(cr.id);
                        const aberto = criterioAberto === cr.id;
                        const pct = max ? (cr.pontos / max) * 100 : 0;
                        return (
                          <div key={cr.id}>
                            <button
                              className="w-full px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                              onClick={() => setCriterioAberto(aberto ? null : cr.id)}
                            >
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <span className="text-sm font-medium text-foreground">{nomeCriterio(cr.id)}</span>
                                <span className="flex items-center gap-2 shrink-0">
                                  <span className="text-sm font-bold tabular-nums">
                                    {cr.pontos}<span className="text-muted-foreground font-normal">/{max}</span>
                                  </span>
                                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", aberto && "rotate-180")} />
                                </span>
                              </div>
                              <div className="h-1 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  className="h-full bg-foreground rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                              {cr.faixa && (
                                <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{cr.faixa}</p>
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
                                  <div className="px-5 pb-4 space-y-3 text-sm">
                                    {cr.justificativa && (
                                      <p className="text-muted-foreground leading-relaxed">{cr.justificativa}</p>
                                    )}
                                    {cr.evidencias?.map((ev, i) => (
                                      <p key={i} className="border-l-2 border-foreground/30 pl-3 italic text-muted-foreground text-[13px] leading-relaxed">
                                        "{ev}"
                                      </p>
                                    ))}
                                    {cr.comoSubirUmaFaixa && (
                                      <div className="rounded-lg bg-muted p-3.5 space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                          Pra subir uma faixa
                                        </p>
                                        <p className="text-[13px] leading-relaxed text-foreground">
                                          {cr.comoSubirUmaFaixa}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                    {analise.desviosContados.length > 0 && (
                      <div className="px-5 py-4 border-t border-border/60 bg-muted/30">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Desvios contados ({analise.desviosContados.length})
                        </p>
                        <div className="space-y-1 text-[13px] text-muted-foreground leading-relaxed">
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

                  {!analise.eliminado && !evolucao && (
                    <Button
                      className="w-full rounded-xl h-12 font-semibold"
                      variant="outline"
                      onClick={gerarEvolucao}
                      disabled={evoluindo}
                    >
                      {evoluindo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      {evoluindo ? "Evoluindo sua redação..." : "Ver minha redação uma faixa acima"}
                    </Button>
                  )}
                  <GrupoWhatsappButton />
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
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

// ══════════════════════════════════════════════════════════════
// Paywall — 2ª correção em diante
// ══════════════════════════════════════════════════════════════
function PaywallCard({ userEmail }: { userEmail: string }) {
  const [loading, setLoading] = useState<null | "avulsa" | "pacote5">(null);

  useEffect(() => {
    trackUfu("calc_completed", { evento: "paywall_visto" });
  }, []);

  async function comprar(plano: "avulsa" | "pacote5") {
    trackUfu("calc_completed", { evento: "paywall_click", plano });
    setLoading(plano);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-ufu", {
        body: { plano },
      });
      if (error) throw new Error((await parseFnError(error))?.message ?? "Erro ao abrir checkout");
      if (!data?.url) throw new Error("Checkout não retornou URL");
      window.location.href = data.url as string;
    } catch (e) {
      toast({ title: "Não deu pra abrir o checkout", description: (e as Error).message, variant: "destructive" });
      setLoading(null);
    }
  }

  const whatsappMsg = `Oi! Paguei a correção do Placar UFU mas ainda não liberou — meu e-mail de cadastro é ${userEmail || "___"}.`;

  return (
    <div className="rounded-xl border-2 border-primary bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        <p className="text-sm font-bold">Correção completa nos 5 critérios da banca DIRPS</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avulsa</p>
          <p className="text-2xl font-extrabold tabular-nums">R$ 9,90</p>
          <p className="text-xs text-muted-foreground">1 correção completa</p>
          <Button
            className="w-full"
            disabled={loading !== null}
            onClick={() => comprar("avulsa")}
          >
            {loading === "avulsa" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comprar"}
          </Button>
        </div>
        <div className="rounded-lg border-2 border-primary p-4 space-y-2 relative">
          <span className="absolute -top-2 right-3 text-[10px] font-bold uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
            Melhor custo
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pacote 5</p>
          <p className="text-2xl font-extrabold tabular-nums">R$ 39</p>
          <p className="text-xs text-muted-foreground">R$ 7,80 cada · 5 correções</p>
          <Button
            className="w-full"
            disabled={loading !== null}
            onClick={() => comprar("pacote5")}
          >
            {loading === "pacote5" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comprar"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border-2 border-dashed border-primary/40 p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Passe UFU 2026 — Fundador</p>
        <p className="text-sm leading-relaxed">
          R$ 149 <span className="text-muted-foreground">·</span> correções ilimitadas + trilha + simulados até a prova.
        </p>
        <Button asChild variant="outline" className="w-full">
          <a href="/ufu/passe">Ver o Passe UFU</a>
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span>Pagamento seguro via Stripe (cartão) · Garantia incondicional de 7 dias · Crédito liberado automaticamente</span>
      </div>


      <div className="rounded-lg bg-muted p-3 space-y-2">
        <p className="text-[13px] leading-relaxed">
          <span className="font-semibold">Pagou e não liberou?</span> Fala comigo direto:
        </p>
        <a
          href={whatsappBrenoUrl(whatsappMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-medium text-foreground hover:underline"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Falar no WhatsApp
        </a>
      </div>

      <p className="text-[11px] text-center text-muted-foreground pt-1">
        Placar UFU · um produto Inteligência Atlas
      </p>
    </div>
  );
}

// Botão de convite ao grupo do WhatsApp — só renderiza se a URL estiver configurada.
function GrupoWhatsappButton() {
  const url = UFU_CONFIG.GRUPO_WHATSAPP_URL;
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      Entrar no grupo do Placar UFU no WhatsApp
    </a>
  );
}
