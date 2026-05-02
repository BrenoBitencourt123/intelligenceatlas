import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Crown, Lock, RotateCcw } from "lucide-react";
import { useSimuladoAvailability } from "@/hooks/useSimuladoAvailability";
import { useSimuladoSession } from "@/hooks/useSimuladoSession";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";

const DAY_LABELS: Record<1 | 2, { title: string; areas: string }> = {
  1: { title: "Dia 1", areas: "Linguagens + Humanas" },
  2: { title: "Dia 2", areas: "Natureza + Matemática" },
};

const Simulado = () => {
  const navigate = useNavigate();
  const { rows, loading, MIN_QUESTIONS_PER_DAY } = useSimuladoAvailability();
  const { hasSaved, savedMeta, discardSavedSimulado } = useSimuladoSession();
  const { isPro } = usePlanFeatures();

  const handlePick = (year: number, day: 1 | 2) => {
    if (!isPro) {
      navigate("/plano");
      return;
    }
    // Always discard any saved session and start fresh
    if (hasSaved) {
      discardSavedSimulado();
    }
    navigate(`/simulado/sessao?year=${year}&day=${day}`);
  };

  const handleRestart = () => {
    if (!savedMeta) return;
    if (!window.confirm("Descartar progresso e recomeçar do zero?")) return;
    discardSavedSimulado();
    navigate(`/simulado/sessao?year=${savedMeta.year}&day=${savedMeta.day}`);
  };

  const handleResume = () => {
    if (!savedMeta) return;
    navigate(`/simulado/sessao?year=${savedMeta.year}&day=${savedMeta.day}&resume=1`);
  };

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8 pb-24 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold text-foreground">Simulado ENEM</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um ano e o dia da prova. 90 questões na ordem original.
            </p>
          </div>
        </div>

        {!isPro && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
            <Crown className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div>
                <p className="text-sm font-semibold text-foreground">Simulado é um recurso Pro</p>
                <p className="text-xs text-muted-foreground">
                  No Pro você faz qualquer prova do ENEM, com pausa, retomada e resultado por área.
                </p>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => navigate("/plano")}>
                <Crown className="h-3.5 w-3.5" />
                Ver plano Pro
              </Button>
            </div>
          </div>
        )}

        {hasSaved && savedMeta && isPro && (
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                Em andamento
              </p>
              <p className="text-sm font-semibold text-foreground">
                ENEM {savedMeta.year} · Dia {savedMeta.day}
              </p>
              <p className="text-xs text-muted-foreground">
                {savedMeta.currentIndex + 1}/{savedMeta.total} questões
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground"
                onClick={handleRestart}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Recomeçar
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handleResume}>
                Continuar
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Ainda não há simulados disponíveis no banco.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.year} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-foreground">ENEM {row.year}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([1, 2] as const).map((day) => {
                    const count = day === 1 ? row.day1 : row.day2;
                    const enoughQuestions = count >= MIN_QUESTIONS_PER_DAY;
                    const enabled = enoughQuestions; // visual gating happens via Pro check on click
                    const label = DAY_LABELS[day];
                    return (
                      <button
                        key={day}
                        onClick={() => enabled && handlePick(row.year, day)}
                        disabled={!enabled}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          enabled
                            ? "border-border hover:bg-muted/50 cursor-pointer"
                            : "border-border bg-muted/20 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            {label.title}
                          </span>
                          {!isPro && enabled && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{label.areas}</p>
                        <p className="text-[11px] text-muted-foreground mt-2 tabular-nums">
                          {enoughQuestions ? `${count} questões` : `${count}/90 — em breve`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Simulado;
