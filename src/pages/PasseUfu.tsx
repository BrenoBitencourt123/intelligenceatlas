import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Check, Loader2, Lock, ShieldCheck, Sparkles, PenLine,
  Target, MessageCircle, Clock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { whatsappBrenoUrl } from "@/lib/ufu/config";
import { trackUfu } from "@/lib/ufu/track";

// Landing do Passe UFU 2027 — Fundador.
// Rotas: /ufu/passe (canônica) e /passe (atalho).
// Fluxo de compra: create-checkout-ufu com { plano: "passe" }, sucesso volta
// aqui com ?pago=cs_... e verify-checkout-ufu grava profile.ufu_passe_ativo.
export default function PasseUfu() {
  const { user } = useAuth();
  const [disponivel, setDisponivel] = useState<boolean | null>(null);
  const [dataProva, setDataProva] = useState<string>("2027-06-30");
  const [totalLeads, setTotalLeads] = useState<number | null>(null);
  const [passeAtivo, setPasseAtivo] = useState(false);
  const [expira, setExpira] = useState<string | null>(null);
  const [comprando, setComprando] = useState(false);
  const [comprandoAvulsa, setComprandoAvulsa] = useState<null | "avulsa" | "pacote5">(null);

  // Config: passe_disponivel + data_prova_ufu
  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("ufu_config")
        .select("key, value")
        .in("key", ["passe_disponivel", "data_prova_ufu"]);
      if (Array.isArray(data)) {
        for (const row of data) {
          if (row.key === "passe_disponivel") setDisponivel(row.value === true || row.value === "true");
          if (row.key === "data_prova_ufu") {
            const raw = typeof row.value === "string" ? row.value : String(row.value);
            setDataProva(raw.replace(/^"|"$/g, ""));
          }
        }
      } else {
        setDisponivel(false);
      }
    })();
  }, []);

  // Prova social: contador de leads
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc("ufu_leads_count").then(({ data }: { data: number | null }) => {
      if (typeof data === "number") setTotalLeads(data);
    });
  }, []);

  // Passe já ativo?
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select("ufu_passe_ativo, ufu_passe_expira_em" as any)
        .eq("id", user.id)
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = data as any;
      if (p?.ufu_passe_ativo) {
        setPasseAtivo(true);
        setExpira(p.ufu_passe_expira_em ?? null);
      }
    })();
  }, [user?.id]);

  // Retorno do Stripe
  useEffect(() => {
    if (!user) return;
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("pago");
    const cancelado = url.searchParams.get("cancelado");
    if (cancelado) {
      toast({ title: "Compra cancelada", description: "Nenhuma cobrança foi feita." });
      url.searchParams.delete("cancelado");
      window.history.replaceState({}, "", url.pathname);
      return;
    }
    if (!sessionId?.startsWith("cs_")) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-checkout-ufu", {
          body: { session_id: sessionId },
        });
        if (error) throw new Error(error.message);
        if (data?.creditado && data?.tipo === "passe") {
          setPasseAtivo(true);
          setExpira(data.expira ?? null);
          toast({
            title: "Passe UFU liberado ✓",
            description: "Acesso ilimitado ao corretor + trilha da folga até a prova.",
          });
        }
      } catch (e) {
        toast({ title: "Não deu pra confirmar", description: (e as Error).message, variant: "destructive" });
      } finally {
        url.searchParams.delete("pago");
        window.history.replaceState({}, "", url.pathname);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function comprarPasse() {
    if (!user) {
      window.location.href = `/cadastro?next=${encodeURIComponent("/ufu/passe")}`;
      return;
    }
    trackUfu("calc_completed", { evento: "passe_click" });
    setComprando(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-ufu", {
        body: { plano: "passe" },
      });
      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error("Checkout não retornou URL");
      window.location.href = data.url as string;
    } catch (e) {
      toast({ title: "Não deu pra abrir o checkout", description: (e as Error).message, variant: "destructive" });
      setComprando(false);
    }
  }

  async function comprarAvulsa(plano: "avulsa" | "pacote5") {
    if (!user) {
      window.location.href = `/cadastro?next=${encodeURIComponent("/ufu/passe")}`;
      return;
    }
    trackUfu("calc_completed", { evento: "paywall_click", plano });
    setComprandoAvulsa(plano);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-ufu", {
        body: { plano },
      });
      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error("Checkout não retornou URL");
      window.location.href = data.url as string;
    } catch (e) {
      toast({ title: "Não deu pra abrir o checkout", description: (e as Error).message, variant: "destructive" });
      setComprandoAvulsa(null);
    }
  }

  const dataFormatada = (() => {
    try {
      return new Date(dataProva + "T00:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric",
      });
    } catch { return dataProva; }
  })();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/calculadora-ufu" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Placar UFU
          </Link>
          <span className="text-xs font-medium text-muted-foreground">Inteligência Atlas</span>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* HERO */}
        <section className="space-y-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-primary/10 text-primary rounded-full">
            <Sparkles className="h-3 w-3" /> Lote fundador
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Passe UFU 2027 — tudo pra prova em um só acesso.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Corretor de redação <strong className="text-foreground">ilimitado</strong>,
            trilha da folga com simulados UFU e priorização dos temas que caem no {dataFormatada}.
            Pagamento único. Sem mensalidade.
          </p>
        </section>

        {/* CARD DE COMPRA / STATUS */}
        {passeAtivo ? (
          <section className="rounded-2xl border-2 border-primary bg-primary/5 p-8 text-center space-y-3">
            <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
            <h2 className="text-2xl font-extrabold">Seu Passe UFU está ativo</h2>
            <p className="text-sm text-muted-foreground">
              {expira
                ? `Acesso liberado até ${new Date(expira + "T00:00:00").toLocaleDateString("pt-BR")}.`
                : "Acesso liberado até a data da prova."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/redacao-ufu"><PenLine className="h-4 w-4" /> Ir pro corretor</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/ufu/trilha"><Target className="h-4 w-4" /> Trilha da folga</Link>
              </Button>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border-2 border-border bg-card p-8 shadow-panel space-y-6">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-extrabold tabular-nums">R$ 149</span>
              <span className="text-sm text-muted-foreground line-through">R$ 249 após pré-venda</span>
            </div>

            <ul className="space-y-2.5 text-[15px]">
              {[
                "Corretor de redação DIRPS ilimitado até a prova",
                "Trilha da folga: simulados UFU cronometrados",
                "Gabarito comentado no espelho da banca",
                "Priorização automática dos seus critérios mais frágeis",
                "Acesso até o dia da prova do vestibular UFU 2027",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {disponivel === false ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center space-y-3">
                <p className="text-sm flex items-center justify-center gap-2 font-semibold">
                  <Clock className="h-4 w-4" /> Abre em breve
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O Passe abre para os primeiros da lista do Placar UFU.
                  {totalLeads !== null && ` Já são ${totalLeads} inscritos.`}
                </p>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/ufu/lista">Entrar na lista pra ser avisado</Link>
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full rounded-xl h-14 text-base"
                onClick={comprarPasse}
                disabled={comprando || disponivel === null}
              >
                {comprando
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <><Lock className="h-4 w-4" /> Garantir meu Passe por R$ 149</>}
              </Button>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Pagamento seguro via Stripe · Garantia incondicional de 7 dias · Liberação automática</span>
            </div>
          </section>
        )}

        {/* SEM COMPROMISSO — compras avulsas */}
        {!passeAtivo && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Ou compre só uma correção
              </p>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avulsa</p>
                  <p className="text-3xl font-extrabold tabular-nums mt-1">R$ 9,90</p>
                  <p className="text-xs text-muted-foreground mt-0.5">1 correção completa DIRPS</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={() => comprarAvulsa("avulsa")}
                  disabled={comprandoAvulsa !== null}
                >
                  {comprandoAvulsa === "avulsa" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comprar avulsa"}
                </Button>
              </div>

              <div className="rounded-xl border-2 border-primary/60 bg-card p-5 space-y-3 relative">
                <span className="absolute -top-2 right-3 text-[10px] font-bold uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Melhor custo
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pacote 5</p>
                  <p className="text-3xl font-extrabold tabular-nums mt-1">R$ 39</p>
                  <p className="text-xs text-muted-foreground mt-0.5">R$ 7,80 por correção · 5 no total</p>
                </div>
                <Button
                  className="w-full rounded-lg"
                  onClick={() => comprarAvulsa("pacote5")}
                  disabled={comprandoAvulsa !== null}
                >
                  {comprandoAvulsa === "pacote5" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comprar pacote"}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              O Passe compensa a partir da 15ª correção e libera trilha + simulados até a prova.
            </p>
          </section>
        )}



        {/* PROVA SOCIAL */}
        {totalLeads !== null && totalLeads > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            <strong className="text-foreground">{totalLeads}</strong> candidatos já estão no Placar UFU.
          </p>
        )}

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold">Perguntas honestas</h2>
          {[
            {
              q: "Qual a diferença pra comprar correção avulsa?",
              a: "Avulsa é R$ 9,90 por texto — bom pra testar. O Passe compensa a partir da 15ª correção e ainda libera a trilha e os simulados até a prova.",
            },
            {
              q: "É assinatura?",
              a: "Não. Pagamento único, acesso até o dia da prova UFU 2027. Nada renova.",
            },
            {
              q: "E se eu não gostar?",
              a: "7 dias, devolução incondicional. Manda mensagem no WhatsApp que estorno na hora.",
            },
            {
              q: "Vale se eu já passei da fase 1?",
              a: "Vale mais ainda. O corretor DIRPS e a trilha são calibrados pra reta final.",
            },
          ].map((it) => (
            <div key={it.q} className="border-b border-border pb-4">
              <p className="font-semibold">{it.q}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{it.a}</p>
            </div>
          ))}
        </section>

        <div className="rounded-xl bg-muted p-4 flex items-center gap-3">
          <MessageCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="text-sm">
            <p className="font-semibold">Dúvida antes de comprar?</p>
            <a
              href={whatsappBrenoUrl("Oi Breno, quero perguntar sobre o Passe UFU 2027.")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:underline"
            >
              Fala comigo no WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
