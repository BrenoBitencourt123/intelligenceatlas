import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// Trilha tables are not in generated types yet — cast to loosen types.
const supabase = supabaseTyped as unknown as {
  from: (t: string) => any;
};
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { X, Check, Flame, Sparkles, Trophy, Snowflake } from "lucide-react";
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
import { trackUfu } from "@/lib/ufu/track";
import { VOCAB } from "@/lib/vocab";


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
  const sessaoIniciadaRef = useRef(false);
  const sessaoFinalizadaRef = useRef(false);

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
        toast.error(VOCAB.fase.naoEncontrada);
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
          toast.error(VOCAB.fase.termineAnterior);
          navigate("/hoje");
          return;
        }
      }

      if (itErr || !itensData?.length) {
        toast.error(VOCAB.fase.semItens);
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
      startedAt.current = Date.now();

      // evento: trilha_sessao_inicio (guard contra re-render)
      if (!sessaoIniciadaRef.current) {
        sessaoIniciadaRef.current = true;
        trackUfu("trilha_sessao_inicio", {
          no_id: noId,
          disciplina: (noData as { disciplina?: string }).disciplina ?? null,
          nivel_inicial: nivelAtual,
        });
      }
    })();
  }, [noId, user, navigate]);

  // Abandono: se sair no meio (unmount, pagehide, beforeunload) sem finalizar → evento
  useEffect(() => {
    const dispararAbandono = () => {
      if (sessaoIniciadaRef.current && !sessaoFinalizadaRef.current) {
        trackUfu("trilha_sessao_abandono", {
          no_id: noId,
          idx,
          total: itens.length,
        });
        // Evita re-disparo em pagehide + unmount
        sessaoFinalizadaRef.current = true;
      }
    };
    window.addEventListener("pagehide", dispararAbandono);
    window.addEventListener("beforeunload", dispararAbandono);
    return () => {
      window.removeEventListener("pagehide", dispararAbandono);
      window.removeEventListener("beforeunload", dispararAbandono);
      dispararAbandono();
    };
  }, [noId, idx, itens.length]);

  const current = itens[idx];

  const handleCorrect = async () => {
    if (!user || !current) return;
    stats.current.total += 1;
    const acertouPrimeira = tentativas === 1;
    if (acertouPrimeira) stats.current.primeira += 1;
    await supabase.from("trilha_respostas").insert({
      user_id: user.id,
      item_id: current.id,
      acertou_primeira: acertouPrimeira,
      tentativas,
    });

    // Combo: só sobe se acertou de primeira. Vibra e mostra badge nos múltiplos de 5.
    if (acertouPrimeira) {
      setCombo((c) => {
        const next = c + 1;
        if (next > 0 && next % 5 === 0) {
          trackUfu("combo_atingido", { valor: next });
          setComboBadge(next);
          if (navigator.vibrate) navigator.vibrate(30);
          setTimeout(() => setComboBadge(null), 2000);
        }
        return next;
      });
    }

    setPhase("correct");
    setTimeout(() => advance(), 1500);
  };

  const finalizarNo = async (dourado: boolean) => {
    if (!user) return;
    // Marca antes de qualquer await para o listener de abandono não disparar em paralelo.
    sessaoFinalizadaRef.current = true;

    // Snapshot ANTES
    const antes =
      (profile as { placar_estimado?: number | null } | null)?.placar_estimado ?? null;
    const fonteAtual =
      ((profile as { placar_fonte?: PlacarFonte | null } | null)?.placar_fonte) ?? null;
    setPlacarAntes(antes);

    // Tenta recalcular via trilha (≥ 8 respostas reais)
    const novo = await recomputePlacarTrilha(user.id);
    if (novo !== null) {
      const salvo = await atualizarPlacar(user.id, novo, "trilha", fonteAtual);
      if (salvo !== null) {
        setPlacarDepois(salvo);
        trackUfu("placar_atualizado", {
          fonte: "trilha",
          antes: antes ?? 0,
          depois: salvo,
        });
        await refreshProfile();
      }
    }

    // evento: trilha_sessao_fim
    const total = stats.current.total;
    const pctPrimeira = total ? Math.round((stats.current.primeira / total) * 100) : 0;
    const tempoS = Math.round((Date.now() - startedAt.current) / 1000);
    trackUfu("trilha_sessao_fim", {
      no_id: noId,
      itens: total,
      pct_primeira: pctPrimeira,
      tempo_s: tempoS,
      dourado,
    });

    setFinishedStep("wrap");
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
        await finalizarNo(dourado);
        return;
      }
    }
    setIdx(next);
    setTentativas(1);
    setPhase("answer");
  };

  const handleWrong = () => {
    setCombo(0); // errou → combo zera
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

  // ============= Sequência de celebração =============
  const perfeito = stats.current.total > 0 && stats.current.primeira === stats.current.total;
  const placarMudou = placarDepois !== null && placarAntes !== placarDepois;

  // Ordem: wrap → result → (perfect?) → streak → (placar?) → /hoje
  const advanceCelebracao = () => {
    if (finishedStep === "wrap") return setFinishedStep("result");
    if (finishedStep === "result") {
      if (perfeito) return setFinishedStep("perfect");
      return setFinishedStep("streak");
    }
    if (finishedStep === "perfect") return setFinishedStep("streak");
    if (finishedStep === "streak") {
      if (placarMudou) return setFinishedStep("placar");
      return navigate("/hoje");
    }
    if (finishedStep === "placar") return navigate("/hoje");
  };

  if (finishedStep === "wrap") {
    return (
      <TapScreen onNext={advanceCelebracao}>
        <div className="text-6xl mb-4">🏅</div>
        <h1 className="text-3xl font-bold mb-2 text-center">Nó completo</h1>
        <p className="text-muted-foreground mb-8 text-center">{no?.titulo}</p>
        <Button size="lg" className="w-full max-w-sm" onClick={advanceCelebracao}>
          VER MEU RESULTADO
        </Button>
      </TapScreen>
    );
  }

  if (finishedStep === "result") {
    const tempoMin = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
    const pct = stats.current.total ? Math.round((stats.current.primeira / stats.current.total) * 100) : 0;
    return (
      <TapScreen onNext={advanceCelebracao} tela="resultado">

        <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-8">
          <Stat label="itens" value={String(itens.length)} />
          <Stat label="1ª tentativa" value={`${pct}%`} />
          <Stat label="tempo" value={`${tempoMin}min`} />
        </div>
        <h2 className="text-2xl font-bold text-center mb-8 max-w-md">
          Você subiu do "quais são os gêneros" até a proposta real.
        </h2>
        <p className="text-xs text-muted-foreground">toque pra continuar</p>
      </TapScreen>
    );
  }

  if (finishedStep === "perfect") {
    // evento: celebracao_vista { tipo: 'perfeito' }
    return (
      <PerfectScreen
        total={stats.current.total}
        onNext={advanceCelebracao}
      />
    );
  }

  if (finishedStep === "streak") {
    // evento: celebracao_vista { tipo: 'streak' }
    return (
      <StreakScreen
        streak={studyStats.streak}
        frozenDaysThisWeek={studyStats.frozenDaysThisWeek}
        onNext={advanceCelebracao}
      />
    );
  }

  if (finishedStep === "placar") {
    // evento: celebracao_vista { tipo: 'placar' }
    const cursoId = (profile as { curso_ufu?: string } | null | undefined)?.curso_ufu;
    const cotaId = (profile as { cota_ufu?: CotaId } | null | undefined)?.cota_ufu;
    const curso = cursoId ? CURSOS_UFU.find((c) => c.id === cursoId) : null;
    const corte = curso && cotaId ? curso.cortes[cotaId] ?? null : null;
    const meta = corte !== null && corte !== undefined
      ? Math.min(TOTAL_QUESTOES, Math.ceil(corte * 1.22))
      : null;
    return (
      <PlacarScreen
        antes={placarAntes ?? 0}
        depois={placarDepois ?? 0}
        corte={corte ?? 0}
        meta={meta ?? META_TOTAL}
        nome={(profile as { name?: string | null } | null)?.name ?? undefined}
        onNext={advanceCelebracao}
      />
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
          onClick={() => {
            if (sessaoIniciadaRef.current && !sessaoFinalizadaRef.current) {
              trackUfu("trilha_sessao_abandono", {
                no_id: noId,
                idx,
                total: itens.length,
              });
              sessaoFinalizadaRef.current = true;
            }
            navigate("/hoje");
          }}
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
        {comboBadge !== null && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100 animate-pulse tabular-nums">
            🔥 combo x{comboBadge}
          </span>
        )}
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

/* ---------- Celebração ---------- */

const DIAS_STREAK = ["D", "S", "T", "Q", "Q", "S", "S"];

function TapScreen({
  children,
  onNext,
  tela,
}: {
  children: React.ReactNode;
  onNext: () => void;
  tela?: "perfeito" | "streak" | "placar" | "resultado";
}) {
  const t0 = useRef(Date.now());
  const disparado = useRef(false);
  const handle = () => {
    if (tela && !disparado.current) {
      disparado.current = true;
      const dur = Date.now() - t0.current;
      if (dur < 500) trackUfu("celebracao_pulada", { tela });
      else trackUfu("celebracao_vista", { tela, duracao_ms: dur });
    }
    onNext();
  };
  return (
    <div
      onClick={handle}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background text-foreground cursor-pointer select-none"
    >
      {children}
    </div>
  );
}


function PerfectScreen({ total, onNext }: { total: number; onNext: () => void }) {
  useEffect(() => {
    // Confete leve (~150 partículas) num único disparo pra não derrubar FPS
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      disableForReducedMotion: true,
    });
    if (navigator.vibrate) navigator.vibrate(50);
  }, []);
  return (
    <TapScreen onNext={onNext} tela="perfeito">
      <Trophy className="h-16 w-16 text-amber-500 mb-4 animate-in zoom-in-50 duration-500" />
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">PERFEITO</p>
      <h1 className="text-4xl sm:text-5xl font-black text-center mb-2">
        {total} de {total}
      </h1>
      <p className="text-lg text-muted-foreground text-center mb-6">na primeira tentativa</p>
      <p className="text-xs text-muted-foreground">toque pra continuar</p>
    </TapScreen>
  );
}

