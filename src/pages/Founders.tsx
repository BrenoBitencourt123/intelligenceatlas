import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ─── Slots hook (real from Stripe) ─── */
function useFounderSlots() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.functions
      .invoke("founders-slots")
      .then(({ data, error }) => {
        if (!error && data?.remaining != null) setRemaining(data.remaining);
        else setRemaining(20);
      })
      .catch(() => setRemaining(20))
      .finally(() => setLoading(false));
  }, []);

  return { remaining, loading };
}

const CHECKS = [
  "+2000 questões reais do ENEM",
  "Plano de estudo inteligente",
  "Correção estruturada de redação",
];

/* Simulated video duration in seconds — replace when real video is added */
const VIDEO_DURATION = 60;
const REVEAL_AT_PERCENT = 0.75; // reveal content at 75% of video

export default function Founders() {
  const navigate = useNavigate();
  const { remaining, loading: slotsLoading } = useFounderSlots();

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePlay = () => {
    if (isPlaying) return;
    setIsPlaying(true);

    const startTime = Date.now() - progress * VIDEO_DURATION * 1000;
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min(elapsed / VIDEO_DURATION, 1);
      setProgress(pct);

      if (pct >= REVEAL_AT_PERCENT && !revealed) {
        setRevealed(true);
      }
      if (pct >= 1 && intervalRef.current) {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
      }
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-3xl mx-auto w-full">
        <span className="font-bold text-lg tracking-tight text-foreground">
          Atlas
        </span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full font-medium"
          onClick={() => navigate("/login")}
        >
          Entrar
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center px-6 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto w-full space-y-8">

          {/* Eyebrow — always visible */}
          <motion.p
            className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Treine com as próprias provas do ENEM
          </motion.p>

          {/* Headline — always visible */}
          <motion.h1
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-[1.12] text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            O jeito mais inteligente de estudar para o ENEM.
          </motion.h1>

          {/* Video — always visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div
              className="relative aspect-video rounded-2xl border bg-card shadow-card overflow-hidden flex items-center justify-center cursor-pointer group"
              onClick={handlePlay}
            >
              <div className="absolute inset-0 bg-foreground/[0.02] group-hover:bg-foreground/[0.04] transition-colors" />

              {/* Play button — hide when playing */}
              <AnimatePresence>
                {!isPlaying && progress === 0 && (
                  <motion.div
                    className="text-center space-y-3 relative z-10"
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-[hsl(142,71%,45%)] flex items-center justify-center mx-auto shadow-lg group-hover:scale-105 transition-transform">
                      <svg className="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Veja como o Atlas funciona
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Simulated "playing" state */}
              {isPlaying && (
                <div className="relative z-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full border-2 border-[hsl(142,71%,45%)] border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground">Reproduzindo vídeo...</p>
                </div>
              )}

              {/* Progress bar */}
              {(isPlaying || progress > 0) && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
                  <motion.div
                    className="h-full bg-[hsl(142,71%,45%)]"
                    style={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Revealed content — appears at 75% of video */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                className="space-y-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {/* Description */}
                <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-xl">
                  O Atlas analisa seu desempenho nas questões do ENEM e mostra exatamente o que estudar para alcançar{" "}
                  <span className="font-semibold text-foreground">900+ pontos</span>.
                </p>

                {/* Discount */}
                <p className="text-base sm:text-lg font-semibold text-[hsl(142,71%,45%)]">
                  🔥 50%OFF para sempre aos membros fundadores!
                </p>

                {/* CTA */}
                <div>
                  <Button
                    size="lg"
                    className="w-full h-14 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.98] bg-[hsl(142,71%,45%)] border-0"
                    onClick={() => navigate("/fundadores/cadastro")}
                  >
                    Começar agora
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  {!slotsLoading && remaining !== null && (
                    <p className="text-sm text-muted-foreground mt-3 text-center">
                      🔥 Restam apenas <span className="font-bold text-foreground">{remaining} vagas</span>
                    </p>
                  )}
                </div>

                {/* Checkmarks */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                  {CHECKS.map((text, i) => (
                    <motion.div
                      key={text}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-[hsl(142,71%,45%)] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-muted-foreground">{text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t">
        <p className="text-sm text-muted-foreground">
          Intelligence Atlas © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
