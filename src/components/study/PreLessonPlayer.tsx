import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { PreLessonItem, PreLessonOpcao } from "@/hooks/usePreLesson";

interface PreLessonPlayerProps {
  items: PreLessonItem[];
  currentIndex: number;
  onAdvance: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

type Phase = "answer" | "correct" | "wrong" | "reveal";

export function PreLessonPlayer({
  items,
  currentIndex,
  onAdvance,
  onComplete,
  onSkip,
}: PreLessonPlayerProps) {
  const [phase, setPhase] = useState<Phase>("answer");

  const item = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;
  const isLast = currentIndex === items.length - 1;

  const handleCorrect = () => {
    setPhase("correct");
    setTimeout(() => {
      setPhase("answer");
      if (isLast) onComplete();
      else onAdvance();
    }, 1200);
  };

  const handleWrong = () => {
    setPhase("wrong");
  };

  const handleReveal = () => {
    setPhase("reveal");
  };

  const handleContinueAfterReveal = () => {
    setPhase("answer");
    if (isLast) onComplete();
    else onAdvance();
  };

  // Reseta phase ao trocar de item
  const [lastIndex, setLastIndex] = useState(currentIndex);
  if (lastIndex !== currentIndex) {
    setLastIndex(currentIndex);
    setPhase("answer");
  }

  if (!item) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          onClick={onSkip}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          aria-label="Pular pré-aula"
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
          {currentIndex + 1}/{items.length}
        </span>
      </header>

      {/* Label */}
      <div className="px-4 pt-4">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
          Pré-aula
        </span>
      </div>

      {/* Body */}
      <main className="flex-1 flex flex-col px-4 py-4 max-w-2xl w-full mx-auto">
        <ItemView
          key={currentIndex}
          item={item}
          phase={phase}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
        />
      </main>

      {/* Feedback footer */}
      {(phase === "wrong" || phase === "correct" || phase === "reveal") && (
        <FeedbackFooter
          phase={phase}
          item={item}
          onReveal={handleReveal}
          onContinue={handleContinueAfterReveal}
          isLast={isLast}
        />
      )}
    </div>
  );
}

function ItemView({
  item,
  phase,
  onCorrect,
  onWrong,
}: {
  item: PreLessonItem;
  phase: Phase;
  onCorrect: () => void;
  onWrong: () => void;
}) {
  const locked = phase !== "answer";

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-lg sm:text-xl font-semibold leading-snug mb-6">
        {item.enunciado}
      </h2>

      {item.tipo === "info" && (
        <InfoView item={item} locked={locked} onCorrect={onCorrect} />
      )}
      {item.tipo === "multipla" && (
        <MultiplaView
          item={item}
          phase={phase}
          locked={locked}
          onCorrect={onCorrect}
          onWrong={onWrong}
        />
      )}
      {item.tipo === "completar" && (
        <CompletarView
          item={item}
          phase={phase}
          locked={locked}
          onCorrect={onCorrect}
          onWrong={onWrong}
        />
      )}
    </div>
  );
}

function InfoView({
  item,
  locked,
  onCorrect,
}: {
  item: PreLessonItem;
  locked: boolean;
  onCorrect: () => void;
}) {
  return (
    <div className="space-y-5">
      {item.corpo && (
        <div className="rounded-xl border border-border bg-muted/40 p-5 text-[15px] leading-relaxed whitespace-pre-line">
          {item.corpo}
        </div>
      )}
      {!locked && (
        <button
          onClick={onCorrect}
          className="w-full rounded-xl bg-foreground text-background font-semibold py-3.5 hover:opacity-90 transition-opacity"
        >
          Entendi, bora
        </button>
      )}
    </div>
  );
}

function MultiplaView({
  item,
  phase,
  locked,
  onCorrect,
  onWrong,
}: {
  item: PreLessonItem;
  phase: Phase;
  locked: boolean;
  onCorrect: () => void;
  onWrong: () => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const gabarito = item.gabarito;

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
      {item.opcoes?.map((op: PreLessonOpcao, i: number) => {
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

function CompletarView({
  item,
  phase,
  locked,
  onCorrect,
  onWrong,
}: {
  item: PreLessonItem;
  phase: Phase;
  locked: boolean;
  onCorrect: () => void;
  onWrong: () => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const gabarito = item.gabarito;

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
      {item.opcoes?.map((op: PreLessonOpcao) => {
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

function FeedbackFooter({
  phase,
  item,
  onReveal,
  onContinue,
  isLast,
}: {
  phase: Phase;
  item: PreLessonItem;
  onReveal: () => void;
  onContinue: () => void;
  isLast: boolean;
}) {
  const isCorrect = phase === "correct";
  const isReveal = phase === "reveal";

  const text = isCorrect
    ? (item.feedback_acerto ?? "Isso!")
    : isReveal
    ? (item.explicacao_curta ?? "Veja a resposta correta acima.")
    : (item.feedback_erro ?? "Não foi dessa vez.");

  return (
    <div
      className={cn(
        "border-t px-4 py-4 sticky bottom-0",
        isCorrect
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900"
          : isReveal
          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900"
          : "bg-muted border-border",
      )}
    >
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-2 flex-1">
          {isCorrect && <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />}
          <p className="text-sm leading-snug">{text}</p>
        </div>
        {phase === "wrong" ? (
          <div className="flex gap-2 sm:flex-row flex-col-reverse">
            <Button variant="ghost" size="sm" onClick={onReveal}>
              Ver resposta
            </Button>
            <Button variant="secondary" onClick={onContinue}>
              Continuar
            </Button>
          </div>
        ) : (
          <Button
            onClick={onContinue}
            variant={isCorrect ? "default" : "secondary"}
            className="sm:w-auto w-full"
          >
            {isLast && (phase === "correct" || isReveal) ? "Resolver a questão" : "Continuar"}
          </Button>
        )}
      </div>
    </div>
  );
}
