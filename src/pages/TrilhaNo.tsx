import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// Trilha tables are not in generated types yet — cast to loosen types.
const supabase = supabaseTyped as unknown as {
  from: (t: string) => any;
};
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { X, Check, Flame, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { PROPOSTAS_UFU } from "@/data/ufu/redacao";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  recomputePlacarTrilha,
  atualizarPlacar,
  META_TOTAL,
  type PlacarFonte,
} from "@/lib/ufu/placar";
import { useStudyStats } from "@/hooks/useStudyStats";
import { CURSOS_UFU, COTAS, TOTAL_QUESTOES, type CotaId } from "@/data/ufu/vestibular";
import { PlacarShareCard } from "@/components/ufu/PlacarShareCard";


type Opcao = { id: string; texto: string; svg?: string | null };
type Payload = {
  enunciado: string;
  midia?: { svg?: string };
  opcoes?: Opcao[];
  colunaA?: Opcao[];
  colunaB?: Opcao[];
  gabarito: unknown;
  feedback_erro?: string;
  feedback_acerto?: string;
  explicacao_curta?: string;
  proposta_id?: string;
  corpo?: string;
  cta?: { texto: string; href: string };
};
type Item = {
  id: string;
  no_id: string;
  nivel: number;
  ordem: number;
  tipo: "tocar" | "ligar" | "ordenar" | "completar" | "multipla" | "info";
  payload: Payload;
};
type No = { id: string; titulo: string; descricao: string | null; nivel_max: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function arrEq(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((x, i) => x === b[i]);
}
function setEq(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

export default function TrilhaNo() {
  const { noId } = useParams<{ noId: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const studyStats = useStudyStats();

  const [no, setNo] = useState<No | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [tentativas, setTentativas] = useState(1);
  const [phase, setPhase] = useState<"answer" | "wrong" | "reveal" | "correct">("answer");
  // Sequência de celebração: wrap → result → (perfect?) → streak → (placar mudou?) → done
  const [finishedStep, setFinishedStep] = useState<
    null | "wrap" | "result" | "perfect" | "streak" | "placar"
  >(null);
  const startedAt = useRef<number>(Date.now());
  const stats = useRef({ total: 0, primeira: 0 });
  const nivelAtualRef = useRef<number>(0);

  // Combo: acertos de primeira consecutivos. Zera ao errar.
  const [combo, setCombo] = useState(0);
  const [comboBadge, setComboBadge] = useState<number | null>(null);

  // Placar antes/depois desta sessão — usado na tela "bolinha andou"
  const [placarAntes, setPlacarAntes] = useState<number | null>(null);
  const [placarDepois, setPlacarDepois] = useState<number | null>(null);


  // Load nó + itens + progresso
  useEffect(() => {
    if (!noId || !user) return;
    (async () => {
      setLoading(true);
      const [{ data: noData, error: noErr }, { data: itensData, error: itErr }] = await Promise.all([
        supabase.from("trilha_nos").select("id,titulo,descricao,nivel_max,disciplina,ordem").eq("id", noId).maybeSingle(),
        supabase.from("trilha_itens").select("id,no_id,nivel,ordem,tipo,payload").eq("no_id", noId).order("nivel").order("ordem"),
      ]);
      if (noErr || !noData) {
        toast.error("Nó não encontrado.");
        navigate("/hoje");
        return;
      }

      // Guard: cadeado linear — só entra se todos os nós anteriores da mesma disciplina estão dourados.
      const noRow = noData as No & { disciplina: string; ordem: number };
      const { data: anteriores } = await supabase
        .from("trilha_nos")
        .select("id,ordem")
        .eq("ativo", true)
        .eq("disciplina", noRow.disciplina)
        .lt("ordem", noRow.ordem);
      const anterioresIds = ((anteriores as { id: string }[]) ?? []).map((r) => r.id);
      if (anterioresIds.length > 0) {
        const { data: progAnt } = await supabase
          .from("trilha_progresso")
          .select("no_id,dourado")
          .eq("user_id", user.id)
          .in("no_id", anterioresIds);
        const douradosSet = new Set(
          ((progAnt as { no_id: string; dourado: boolean }[]) ?? [])
            .filter((r) => r.dourado)
            .map((r) => r.no_id),
        );
        const falta = anterioresIds.find((id) => !douradosSet.has(id));
        if (falta) {
          toast.error("Termine o nó anterior primeiro.");
          navigate("/hoje");
          return;
        }
      }

      if (itErr || !itensData?.length) {
        toast.error("Sem itens neste nó.");
        navigate("/hoje");
        return;
      }
      setNo(noData as No);
      setItens(itensData as Item[]);

      // upsert progresso; resume from nivel_atual
      const { data: prog } = await supabase
        .from("trilha_progresso")
        .select("nivel_atual,dourado")
        .eq("user_id", user.id)
        .eq("no_id", noId)
        .maybeSingle();
      const nivelAtual = prog?.nivel_atual ?? 0;
      nivelAtualRef.current = nivelAtual;
      if (!prog) {
        await supabase.from("trilha_progresso").upsert({
          user_id: user.id,
          no_id: noId,
          nivel_atual: 0,
          dourado: false,
          updated_at: new Date().toISOString(),
        });
      }
      const startIdx = (itensData as Item[]).findIndex((it) => it.nivel >= nivelAtual);
      setIdx(startIdx >= 0 ? startIdx : 0);
      setLoading(false);
    })();
  }, [noId, user, navigate]);

  const current = itens[idx];

  const handleCorrect = async () => {
    if (!user || !current) return;
    stats.current.total += 1;
    if (tentativas === 1) stats.current.primeira += 1;
    await supabase.from("trilha_respostas").insert({
      user_id: user.id,
      item_id: current.id,
      acertou_primeira: tentativas === 1,
      tentativas,
    });
    setPhase("correct");
    setTimeout(() => advance(), 1500);
  };

  const advance = async () => {
    if (!user || !current) return;
    const next = idx + 1;
    const isLastOfNivel = !itens[next] || itens[next].nivel !== current.nivel;
    if (isLastOfNivel) {
      const novoNivel = current.nivel + 1;
      const isEndOfNo = !itens[next];
      const dourado = isEndOfNo && current.nivel === (no?.nivel_max ?? 5);
      await supabase.from("trilha_progresso").upsert({
        user_id: user.id,
        no_id: current.no_id,
        nivel_atual: dourado ? current.nivel : novoNivel,
        dourado,
        updated_at: new Date().toISOString(),
      });
      if (isEndOfNo) {
        setFinished("wrap");
        return;
      }
    }
    setIdx(next);
    setTentativas(1);
    setPhase("answer");
  };

  const handleWrong = () => {
    if (tentativas >= 2) {
      setPhase("reveal");
      return;
    }
    setTentativas((t) => t + 1);
    setPhase("wrong");
  };

  if (loading || !current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (finished === "wrap") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background text-foreground">
        <div className="text-6xl mb-4">🏅</div>
        <h1 className="text-3xl font-bold mb-2 text-center">Nó completo</h1>
        <p className="text-muted-foreground mb-8 text-center">{no?.titulo}</p>
        <Button size="lg" className="w-full max-w-sm" onClick={() => setFinished("result")}>
          VER MEU RESULTADO
        </Button>
      </div>
    );
  }

  if (finished === "result") {
    const tempoMin = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
    const pct = stats.current.total ? Math.round((stats.current.primeira / stats.current.total) * 100) : 0;
    const last = itens[itens.length - 1];
    const cta = last?.payload?.cta;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background text-foreground">
        <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-8">
          <Stat label="itens" value={String(itens.length)} />
          <Stat label="1ª tentativa" value={`${pct}%`} />
          <Stat label="tempo" value={`${tempoMin}min`} />
        </div>
        <h2 className="text-2xl font-bold text-center mb-8 max-w-md">
          Você subiu do "quais são os gêneros" até a proposta real.
        </h2>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {cta && (
            <Button size="lg" className="w-full" onClick={() => navigate(cta.href)}>
              {cta.texto}
            </Button>
          )}
          <Button variant="ghost" size="lg" className="w-full" onClick={() => navigate("/hoje")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const proposta = current.payload.proposta_id
    ? PROPOSTAS_UFU.find((p) => p.id === current.payload.proposta_id)
    : null;

  const progress = ((idx + 1) / itens.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          onClick={() => navigate("/hoje")}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          aria-label="Sair"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {idx + 1}/{itens.length}
        </span>
      </header>

      {/* Body */}
      <main className="flex-1 flex flex-col px-4 py-6 max-w-2xl w-full mx-auto">
        {proposta && (
          <div className="mb-5 p-4 rounded-xl border border-border bg-muted/30 max-h-40 overflow-y-auto">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
              Proposta real
            </div>
            <div className="font-semibold text-sm mb-1">{proposta.titulo}</div>
            <div className="text-sm text-muted-foreground leading-relaxed">{proposta.enunciado}</div>
          </div>
        )}

        <ItemRenderer
          key={current.id + phase}
          item={current}
          phase={phase}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
        />
      </main>

      {/* Feedback footer */}
      {(phase === "wrong" || phase === "correct" || phase === "reveal") && (
        <FeedbackBar
          phase={phase}
          payload={current.payload}
          onNext={() => (phase === "correct" ? advance() : setPhase("answer"))}
          onContinueAfterReveal={() => advance()}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-lg border border-border">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function FeedbackBar({
  phase,
  payload,
  onNext,
  onContinueAfterReveal,
}: {
  phase: "wrong" | "correct" | "reveal";
  payload: Payload;
  onNext: () => void;
  onContinueAfterReveal: () => void;
}) {
  const isCorrect = phase === "correct";
  const text = isCorrect
    ? payload.feedback_acerto ?? payload.explicacao_curta ?? "Isso!"
    : payload.feedback_erro ?? "Reveja com calma.";
  return (
    <div
      className={cn(
        "border-t px-4 py-4 sticky bottom-0",
        isCorrect ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900" :
        phase === "reveal" ? "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900" :
        "bg-muted border-border",
      )}
    >
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="flex-1 text-sm leading-snug">{text}</p>
        <Button
          onClick={phase === "reveal" ? onContinueAfterReveal : onNext}
          className="sm:w-auto w-full"
          variant={isCorrect ? "default" : "secondary"}
        >
          {phase === "wrong" ? "Tentar de novo" : "Continuar"}
        </Button>
      </div>
    </div>
  );
}

function ItemRenderer({
  item,
  phase,
  onCorrect,
  onWrong,
}: {
  item: Item;
  phase: "answer" | "wrong" | "reveal" | "correct";
  onCorrect: () => void;
  onWrong: () => void;
}) {
  const { payload, tipo } = item;
  const locked = phase !== "answer";

  return (
    <div className="flex-1 flex flex-col">
      {payload.midia?.svg && (
        <div
          className="mb-4 flex justify-center"
          dangerouslySetInnerHTML={{ __html: payload.midia.svg }}
        />
      )}
      <h2 className="text-lg sm:text-xl font-semibold leading-snug mb-6">
        {tipo === "completar"
          ? renderCompletar(payload.enunciado)
          : payload.enunciado}
      </h2>

      {tipo === "tocar" && (
        <TocarView payload={payload} locked={locked} phase={phase} onCorrect={onCorrect} onWrong={onWrong} />
      )}
      {tipo === "multipla" && (
        <MultiplaView payload={payload} locked={locked} phase={phase} onCorrect={onCorrect} onWrong={onWrong} />
      )}
      {tipo === "completar" && (
        <CompletarView payload={payload} locked={locked} phase={phase} onCorrect={onCorrect} onWrong={onWrong} />
      )}
      {tipo === "ordenar" && (
        <OrdenarView payload={payload} locked={locked} phase={phase} onCorrect={onCorrect} onWrong={onWrong} />
      )}
      {tipo === "ligar" && (
        <LigarView payload={payload} locked={locked} phase={phase} onCorrect={onCorrect} onWrong={onWrong} />
      )}
      {tipo === "info" && (
        <div className="space-y-5">
          {payload.corpo && (
            <div className="rounded-xl border border-border bg-muted/40 p-5 text-[15px] leading-relaxed whitespace-pre-line">
              {payload.corpo}
            </div>
          )}
          {!locked ? (
            <button
              onClick={onCorrect}
              className="w-full rounded-xl bg-foreground text-background font-semibold py-3.5 hover:opacity-90 transition-opacity"
            >
              Entendi, bora
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function renderCompletar(text: string) {
  const parts = text.split("___");
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && (
            <span className="inline-block min-w-[3rem] px-2 mx-1 border-b-2 border-primary text-primary font-bold">
              ___
            </span>
          )}
        </span>
      ))}
    </>
  );
}

/* ---------- Sub-views ---------- */

type ViewProps = {
  payload: Payload;
  locked: boolean;
  phase: "answer" | "wrong" | "reveal" | "correct";
  onCorrect: () => void;
  onWrong: () => void;
};

function TocarView({ payload, locked, phase, onCorrect, onWrong }: ViewProps) {
  const [sel, setSel] = useState<string[]>([]);
  const gabarito = (payload.gabarito as string[]) ?? [];
  const multi = gabarito.length > 1;

  const toggle = (id: string) => {
    if (locked) return;
    if (multi) setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    else setSel([id]);
  };

  const verify = () => {
    if (sel.length === 0) return;
    if (setEq(sel, gabarito)) onCorrect();
    else onWrong();
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {payload.opcoes?.map((op) => {
          const isSel = sel.includes(op.id);
          const isRight = gabarito.includes(op.id);
          const showRight = phase === "reveal" && isRight;
          return (
            <button
              key={op.id}
              onClick={() => toggle(op.id)}
              disabled={locked}
              className={cn(
                "px-4 py-3 rounded-xl border-2 text-left transition-colors text-sm sm:text-base",
                isSel && !locked && "border-primary bg-primary/5",
                !isSel && !locked && "border-border hover:border-foreground/40",
                showRight && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
                locked && !showRight && "opacity-50 border-border",
              )}
            >
              {op.svg && <span dangerouslySetInnerHTML={{ __html: op.svg }} />}
              {op.texto}
            </button>
          );
        })}
      </div>
      {!locked && (
        <Button
          onClick={verify}
          disabled={sel.length === 0}
          size="lg"
          className="mt-6 w-full sm:w-auto sm:self-end"
        >
          Verificar
        </Button>
      )}
    </>
  );
}

function MultiplaView({ payload, locked, phase, onCorrect, onWrong }: ViewProps) {
  const gabarito = (payload.gabarito as string[])[0];
  const [sel, setSel] = useState<string | null>(null);

  const pick = (id: string) => {
    if (locked) return;
    setSel(id);
    setTimeout(() => {
      if (id === gabarito) onCorrect();
      else onWrong();
    }, 150);
  };

  return (
    <div className="flex flex-col gap-3">
      {payload.opcoes?.map((op, i) => {
        const letter = String.fromCharCode(65 + i);
        const isSel = sel === op.id;
        const isRight = op.id === gabarito;
        const showRight = phase === "reveal" && isRight;
        return (
          <button
            key={op.id}
            onClick={() => pick(op.id)}
            disabled={locked}
            className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors text-sm sm:text-base",
              isSel && !locked && "border-primary bg-primary/5",
              !isSel && !locked && "border-border hover:border-foreground/40",
              showRight && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
              locked && !isSel && !showRight && "opacity-50",
            )}
          >
            <span className="font-bold text-muted-foreground w-6 shrink-0">{letter}</span>
            <span className="flex-1">{op.texto}</span>
          </button>
        );
      })}
    </div>
  );
}

function CompletarView({ payload, locked, phase, onCorrect, onWrong }: ViewProps) {
  const gabarito = (payload.gabarito as string[])[0];
  const [sel, setSel] = useState<string | null>(null);
  const pick = (id: string) => {
    if (locked) return;
    setSel(id);
    setTimeout(() => {
      if (id === gabarito) onCorrect();
      else onWrong();
    }, 150);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {payload.opcoes?.map((op) => {
        const isSel = sel === op.id;
        const isRight = op.id === gabarito;
        const showRight = phase === "reveal" && isRight;
        return (
          <button
            key={op.id}
            onClick={() => pick(op.id)}
            disabled={locked}
            className={cn(
              "px-4 py-2.5 rounded-full border-2 text-sm transition-colors",
              isSel && !locked && "border-primary bg-primary/5",
              !isSel && !locked && "border-border hover:border-foreground/40",
              showRight && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
              locked && !isSel && !showRight && "opacity-50",
            )}
          >
            {op.texto}
          </button>
        );
      })}
    </div>
  );
}

function OrdenarView({ payload, locked, phase, onCorrect, onWrong }: ViewProps) {
  const shuffled = useMemo(() => shuffle(payload.opcoes ?? []), [payload]);
  const [order, setOrder] = useState<string[]>([]);
  const gabarito = payload.gabarito as string[];

  const toggle = (id: string) => {
    if (locked) return;
    setOrder((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };
  const verify = () => {
    if (order.length !== (payload.opcoes?.length ?? 0)) return;
    if (arrEq(order, gabarito)) onCorrect();
    else onWrong();
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {shuffled.map((op) => {
          const pos = order.indexOf(op.id);
          const gabPos = gabarito.indexOf(op.id);
          const showRight = phase === "reveal";
          return (
            <button
              key={op.id}
              onClick={() => toggle(op.id)}
              disabled={locked}
              className={cn(
                "flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors text-sm sm:text-base",
                pos >= 0 && !locked && "border-primary bg-primary/5",
                pos < 0 && !locked && "border-border hover:border-foreground/40",
                showRight && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
                locked && pos < 0 && !showRight && "opacity-50",
              )}
            >
              <span className="font-bold text-primary w-6 shrink-0 tabular-nums">
                {showRight ? gabPos + 1 : pos >= 0 ? pos + 1 : "•"}
              </span>
              <span className="flex-1">{op.texto}</span>
            </button>
          );
        })}
      </div>
      {!locked && (
        <div className="mt-6 flex gap-2 sm:justify-end">
          <Button variant="ghost" onClick={() => setOrder([])} disabled={!order.length}>
            Limpar
          </Button>
          <Button
            onClick={verify}
            disabled={order.length !== (payload.opcoes?.length ?? 0)}
            size="lg"
          >
            Verificar
          </Button>
        </div>
      )}
    </>
  );
}

function LigarView({ payload, locked, phase, onCorrect, onWrong }: ViewProps) {
  const gabarito = payload.gabarito as [string, string][];
  const [pairs, setPairs] = useState<[string, string][]>([]);
  const [selA, setSelA] = useState<string | null>(null);
  const [selB, setSelB] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const shuffledB = useMemo(() => shuffle(payload.colunaB ?? []), [payload]);

  const pairedA = new Set(pairs.map((p) => p[0]));
  const pairedB = new Set(pairs.map((p) => p[1]));

  useEffect(() => {
    if (selA && selB) {
      const isRight = gabarito.some(([a, b]) => a === selA && b === selB);
      if (isRight) {
        const next = [...pairs, [selA, selB] as [string, string]];
        setPairs(next);
        setSelA(null);
        setSelB(null);
        if (next.length === gabarito.length) {
          setTimeout(() => onCorrect(), 200);
        }
      } else {
        setShakeKey((k) => k + 1);
        setTimeout(() => {
          setSelA(null);
          setSelB(null);
          onWrong();
        }, 400);
      }
    }
  }, [selA, selB]);

  const cellCls = (side: "a" | "b", id: string, sel: string | null, paired: boolean) =>
    cn(
      "px-3 py-3 rounded-xl border-2 text-left text-sm transition-colors w-full",
      paired && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 opacity-70 cursor-default",
      !paired && sel === id && "border-primary bg-primary/5",
      !paired && sel !== id && "border-border hover:border-foreground/40",
      locked && "cursor-default",
    );

  return (
    <div key={shakeKey} className={cn("grid grid-cols-2 gap-3 animate-in", shakeKey > 0 && "animate-pulse")}> 
      <div className="flex flex-col gap-2">
        {payload.colunaA?.map((op) => {
          const paired = pairedA.has(op.id);
          return (
            <button
              key={op.id}
              onClick={() => !paired && !locked && setSelA(op.id)}
              disabled={paired || locked}
              className={cellCls("a", op.id, selA, paired)}
            >
              {op.texto}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        {shuffledB.map((op) => {
          const paired = pairedB.has(op.id);
          return (
            <button
              key={op.id}
              onClick={() => !paired && !locked && setSelB(op.id)}
              disabled={paired || locked}
              className={cellCls("b", op.id, selB, paired)}
            >
              {op.texto}
            </button>
          );
        })}
      </div>
    </div>
  );
}
