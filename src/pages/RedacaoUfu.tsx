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

  // ── Autosave do rascunho (perder 25 linhas digitadas no celular = churn) ──
  const DRAFT_KEY = "ufu_redacao_rascunho";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { text?: string; theme?: string; propostaId?: string; genreId?: string };
        if (draft.text && draft.text.trim().length > 40) {
          setText(draft.text);
          if (draft.theme) setTheme(draft.theme);
          if (draft.propostaId) setPropostaId(draft.propostaId);
          if (draft.genreId) setGenreId(draft.genreId);
          toast({ title: "Rascunho recuperado", description: "Continuamos de onde você parou." });
        }
      }
    } catch { /* rascunho corrompido: ignora */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        if (text.trim().length > 0) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, theme, propostaId, genreId }));
        }
      } catch { /* storage cheio: ignora */ }
    }, 800);
    return () => clearTimeout(id);
  }, [text, theme, propostaId, genreId]);

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
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
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

  // status pill dinâmico
  const statusPill = analise
    ? analise.eliminado
      ? { label: "Eliminado", tone: "danger" as const }
      : { label: "Corrigida", tone: "ok" as const }
    : text.trim().length === 0
      ? { label: "Em rascunho", tone: "neutral" as const }
      : linhasOk && !!genero
        ? { label: "Pronto pra corrigir", tone: "ok" as const }
        : { label: "Em rascunho", tone: "neutral" as const };

  return (
    <MainLayout>
      <main className="container mx-auto px-4 py-8 sm:py-10">
        <div className="max-w-2xl mx-auto">
          {/* ─── Quest header ─── */}
          <header className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-foreground text-background rounded-xl flex items-center justify-center font-extrabold text-base sm:text-lg shrink-0">
                UFU
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight uppercase leading-tight">
                  Missão Redação
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">
                  Rubrica oficial DIRPS · 80 pontos
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Status
              </span>
              <span
                className={cn(
                  "text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full border tabular-nums",
                  statusPill.tone === "ok" &&
                    "text-status-analyzed border-status-analyzed/40 bg-status-analyzed/10",
                  statusPill.tone === "danger" &&
                    "text-destructive border-destructive/40 bg-destructive/10",
                  statusPill.tone === "neutral" &&
                    "text-foreground border-border bg-muted",
                )}
              >
                {statusPill.label}
                {saldo !== null && !analise && (
                  <span className="text-muted-foreground font-medium ml-2">
                    · {saldo} {saldo === 1 ? "correção" : "correções"}
                  </span>
                )}
              </span>
            </div>
          </header>

          {/* ─── Quest card: só na fase de escrita ─── */}
          {!analise && (
            <div className="bg-card border-2 border-border rounded-3xl p-5 sm:p-8 shadow-[0_8px_0_0_hsl(var(--border))]">
              {/* Step 1 — Gênero (obrigatório) */}
              <div className="mb-8 sm:mb-10">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <h2 className="font-extrabold text-foreground uppercase text-sm tracking-wide">
                    Escolha o gênero
                  </h2>
                  <span className="ml-auto text-[10px] font-black text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20 uppercase tracking-wider">
                    Obrigatório
                  </span>
                </div>
                <Select value={genreId} onValueChange={setGenreId}>
                  <SelectTrigger
                    className={cn(
                      "rounded-2xl h-12 border-2 font-bold text-[15px] shadow-[0_4px_0_0_hsl(var(--border))]",
                      genreId ? "border-foreground" : "border-border",
                    )}
                  >
                    <SelectValue placeholder="Selecionar gênero (fugir dele zera)" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENEROS_UFU.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {genero && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {genero.elementos.map((el, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-semibold px-2 py-1 rounded-md bg-muted border border-border text-foreground"
                          >
                            {el}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Step 2 — Tema (proposta opcional embutida) */}
              <div className="mb-8 sm:mb-10 p-4 sm:p-5 bg-muted/40 rounded-2xl border-2 border-dashed border-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <h2 className="font-extrabold text-muted-foreground uppercase text-sm tracking-wide">
                    Tema da proposta
                  </h2>
                  <span className="ml-auto text-[10px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:inline">
                    Opcional
                  </span>
                </div>
                <Input
                  className="rounded-xl h-11 border-border bg-background font-medium"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex.: desafios da adoção no Brasil"
                />
                <div className="mt-3">
                  <Select value={propostaId} onValueChange={aplicarProposta}>
                    <SelectTrigger className="rounded-xl h-10 text-[13px] border-border bg-background/60">
                      <SelectValue placeholder="Ou usar uma proposta real da UFU que já caiu" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPOSTAS_UFU.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Step 3 — Sua produção */}
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <h2 className="font-extrabold text-foreground uppercase text-sm tracking-wide">
                    Sua produção
                  </h2>
                  <span className="ml-auto text-[11px] tabular-nums font-bold text-muted-foreground">
                    linha <span className="text-foreground">{Math.max(1, linhas || 1)}</span>
                  </span>
                </div>

                <div
                  className={cn(
                    "relative flex bg-background border-2 rounded-2xl overflow-hidden transition-colors",
                    linhas > 0 && !linhasOk
                      ? "border-destructive/40 focus-within:border-destructive"
                      : linhasOk
                        ? "border-status-analyzed/40 focus-within:border-status-analyzed"
                        : "border-border focus-within:border-foreground",
                  )}
                >
                  {/* Régua de linhas */}
                  <div
                    aria-hidden
                    className="w-9 shrink-0 bg-muted/40 border-r border-border/60 flex flex-col items-center pt-3 pb-3 text-[10px] font-mono text-muted-foreground/70 select-none gap-[0.35rem]"
                  >
                    {Array.from({ length: LINHAS_MAX }).map((_, i) => {
                      const n = i + 1;
                      const atual = linhas >= n;
                      const marco = n === LINHAS_MIN || n === LINHAS_MAX;
                      return (
                        <span
                          key={n}
                          className={cn(
                            "tabular-nums leading-[1.15rem]",
                            atual && "text-foreground font-bold",
                            marco && "text-foreground",
                          )}
                        >
                          {n.toString().padStart(2, "0")}
                        </span>
                      );
                    })}
                  </div>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Inicie sua escrita aqui..."
                    className="flex-1 p-4 sm:p-5 min-h-[360px] outline-none text-foreground leading-[1.15rem] font-serif text-[15px] placeholder:font-sans placeholder:text-muted-foreground/60 resize-y border-0 rounded-none focus-visible:ring-0 bg-transparent"
                  />
                </div>

                {/* Barra gordo de progresso — XP bar B&W */}
                <div className="mt-6 sm:mt-7">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                        Progresso de linhas
                      </span>
                      <span className="text-2xl font-black text-foreground tracking-tight tabular-nums">
                        {linhas}{" "}
                        <span className="text-muted-foreground/40">
                          / {LINHAS_MAX}
                        </span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        Mínimo
                      </span>
                      <span className="block font-bold text-muted-foreground text-sm tabular-nums">
                        {LINHAS_MIN} linhas
                      </span>
                    </div>
                  </div>
                  <div className="h-5 w-full bg-muted rounded-full border-2 border-border relative overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full relative",
                        linhas === 0 && "bg-muted",
                        linhas > 0 && linhas < LINHAS_MIN && "bg-foreground/70",
                        linhasOk && "bg-status-analyzed",
                      )}
                      initial={false}
                      animate={{ width: `${Math.min(100, linhasPct)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-background/10" />
                    </motion.div>
                    {/* Marco do mínimo (30 linhas) */}
                    <div
                      className="absolute top-0 w-1 h-full bg-destructive/30 border-x border-destructive/20"
                      style={{ left: `${(LINHAS_MIN / LINHAS_MAX) * 100}%` }}
                      aria-label={`Marco mínimo ${LINHAS_MIN} linhas`}
                    />
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t-2 border-border/60">
                  {semCreditos ? (
                    <PaywallCard userEmail={user?.email ?? ""} />
                  ) : (
                    <button
                      type="button"
                      onClick={analisar}
                      disabled={analisando || !text.trim() || !genero}
                      className="w-full group relative disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="absolute inset-0 bg-foreground rounded-2xl translate-y-1.5 transition-transform group-enabled:group-hover:translate-y-2 group-active:translate-y-0" />
                      <span className="relative flex items-center justify-center gap-3 w-full bg-foreground text-background font-extrabold text-base sm:text-lg py-4 sm:py-5 rounded-2xl border-2 border-foreground transition-transform group-active:translate-y-1.5 uppercase tracking-wide">
                        {analisando ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Corrigindo como a banca…
                          </>
                        ) : (
                          <>
                            <PenLine className="h-5 w-5" />
                            Corrigir redação
                          </>
                        )}
                      </span>
                    </button>
                  )}
                  {!semCreditos && (
                    <p className="text-center mt-5 sm:mt-6 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {genero ? "Gênero configurado" : "Selecione o gênero"} ·
                      Mínimo de {LINHAS_MIN} linhas · Correção em ~30s
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ Resultado da correção ═══ */}
          <AnimatePresence>
            {analise && (
              <motion.div
                key="resultado"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-5"
              >
                {analise.eliminado ? (
                  <section className="rounded-2xl border-2 border-destructive bg-destructive/5 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-destructive font-bold">
                      <ShieldAlert className="h-5 w-5" />
                      NOTA ZERO — eliminado
                    </div>
                    <ul className="text-sm space-y-1.5 list-disc pl-5 text-foreground/90">
                      {analise.motivosEliminacao.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  <section className="bg-card rounded-2xl border-2 border-border shadow-[0_8px_0_0_hsl(var(--border))] p-6 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
                      Nota final DIRPS
                    </p>
                    <p className="text-7xl font-extrabold tabular-nums tracking-tight leading-none">
                      {analise.totalScore}
                      <span className="text-2xl font-semibold text-muted-foreground align-top ml-1">
                        /{REDACAO_TOTAL}
                      </span>
                    </p>
                    <div className="mt-5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-foreground rounded-full"
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
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {a}
                      </p>
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
                              <span className="text-sm font-medium text-foreground">
                                {nomeCriterio(cr.id)}
                              </span>
                              <span className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-bold tabular-nums">
                                  {cr.pontos}
                                  <span className="text-muted-foreground font-normal">/{max}</span>
                                </span>
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform",
                                    aberto && "rotate-180",
                                  )}
                                />
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
                              <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                {cr.faixa}
                              </p>
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
                                    <p className="text-muted-foreground leading-relaxed">
                                      {cr.justificativa}
                                    </p>
                                  )}
                                  {cr.evidencias?.map((ev, i) => (
                                    <p
                                      key={i}
                                      className="border-l-2 border-foreground/30 pl-3 italic text-muted-foreground text-[13px] leading-relaxed"
                                    >
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
                        {analise.desviosContados.map((d, i) => (
                          <p key={i}>{d}</p>
                        ))}
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
                    {evoluindo ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {evoluindo
                      ? "Evoluindo sua redação..."
                      : "Ver minha redação uma faixa acima"}
                  </Button>
                )}
                <GrupoWhatsappButton />
              </motion.div>
            )}
          </AnimatePresence>
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
                    <h2 className="font-bold">Sua redação, no melhor que ela pode ser</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mesmas ideias, mesmo repertório, seu raciocínio — o texto completo
                      elevado nos critérios da banca
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
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Passe UFU 2027 — Fundador</p>
        <p className="text-sm leading-relaxed">
          R$ 149 <span className="text-muted-foreground">·</span> correções ilimitadas + trilha + simulados até a prova.
        </p>
        <Button asChild variant="outline" className="w-full">
          <a href="/ufu/passe">Ver o Passe UFU</a>
        </Button>
      </div>

      {UFU_CONFIG.PIX_LINK_AVULSA && (
        <div className="rounded-lg border border-border p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Prefere Pix?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href={UFU_CONFIG.PIX_LINK_AVULSA}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackUfu("calc_completed", { evento: "paywall_pix_click", plano: "avulsa" })}
              >
                Avulsa R$ 9,90 no Pix
              </a>
            </Button>
            {UFU_CONFIG.PIX_LINK_PACOTE5 && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={UFU_CONFIG.PIX_LINK_PACOTE5}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackUfu("calc_completed", { evento: "paywall_pix_click", plano: "pacote5" })}
                >
                  Pacote 5 R$ 39 no Pix
                </a>
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Pagamento via Mercado Pago · crédito liberado em até 1h no horário
            comercial — te confirmo no WhatsApp.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span>Pagamento seguro · Garantia incondicional de 7 dias · Cartão libera na hora</span>
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
