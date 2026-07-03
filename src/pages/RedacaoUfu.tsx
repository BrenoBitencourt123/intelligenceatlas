import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Sparkles, PenLine } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  GENEROS_UFU, PROPOSTAS_UFU, CRITERIOS_UFU, REDACAO_TOTAL,
  LINHAS_MIN, LINHAS_MAX, estimarLinhas,
} from "@/data/ufu/redacao";

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

  const genero = GENEROS_UFU.find((g) => g.id === genreId);
  const linhas = useMemo(() => estimarLinhas(text), [text]);
  const nomeCriterio = (id: string) => CRITERIOS_UFU.find((c) => c.id === id)?.nome ?? id;
  const maxCriterio = (id: string) => CRITERIOS_UFU.find((c) => c.id === id)?.max ?? 0;

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
      if (error) throw new Error((await parseFnError(error)) ?? "Erro na correção");
      if (data?.error) throw new Error(data.error);
      setAnalise(data as AnaliseUfu);

      // persiste (alimenta histórico e cota)
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
      if (error) throw new Error((await parseFnError(error)) ?? "Erro ao evoluir");
      if (data?.error) throw new Error(data.error);
      setEvolucao(data as VersaoEvoluida);
    } catch (e) {
      toast({ title: "Não deu pra gerar a versão evoluída", description: (e as Error).message, variant: "destructive" });
    } finally {
      setEvoluindo(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Redação · modelo oficial UFU (banca DIRPS)
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            Corrigida nos 5 critérios da banca — não no modelo ENEM
          </h1>
          <p className="text-sm text-muted-foreground">
            80 pontos, notas por faixa oficial, e o que mais reprova na UFU: checagem de risco de nota zero
            (fuga de gênero elimina).
          </p>
        </header>

        {/* Proposta / gênero / tema */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Treinar com proposta real (opcional)</label>
              <Select value={propostaId} onValueChange={aplicarProposta}>
                <SelectTrigger><SelectValue placeholder="Propostas que já caíram" /></SelectTrigger>
                <SelectContent>
                  {PROPOSTAS_UFU.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Gênero solicitado *</label>
                <Select value={genreId} onValueChange={setGenreId}>
                  <SelectTrigger><SelectValue placeholder="Obrigatório" /></SelectTrigger>
                  <SelectContent>
                    {GENEROS_UFU.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tema / recorte da proposta</label>
                <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ex.: desafios da adoção no Brasil" />
              </div>
            </div>
            {genero && (
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">O que a banca procura em "{genero.label}":</p>
                <p>{genero.elementos.join(" · ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Texto */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium">Sua redação</label>
              <span className={`text-xs tabular-nums ${linhas < LINHAS_MIN || linhas > LINHAS_MAX ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                ~{linhas} linhas na folha oficial ({LINHAS_MIN}–{LINHAS_MAX})
              </span>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Cole ou digite sua redação completa. A folha oficial tem 34 linhas — menos de 15 zera."
              className="min-h-[320px] text-sm leading-relaxed"
            />
            {linhas > 0 && linhas < LINHAS_MIN && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Risco de nota zero</AlertTitle>
                <AlertDescription>Menos de {LINHAS_MIN} linhas elimina o candidato. Continue escrevendo.</AlertDescription>
              </Alert>
            )}
            <Button className="w-full" size="lg" onClick={analisar} disabled={analisando || !text.trim()}>
              {analisando ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
              Corrigir na rubrica da UFU
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        {analise && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-5">
              {analise.eliminado ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>NOTA ZERO — eliminado do vestibular</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {analise.motivosEliminacao.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="text-center">
                  <p className="text-5xl font-extrabold tabular-nums">
                    {analise.totalScore}
                    <span className="text-xl font-medium text-muted-foreground">/{REDACAO_TOTAL}</span>
                  </p>
                </div>
              )}

              {analise.alertas.length > 0 && !analise.eliminado && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Alertas da banca</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {analise.alertas.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Accordion type="multiple" className="w-full">
                {analise.criterios.map((cr) => (
                  <AccordionItem key={cr.id} value={cr.id}>
                    <AccordionTrigger className="text-sm">
                      <span className="flex-1 text-left">{nomeCriterio(cr.id)}</span>
                      <span className="tabular-nums font-semibold mr-2">
                        {cr.pontos}/{maxCriterio(cr.id)}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      {cr.faixa && <p className="font-medium">{cr.faixa}</p>}
                      {cr.justificativa && <p className="text-muted-foreground">{cr.justificativa}</p>}
                      {cr.evidencias?.map((ev, i) => (
                        <p key={i} className="border-l-2 border-border pl-3 italic text-muted-foreground">"{ev}"</p>
                      ))}
                      {cr.comoSubirUmaFaixa && (
                        <p className="rounded-md bg-muted p-2">
                          <span className="font-semibold">Pra subir uma faixa: </span>{cr.comoSubirUmaFaixa}
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
                {analise.desviosContados.length > 0 && (
                  <AccordionItem value="desvios">
                    <AccordionTrigger className="text-sm">
                      Desvios de escrita contados ({analise.desviosContados.length})
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1 text-sm text-muted-foreground">
                      {analise.desviosContados.map((d, i) => <p key={i}>{d}</p>)}
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>

              {analise.feedbackGeral && (
                <p className="text-sm leading-relaxed">{analise.feedbackGeral}</p>
              )}
              {analise.prioridadeUnica && (
                <p className="rounded-lg bg-primary text-primary-foreground p-3 text-sm">
                  <span className="font-semibold">Se melhorar UMA coisa: </span>{analise.prioridadeUnica}
                </p>
              )}

              {!analise.eliminado && (
                <Button className="w-full" size="lg" variant="outline" onClick={gerarEvolucao} disabled={evoluindo}>
                  {evoluindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Ver minha redação uma faixa acima
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Versão evoluída */}
        {evolucao && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1">
                <h2 className="font-semibold">Sua redação, uma faixa acima</h2>
                <p className="text-xs text-muted-foreground">
                  Mesmas ideias, mesmo repertório — só o que destrava{" "}
                  {evolucao.criteriosAlvo.map((a) => nomeCriterio(a.id)).join(" e ")}.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {evolucao.improvedText}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">O que mudou (e por quê)</h3>
                {evolucao.mudancas.map((m, i) => (
                  <div key={i} className="rounded-lg bg-muted p-3 text-sm space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {nomeCriterio(m.criterioId)}
                    </p>
                    <p className="line-through decoration-destructive/60 text-muted-foreground">{m.antes}</p>
                    <p className="font-medium">{m.depois}</p>
                    <p className="text-xs text-muted-foreground">{m.porque}</p>
                  </div>
                ))}
              </div>
              {evolucao.oQueNaoMudei && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">De propósito, não mexi em: </span>{evolucao.oQueNaoMudei}
                </p>
              )}
              <Alert>
                <PenLine className="h-4 w-4" />
                <AlertTitle>Agora é sua vez (a prova é à caneta)</AlertTitle>
                <AlertDescription>{evolucao.tarefaReescrita}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

async function parseFnError(error: unknown): Promise<string | null> {
  // supabase.functions.invoke devolve FunctionsHttpError com Response no context
  try {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.json();
      return body?.error ?? null;
    }
  } catch { /* noop */ }
  return (error as Error)?.message ?? null;
}
