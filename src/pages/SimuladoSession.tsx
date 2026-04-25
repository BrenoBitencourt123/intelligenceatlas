import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, BookOpen, FileText, Pause } from "lucide-react";
import MarkdownText from "@/components/atlas/MarkdownText";
import { InlineStatementRenderer } from "@/components/study/InlineStatementRenderer";
import { useSimuladoSession } from "@/hooks/useSimuladoSession";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useExamPdf } from "@/hooks/useExamPdf";
import { useQuestionPedagogy } from "@/hooks/useQuestionPedagogy";
import { PreConceptBlock } from "@/components/atlas/PedagogyBlocks";

const AREA_LABELS: Record<string, string> = {
  matematica: "Matemática",
  linguagens: "Linguagens",
  natureza: "Natureza",
  humanas: "Humanas",
};

const SimuladoSession = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const yearParam = parseInt(searchParams.get("year") || "0", 10);
  const dayParam = parseInt(searchParams.get("day") || "0", 10) as 1 | 2;
  const resumeParam = searchParams.get("resume") === "1";

  const { isPro, hasKnowledgeCapsules } = usePlanFeatures();
  const {
    state,
    currentQuestion,
    currentIndex,
    totalQuestions,
    showFeedback,
    answers,
    result,
    submitAnswer,
    nextQuestion,
    startSimulado,
    resumeSimulado,
    pauseSimulado,
    finishSimulado,
  } = useSimuladoSession();

  const { available: pdfAvailable, openPdf, loading: pdfLoading } = useExamPdf(
    currentQuestion?.year,
  );

  const { pedagogy, loading: pedagogyLoading } = useQuestionPedagogy(
    currentQuestion
      ? {
          id: currentQuestion.id,
          statement: currentQuestion.statement,
          alternatives: currentQuestion.alternatives as { letter: string; text: string }[],
          correct_answer: currentQuestion.correct_answer,
          explanation: currentQuestion.explanation,
          area: currentQuestion.area,
          tags: currentQuestion.tags,
        }
      : null,
    state === "active" && hasKnowledgeCapsules,
  );

  // Bootstrap: gate by Pro, then either resume or start.
  useEffect(() => {
    if (!isPro) {
      navigate("/plano", { replace: true });
      return;
    }
    if (state !== "idle") return;
    if (resumeParam) {
      const ok = resumeSimulado();
      if (ok) return;
    }
    if (yearParam && (dayParam === 1 || dayParam === 2)) {
      startSimulado(yearParam, dayParam);
    } else {
      navigate("/simulado", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  // ── Loading ─────────────────────────────────────────────────────
  if (state === "loading" || (state === "idle" && isPro)) {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-2 w-full" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-20 w-full rounded-xl" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Result ──────────────────────────────────────────────────────
  if (state === "result" && result) {
    const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    const areaEntries = Object.entries(result.byArea).sort(([a], [b]) => a.localeCompare(b));

    return (
      <MainLayout>
        <div className="container max-w-lg mx-auto px-4 py-12">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                <FileText className="h-3 w-3" />
                Simulado ENEM {result.year} · Dia {result.day}
              </div>
              <p className="text-6xl font-black tracking-tight text-foreground">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">
                {result.correct} de {result.total} questões corretas
              </p>
            </div>

            <div className="space-y-3">
              {areaEntries.map(([area, score]) => {
                const acc = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
                return (
                  <div key={area} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{AREA_LABELS[area] ?? area}</span>
                      <span className="font-medium text-foreground tabular-nums">
                        {score.correct}/{score.total} · {acc}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-foreground transition-all"
                        style={{ width: `${acc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>⏱ {result.durationMinutes} min</span>
            </div>

            <div className="space-y-2">
              <Button className="w-full" onClick={() => navigate("/errors")}>
                Ver mapa de pontos fracos
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate("/simulado")}>
                Voltar aos simulados
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Active ──────────────────────────────────────────────────────
  if (state !== "active" || !currentQuestion) {
    return null;
  }

  const currentAnswer = answers[currentIndex];
  const alternatives = currentQuestion.alternatives as {
    letter: string;
    text: string;
    image_url?: string | null;
  }[];
  const allImages = currentQuestion.images || [];
  const ALT_LETTERS = ["A", "B", "C", "D", "E"];
  const statementImages = allImages.filter(
    (img: any) => !img.caption || !ALT_LETTERS.includes(img.caption.trim().toUpperCase()),
  );
  const altImageMap = new Map<string, any[]>();
  allImages.forEach((img: any) => {
    if (img.caption && ALT_LETTERS.includes(img.caption.trim().toUpperCase())) {
      const letter = img.caption.trim().toUpperCase();
      if (!altImageMap.has(letter)) altImageMap.set(letter, []);
      altImageMap.get(letter)!.push(img);
    }
  });

  const progressPct = totalQuestions > 0 ? ((currentIndex + (showFeedback ? 1 : 0)) / totalQuestions) * 100 : 0;

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-4 pb-24">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {currentIndex + 1}/{totalQuestions}
              </span>
              <Badge variant="outline" className="gap-1 text-xs">
                <FileText className="h-3 w-3" />
                Simulado · Dia {currentQuestion.day}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {pdfAvailable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground"
                  onClick={openPdf}
                  disabled={pdfLoading}
                >
                  <FileText className="h-3.5 w-3.5" />
                  PDF
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={() => {
                  pauseSimulado();
                  navigate("/simulado");
                }}
                title="Pausar simulado"
              >
                <Pause className="h-3.5 w-3.5" />
                Pausar
              </Button>
            </div>
          </div>

          <Progress value={progressPct} className="h-1" />

          {/* Question card */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">Q{currentQuestion.number}</span>
                <span className="w-px h-3 bg-border" />
                <span>ENEM {currentQuestion.year}</span>
                <span className="w-px h-3 bg-border" />
                <span>{AREA_LABELS[currentQuestion.area] ?? currentQuestion.area}</span>
              </div>

              <InlineStatementRenderer
                statement={currentQuestion.statement || ""}
                images={statementImages}
                questionNumber={currentQuestion.number}
              />

              {hasKnowledgeCapsules && !showFeedback && (
                <PreConceptBlock pedagogy={pedagogy} loading={pedagogyLoading} />
              )}

              <div className="space-y-2">
                {alternatives.map((alt) => {
                  const altImages = altImageMap.get(alt.letter) || [];
                  const hasAltImage = altImages.length > 0 || (alt as any).image_url;

                  let stateClass = "border-border hover:bg-muted/50 cursor-pointer";
                  if (showFeedback) {
                    stateClass = "cursor-default border-border";
                    if (alt.letter === currentQuestion.correct_answer) {
                      stateClass = "border-green-500 bg-green-500/10 cursor-default";
                    } else if (currentAnswer?.selected === alt.letter && !currentAnswer.correct) {
                      stateClass = "border-red-500 bg-red-500/10 cursor-default";
                    }
                  } else if (currentAnswer?.selected === alt.letter) {
                    stateClass = "border-foreground bg-foreground/5";
                  }

                  return (
                    <button
                      key={alt.letter}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${stateClass}`}
                      onClick={() => !showFeedback && submitAnswer(alt.letter)}
                      disabled={showFeedback}
                    >
                      <span className="text-xs font-semibold shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground">
                        {alt.letter}
                      </span>
                      <span className={`text-sm flex-1 ${hasAltImage ? "flex items-center gap-2" : ""}`}>
                        {alt.text && <span>{alt.text}</span>}
                        {(alt as any).image_url && (
                          <img
                            src={(alt as any).image_url}
                            alt={`Alternativa ${alt.letter}`}
                            className="max-h-20 max-w-[180px] rounded border object-contain bg-muted/10"
                            loading="lazy"
                          />
                        )}
                        {altImages.map((img: any, idx: number) => (
                          <img
                            key={idx}
                            src={img.url}
                            alt={`Alternativa ${alt.letter}`}
                            className="max-h-20 max-w-[180px] rounded border object-contain bg-muted/10"
                            loading="lazy"
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>

              {showFeedback && currentQuestion.explanation && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Justificativa</span>
                  </div>
                  <div className="p-4">
                    <MarkdownText
                      content={currentQuestion.explanation}
                      className="text-sm text-muted-foreground leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {!showFeedback ? (
              <Button variant="outline" className="flex-1" onClick={() => submitAnswer(null)}>
                Não sei
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => finishSimulado()}
                >
                  Encerrar
                </Button>
                <Button className="flex-1" onClick={nextQuestion}>
                  {currentIndex + 1 >= totalQuestions ? "Ver resultado" : "Próxima"}
                  {currentIndex + 1 < totalQuestions && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SimuladoSession;