function StreakScreen({
  streak,
  frozenDaysThisWeek,
  onNext,
}: {
  streak: number;
  frozenDaysThisWeek: string[];
  onNext: () => void;
}) {
  const now = new Date();
  const todayDow = now.getDay();
  const jsDayToDate = (dow: number) => {
    // dow: 0=domingo..6=sábado. Reconstroi a data desta semana (semana comum baseada em domingo).
    const d = new Date(now);
    d.setDate(now.getDate() - todayDow + dow);
    return d.toISOString().split("T")[0];
  };
  const nomeDia: Record<number, string> = {
    0: "domingo",
    1: "segunda",
    2: "terça",
    3: "quarta",
    4: "quinta",
    5: "sexta",
    6: "sábado",
  };
  const frozenSet = new Set(frozenDaysThisWeek);
  const freezeDow = [0, 1, 2, 3, 4, 5, 6].find((d) => frozenSet.has(jsDayToDate(d)));

  return (
    <TapScreen onNext={onNext} tela="streak">
      <div className="flex items-center gap-2 mb-2 animate-in zoom-in-50 duration-500">
        <Flame className="h-12 w-12 text-orange-500" />
        <span className="text-6xl font-black tabular-nums">{streak}</span>
      </div>
      <p className="text-lg text-muted-foreground mb-8">dias seguidos</p>

      <div className="flex items-center justify-between gap-1 w-full max-w-xs mb-4">
        {DIAS_STREAK.map((letra, dow) => {
          const isToday = dow === todayDow;
          const dateStr = jsDayToDate(dow);
          const isFrozen = frozenSet.has(dateStr);
          const isPast = dow <= todayDow;
          const isDone = isPast && !isFrozen;
          return (
            <div key={dow} className="flex flex-col items-center gap-1.5 flex-1">
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider",
                  isToday ? "text-foreground font-bold" : "text-muted-foreground",
                )}
              >
                {letra}
              </span>
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border",
                  isFrozen
                    ? "bg-sky-100 border-sky-300 text-sky-700 dark:bg-sky-900/40 dark:border-sky-700 dark:text-sky-200"
                    : isDone
                    ? "bg-foreground text-background border-foreground"
                    : "border-border",
                  isToday && "animate-in zoom-in-50 duration-500",
                )}
              >
                {isFrozen ? (
                  <Snowflake className="h-3.5 w-3.5" />
                ) : isDone ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {freezeDow !== undefined && (
        <p className="text-xs text-sky-700 dark:text-sky-300 mb-4 text-center">
          Te segurei na {nomeDia[freezeDow]}. Tamo junto.
        </p>
      )}

      <p className="text-xs text-muted-foreground">toque pra continuar</p>
    </TapScreen>
  );
}

function PlacarScreen({
  antes,
  depois,
  corte,
  meta,
  nome,
  onNext,
}: {
  antes: number;
  depois: number;
  corte: number;
  meta: number;
  nome?: string;
  onNext: () => void;
}) {
  const posAntesPct = (antes / META_TOTAL) * 100;
  const posDepoisPct = (depois / META_TOTAL) * 100;
  const cortePct = (corte / META_TOTAL) * 100;
  const metaPct = (meta / META_TOTAL) * 100;
  const faltam = Math.max(0, meta - depois);
  const areaFraca = "Matemática"; // TODO: derivar de user_topic_profile no P1

  const t0 = useRef(Date.now());
  const disparado = useRef(false);
  const handleNext = () => {
    if (!disparado.current) {
      disparado.current = true;
      const dur = Date.now() - t0.current;
      if (dur < 500) trackUfu("celebracao_pulada", { tela: "placar" });
      else trackUfu("celebracao_vista", { tela: "placar", duracao_ms: dur });
    }
    onNext();
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background text-foreground">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Sua bolinha andou</p>
          </div>
          <p className="text-3xl sm:text-4xl font-black tabular-nums">
            {antes} → {depois}
            <span className="text-base font-medium text-muted-foreground"> de {meta}</span>
          </p>
        </div>

        {/* Barra de zonas */}
        <div className="space-y-2">
          <div className="relative h-3 rounded-full overflow-hidden bg-muted">
            <div
              className="absolute inset-y-0 left-0 bg-[hsl(var(--status-unavailable)/0.18)]"
              style={{ width: `${cortePct}%` }}
            />
            <div
              className="absolute inset-y-0 bg-[hsl(var(--status-draft)/0.22)]"
              style={{ left: `${cortePct}%`, width: `${metaPct - cortePct}%` }}
            />
            <div
              className="absolute inset-y-0 bg-[hsl(var(--status-analyzed)/0.22)]"
              style={{ left: `${metaPct}%`, width: `${100 - metaPct}%` }}
            />
            {/* Bolinha animada antes → depois */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-foreground ring-2 ring-background shadow-md transition-all duration-1000 ease-out"
              style={{ left: `${posDepoisPct}%` }}
            />
            {/* Marcador antes (fantasma) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full border-2 border-foreground/40"
              style={{ left: `${posAntesPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>0</span>
            <span>{corte} corte</span>
            <span>{meta} meta</span>
            <span>{META_TOTAL}</span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {faltam > 0
            ? <>faltam <span className="font-bold text-foreground">{faltam}</span> pra zona segura</>
            : <span className="font-bold text-foreground">Zona segura! Segue firme.</span>}
        </p>

        <PlacarShareCard nota={depois} areaFraca={areaFraca} nome={nome} />

        <Button variant="ghost" className="w-full" onClick={handleNext}>
          Voltar pro Hoje
        </Button>

      </div>
    </div>
  );
}

