import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, Share2, Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  CURSOS_UFU, DISCIPLINAS_UFU, COTAS, TOTAL_QUESTOES, EDICAO, type CotaId,
} from "@/data/ufu/vestibular";
import { calcularResultado, type AcertosPorDisciplina } from "@/lib/ufu/score";
import { gerarCardPng } from "@/lib/ufu/cardImage";
import { trackUfu } from "@/lib/ufu/track";

// Calculadora pública do Vestibular UFU — 100% grátis, sem cadastro.
// Funil do produto: resultado → card compartilhável (share instrumentado).

const zerarAcertos = (): AcertosPorDisciplina =>
  Object.fromEntries(DISCIPLINAS_UFU.map((d) => [d.id, 0]));

export default function CalculadoraUfu() {
  const [cursoId, setCursoId] = useState<string>("");
  const [cota, setCota] = useState<CotaId>("AC");
  const [acertos, setAcertos] = useState<AcertosPorDisciplina>(zerarAcertos);
  const [mostrouResultado, setMostrouResultado] = useState(false);
  const [gerando, setGerando] = useState(false);

  const cursosPorCampus = useMemo(() => {
    const map = new Map<string, typeof CURSOS_UFU>();
    for (const cu of CURSOS_UFU) {
      const key = `${cu.campus} — ${cu.cidade}`;
      map.set(key, [...(map.get(key) ?? []), cu]);
    }
    return map;
  }, []);

  const curso = CURSOS_UFU.find((cu) => cu.id === cursoId);
  const cotasDisponiveis = useMemo(
    () => COTAS.filter((ct) => curso && curso.cortes[ct.id] !== undefined),
    [curso],
  );

  const resultado = useMemo(
    () => (cursoId ? calcularResultado(cursoId, cota, acertos) : null),
    [cursoId, cota, acertos],
  );

  const totalPreenchido = DISCIPLINAS_UFU.reduce((s, d) => s + (acertos[d.id] ?? 0), 0);

  function setAcerto(id: string, max: number, delta: number) {
    setAcertos((prev) => ({
      ...prev,
      [id]: Math.min(max, Math.max(0, (prev[id] ?? 0) + delta)),
    }));
  }

  function verResultado() {
    if (!resultado) return;
    setMostrouResultado(true);
    trackUfu("calc_completed", {
      curso: resultado.curso.id,
      cota,
      acertos: resultado.totalAcertos,
      status: resultado.status,
    });
  }

  async function compartilhar() {
    if (!resultado) return;
    setGerando(true);
    try {
      const blob = await gerarCardPng(resultado);
      trackUfu("card_generated", { curso: resultado.curso.id });
      const file = new File([blob], "meu-placar-ufu.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Meu placar no Vestibular UFU ${EDICAO}`,
        });
        trackUfu("card_shared", { curso: resultado.curso.id });
      } else {
        baixarBlob(blob);
        trackUfu("card_downloaded", { curso: resultado.curso.id });
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") {
        toast({ title: "Não deu pra gerar o card", description: "Tenta de novo?", variant: "destructive" });
      }
    } finally {
      setGerando(false);
    }
  }

  async function baixar() {
    if (!resultado) return;
    setGerando(true);
    try {
      const blob = await gerarCardPng(resultado);
      trackUfu("card_generated", { curso: resultado.curso.id });
      baixarBlob(blob);
      trackUfu("card_downloaded", { curso: resultado.curso.id });
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold tracking-tight">Placar UFU</span>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {EDICAO} · grátis
            </p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Quantos acertos te colocam na 2ª fase da UFU?
          </h1>
          <p className="text-sm text-muted-foreground">
            Compare seus acertos com a nota de corte oficial da DIRPS, curso a curso, cota a cota.
          </p>
        </header>

        {/* curso + cota */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Curso</label>
              <Select value={cursoId} onValueChange={(v) => { setCursoId(v); setCota("AC"); setMostrouResultado(false); }}>
                <SelectTrigger><SelectValue placeholder="Escolha seu curso" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {[...cursosPorCampus.entries()].map(([campus, cursos]) => (
                    <SelectGroup key={campus}>
                      <SelectLabel>{campus}</SelectLabel>
                      {cursos.map((cu) => (
                        <SelectItem key={cu.id} value={cu.id}>
                          {cu.nome} · {cu.turno}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {curso && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Modalidade de concorrência</label>
                <Select value={cota} onValueChange={(v) => { setCota(v as CotaId); setMostrouResultado(false); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cotasDisponiveis.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>{ct.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {COTAS.find((ct) => ct.id === cota)?.descricao}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* acertos por disciplina */}
        {curso && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">Seus acertos</h2>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {totalPreenchido}/{TOTAL_QUESTOES}
                </span>
              </div>
              <div className="space-y-2">
                {DISCIPLINAS_UFU.map((d, i) => (
                  <div key={d.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{d.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.questoes} questões · peso {curso.pesos[i]} no seu curso
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => { setAcerto(d.id, d.questoes, -1); setMostrouResultado(false); }}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">
                        {acertos[d.id] ?? 0}
                      </span>
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => { setAcerto(d.id, d.questoes, +1); setMostrouResultado(false); }}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full" size="lg" onClick={verResultado} disabled={!cursoId}>
                Ver meu placar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* resultado */}
        {mostrouResultado && resultado && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-1">
                <p className="text-5xl font-extrabold tabular-nums">
                  {resultado.totalAcertos}
                  <span className="text-xl font-medium text-muted-foreground">/{TOTAL_QUESTOES}</span>
                </p>
                {resultado.corte !== null ? (
                  <p className="text-sm font-medium">
                    {resultado.status === "acima" && (
                      <span className="text-status-analyzed">
                        {resultado.delta} acima do corte ({resultado.corte}) da 2ª fase
                      </span>
                    )}
                    {resultado.status === "no_corte" && (
                      <span className="text-status-draft">exatamente no corte ({resultado.corte})</span>
                    )}
                    {resultado.status === "abaixo" && (
                      <span className="text-destructive">
                        faltam {Math.abs(resultado.delta!)} pro corte ({resultado.corte}) da 2ª fase
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Esta cota não teve corte publicado em {EDICAO}.</p>
                )}
              </div>

              {/* barra você × corte */}
              <div className="relative h-3 rounded-full bg-muted overflow-visible">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  style={{ width: `${(resultado.totalAcertos / TOTAL_QUESTOES) * 100}%` }}
                />
                {resultado.corte !== null && (
                  <div
                    className="absolute -top-1 -bottom-1 w-0.5 bg-status-draft"
                    style={{ left: `${(resultado.corte / TOTAL_QUESTOES) * 100}%` }}
                    title={`Corte: ${resultado.corte}`}
                  />
                )}
              </div>

              {resultado.ondeInvestir.length > 0 && (
                <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                  <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Onde seu curso mais pune erro
                  </p>
                  {resultado.ondeInvestir.map((o) => (
                    <p key={o.disciplinaId} className="flex justify-between">
                      <span>{o.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {o.perdidos} pts ponderados na mesa (peso {o.peso})
                      </span>
                    </p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button size="lg" onClick={compartilhar} disabled={gerando}>
                  {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                  Compartilhar card
                </Button>
                <Button size="lg" variant="outline" onClick={baixar} disabled={gerando}>
                  <Download className="h-4 w-4" />
                  Baixar PNG
                </Button>
              </div>

              <a
                href="/redacao-ufu"
                className="block rounded-lg bg-muted p-3 text-sm hover:bg-secondary transition-colors"
              >
                <span className="font-semibold">Redação com peso 3 no seu curso.</span>{" "}
                Corrija a sua nos 5 critérios oficiais da banca UFU →
              </a>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Corte oficial DIRPS {EDICAO} para classificação à 2ª fase (correção da redação).
                A classificação final usa escore padronizado (média e desvio da concorrência do curso)
                + pesos por disciplina + redação com peso 3 — o corte aqui é da 1ª fase, não da vaga.
              </p>
            </CardContent>
          </Card>
        )}

        <footer className="text-center text-xs text-muted-foreground pb-8">
          Dados públicos da DIRPS/UFU organizados de forma independente. Não somos afiliados à UFU.
        </footer>
      </div>
    </div>
  );
}

function baixarBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "meu-placar-ufu.png";
  a.click();
  URL.revokeObjectURL(url);
}
