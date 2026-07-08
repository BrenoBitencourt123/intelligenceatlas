import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackUfu } from "@/lib/ufu/track";
import { PlacarShareCard } from "@/components/ufu/PlacarShareCard";

// Diagnóstico "seu placar" — 10 questões UFU, anônimo.
// Fluxo: intro → 10 perguntas (localStorage) → captura e-mail/whatsapp → resultado + share card + CTA corretor.
// Fonte das questões: public.ufu_diagnostico_questoes (curadas via admin).

type Area = "humanas" | "natureza" | "linguagens" | "matematica";

interface Questao {
  id: string;
  area: Area;
  statement: string;
  alternativas: { letra: string; texto: string }[];
  correta: string;
  gabarito_comentado: string | null;
}

const AREA_LABEL: Record<Area, string> = {
  humanas: "Humanas",
  natureza: "Natureza",
  linguagens: "Linguagens",
  matematica: "Matemática",
};

const STORAGE_KEY = "ufu_diagnostico_progresso_v1";

interface Progresso {
  respostas: Record<string, string>;
  step: number;
}

function carregarProgresso(): Progresso {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return { respostas: {}, step: 0 };
}

function salvarProgresso(p: Progresso) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* noop */ }
}

function limparProgresso() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

export default function DiagnosticoUfu() {
  const [ativo, setAtivo] = useState<boolean | null>(null);
  const [questoes, setQuestoes] = useState<Questao[] | null>(null);
  const [progresso, setProgresso] = useState<Progresso>(() => carregarProgresso());
  const [fase, setFase] = useState<"intro" | "quiz" | "captura" | "resultado">(
    () => (carregarProgresso().step > 0 ? "quiz" : "intro"),
  );
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [enviandoLead, setEnviandoLead] = useState(false);

  // Carrega config + questões
  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cfg } = await (supabase as any)
        .from("ufu_config")
        .select("value")
        .eq("key", "diagnostico_ativo")
        .maybeSingle();
      const on = cfg?.value === true || cfg?.value === "true";
      setAtivo(on);
      if (!on) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("ufu_diagnostico_questoes")
        .select("id, area, statement, alternativas, correta, gabarito_comentado")
        .eq("ativo", true)
        .limit(30);
      if (error || !Array.isArray(data)) return;
      // Shuffle e pega até 10 balanceadas por área quando possível.
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const escolhidas: Questao[] = [];
      const porArea: Record<Area, number> = { humanas: 0, natureza: 0, linguagens: 0, matematica: 0 };
      for (const q of shuffled) {
        if (escolhidas.length >= 10) break;
        if (porArea[q.area as Area] >= 3) continue;
        escolhidas.push(q as Questao);
        porArea[q.area as Area]++;
      }
      // completa se faltar
      for (const q of shuffled) {
        if (escolhidas.length >= 10) break;
        if (!escolhidas.find((e) => e.id === q.id)) escolhidas.push(q as Questao);
      }
      setQuestoes(escolhidas);
    })();
  }, []);

  const q = questoes && progresso.step < questoes.length ? questoes[progresso.step] : null;

  function responder(letra: string) {
    if (!q) return;
    const respostas = { ...progresso.respostas, [q.id]: letra };
    const step = progresso.step + 1;
    const novo = { respostas, step };
    setProgresso(novo);
    salvarProgresso(novo);
    if (questoes && step >= questoes.length) setFase("captura");
  }

  const resultado = useMemo(() => {
    if (!questoes) return null;
    const acertos: Record<Area, { acertou: number; total: number }> = {
      humanas: { acertou: 0, total: 0 },
      natureza: { acertou: 0, total: 0 },
      linguagens: { acertou: 0, total: 0 },
      matematica: { acertou: 0, total: 0 },
    };
    for (const item of questoes) {
      acertos[item.area].total++;
      if (progresso.respostas[item.id] === item.correta) acertos[item.area].acertou++;
    }
    const totalAcertos = Object.values(acertos).reduce((s, a) => s + a.acertou, 0);
    // Nota estimada UFU (0-100) — regra simples proporcional
    const notaEstimada = questoes.length > 0 ? Math.round((totalAcertos / questoes.length) * 100) : 0;
    // Área mais fraca
    let fraca: Area = "humanas";
    let piorPct = 2;
    for (const area of Object.keys(acertos) as Area[]) {
      const a = acertos[area];
      if (a.total === 0) continue;
      const pct = a.acertou / a.total;
      if (pct < piorPct) { piorPct = pct; fraca = area; }
    }
    return { acertos, totalAcertos, notaEstimada, fraca };
  }, [questoes, progresso.respostas]);

  async function enviarCaptura(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !resultado) return;
    setEnviandoLead(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("ufu_leads").upsert(
        {
          email: email.trim().toLowerCase(),
          whatsapp: whatsapp.trim() || null,
          origem: "diagnostico",
        },
        { onConflict: "email" },
      );
      if (error && (error as { code?: string }).code !== "23505") throw new Error(error.message);
      trackUfu("calc_completed", {
        evento: "diagnostico_capturado",
        nota: resultado.notaEstimada,
        area_fraca: resultado.fraca,
      });
      setFase("resultado");
    } catch (err) {
      toast({ title: "Não deu pra salvar", description: (err as Error).message, variant: "destructive" });
    } finally {
      setEnviandoLead(false);
    }
  }

  function reiniciar() {
    limparProgresso();
    setProgresso({ respostas: {}, step: 0 });
    setFase("intro");
  }

  // ─── Renderização ───
  if (ativo === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!ativo || (questoes && questoes.length < 10)) {
    return (
      <Shell>
        <section className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Diagnóstico está em curadoria</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Estamos selecionando 10 questões UFU dos últimos vestibulares.
            Entra na lista pra ser avisado quando abrir.
          </p>
          <Button asChild className="rounded-xl mt-2">
            <Link to="/ufu/lista">Entrar na lista</Link>
          </Button>
        </section>
      </Shell>
    );
  }

  if (fase === "intro") {
    return (
      <Shell>
        <section className="space-y-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-primary/10 text-primary rounded-full">
            <Target className="h-3 w-3" /> Grátis · 8 minutos
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Seu placar UFU: descubra sua zona antes da prova.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            10 questões reais do vestibular UFU. No final você vê sua nota estimada,
            área mais fraca e um plano curto pra subir.
          </p>
          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            {[
              "Questões reais UFU",
              "Nota estimada 0–100",
              "Plano por área",
            ].map((b) => (
              <div key={b} className="rounded-xl border border-border p-4 text-sm flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />{b}
              </div>
            ))}
          </div>
          <Button
            size="lg"
            className="rounded-xl h-14 text-base px-8"
            onClick={() => {
              trackUfu("calc_completed", { evento: "diagnostico_start" });
              setFase("quiz");
            }}
          >
            Começar diagnóstico <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      </Shell>
    );
  }

  if (fase === "quiz" && q && questoes) {
    const pct = (progresso.step / questoes.length) * 100;
    return (
      <Shell>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5 tabular-nums">
              <span>Pergunta {progresso.step + 1} de {questoes.length}</span>
              <span>{AREA_LABEL[q.area]}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{q.statement}</p>
            <div className="grid gap-2">
              {q.alternativas.map((alt) => (
                <button
                  key={alt.letra}
                  onClick={() => responder(alt.letra)}
                  className="text-left rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors p-4 flex gap-3"
                >
                  <span className="font-bold text-primary shrink-0 w-6">{alt.letra})</span>
                  <span className="text-sm leading-relaxed">{alt.texto}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (fase === "captura" && resultado) {
    return (
      <Shell>
        <section className="space-y-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-primary/10 text-primary rounded-full">
            <Sparkles className="h-3 w-3" /> Diagnóstico pronto
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold">
            Onde a gente manda seu resultado?
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            E-mail e WhatsApp pra receber sua zona, o gabarito comentado das 10
            e o plano pra {AREA_LABEL[resultado.fraca].toLowerCase()}.
          </p>
          <form onSubmit={enviarCaptura} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa">WhatsApp (com DDD)</Label>
              <Input
                id="wa" type="tel"
                value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(34) 9 9999-9999"
                className="rounded-lg"
              />
            </div>
            <Button type="submit" size="lg" className="rounded-xl w-full h-12" disabled={enviandoLead}>
              {enviandoLead ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Ver meu placar <ArrowRight className="h-4 w-4" /></>}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Sem spam. Um e-mail por semana com o dado da semana.
            </p>
          </form>
        </section>
      </Shell>
    );
  }

  if (fase === "resultado" && resultado && questoes) {
    const zona = resultado.notaEstimada >= 70 ? "verde" : resultado.notaEstimada >= 50 ? "amarela" : "vermelha";
    return (
      <Shell>
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Seu placar UFU</p>
            <p className="text-7xl font-extrabold tabular-nums">{resultado.notaEstimada}<span className="text-2xl text-muted-foreground">/100</span></p>
            <p className={`text-sm font-semibold ${
              zona === "verde" ? "text-status-analyzed" :
              zona === "amarela" ? "text-status-draft" : "text-destructive"
            }`}>
              Zona {zona}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(resultado.acertos) as Area[]).map((area) => {
              const a = resultado.acertos[area];
              if (a.total === 0) return null;
              const pct = Math.round((a.acertou / a.total) * 100);
              return (
                <div key={area} className="rounded-xl border border-border p-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{AREA_LABEL[area]}</span>
                    <span className="tabular-nums text-muted-foreground">{a.acertou}/{a.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${pct >= 70 ? "bg-status-analyzed" : pct >= 50 ? "bg-status-draft" : "bg-destructive"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <PlacarShareCard nota={resultado.notaEstimada} areaFraca={AREA_LABEL[resultado.fraca]} />

          <div className="rounded-2xl border-2 border-primary bg-primary/5 p-6 space-y-3 text-center">
            <h2 className="text-xl font-bold">Próximo passo: subir de zona.</h2>
            <p className="text-sm text-muted-foreground">
              Cria a conta e ganha sua <strong className="text-foreground">1ª correção de redação grátis</strong> no corretor DIRPS.
            </p>
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/cadastro?next=/redacao-ufu">
                Começar pelo corretor <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Gabarito comentado */}
          <details className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer text-sm font-semibold">Ver gabarito comentado das 10</summary>
            <div className="mt-4 space-y-4">
              {questoes.map((qq, i) => {
                const marcada = progresso.respostas[qq.id];
                const certa = marcada === qq.correta;
                return (
                  <div key={qq.id} className="text-sm space-y-1 pb-4 border-b border-border last:border-0">
                    <p className="font-semibold">{i + 1}. {AREA_LABEL[qq.area]} · gabarito: <span className="text-primary">{qq.correta}</span></p>
                    <p className="text-muted-foreground text-xs">Sua resposta: {marcada ?? "—"} {certa ? "✓" : "✗"}</p>
                    {qq.gabarito_comentado && (
                      <p className="text-sm leading-relaxed pt-1">{qq.gabarito_comentado}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </details>

          <div className="text-center">
            <button onClick={reiniciar} className="text-xs text-muted-foreground hover:underline">
              Refazer o diagnóstico
            </button>
          </div>
        </section>
      </Shell>
    );
  }

  return <Shell><Loader2 className="h-6 w-6 animate-spin mx-auto mt-20" /></Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/calculadora-ufu" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Placar UFU
          </Link>
          <span className="text-xs font-medium text-muted-foreground">Diagnóstico</span>
        </div>
      </header>
      <main className="container max-w-3xl mx-auto px-4 py-10">{children}</main>
    </div>
  );
}
