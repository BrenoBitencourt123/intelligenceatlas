import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, BookOpen, PenLine, Brain, Flame, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
"@/components/ui/accordion";

/* ─── Config ─── */
const VAGAS_TOTAL = 20;
const VIDEO_DURATION = 60;
const REVEAL_AT_PERCENT = 0.75;
const AMBER = "hsl(25, 95%, 53%)";
const AMBER_BG = "hsl(25, 95%, 53% / 0.1)";
const GREEN = "hsl(142, 71%, 45%)";
const GREEN_DARK = "hsl(142, 76%, 36%)";

/* ─── Floating Badge Component ─── */
const FloatingBadge = ({ 
  children, 
  rotate = 0, 
  className = "",
  style = {}
}: { 
  children: React.ReactNode; 
  rotate?: number; 
  className?: string;
  style?: React.CSSProperties;
}) => (
  <motion.span
    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg whitespace-nowrap ${className}`}
    style={{ 
      background: `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})`,
      transform: `rotate(${rotate}deg)`,
      boxShadow: `0 4px 14px ${GREEN}40`,
      ...style
    }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
  >
    {children}
  </motion.span>
);

/* ─── Data ─── */
const FEATURES = [
{
  icon: BookOpen,
  title: "Questões Objetivas Inteligentes",
  desc: "Resolva +2.000 questões reais do ENEM com correção instantânea e análise de desempenho por competência."
},
{
  icon: PenLine,
  title: "Redação com IA",
  desc: "Escreva sua redação e receba análise detalhada por competência + uma versão nota 1.000 para comparação."
},
{
  icon: Brain,
  title: "Flashcards com Revisão Espaçada",
  desc: "Memorize conteúdos com flashcards inteligentes que se adaptam ao seu ritmo de aprendizado."
}];


const BENEFITS = [
"50% de desconto vitalício",
"Acesso antecipado a novos recursos",
"Canal direto com os desenvolvedores",
"Todas as funcionalidades premium",
"+2.000 questões reais do ENEM",
"Correção de redação com IA"];


const FAQ_ITEMS = [
{
  q: "O que é o programa de membros fundadores?",
  a: "É uma oferta limitada a 20 vagas com 50% de desconto vitalício para os primeiros apoiadores do Atlas. Você paga metade do preço — para sempre."
},
{
  q: "O desconto é realmente vitalício?",
  a: "Sim! Sua assinatura sempre terá o desconto de fundador. O valor nunca aumenta para fundadores."
},
{
  q: "Quantas vagas restam?",
  a: ""
},
{
  q: "Posso cancelar a qualquer momento?",
  a: "Sim, sem multa ou fidelidade, você pode cancelar a qualquer momento."
},
{
  q: "O Atlas já está funcionando?",
  a: "Sim! O Atlas já conta com questões objetivas, redação com IA, flashcards e plano de estudo personalizado. Novos recursos são lançados semanalmente."
}];


/* ─── Component ─── */
export default function Founders() {
  const navigate = useNavigate();

  const [vagasRestantes, setVagasRestantes] = useState(VAGAS_TOTAL);
  const [slotsLoaded, setSlotsLoaded] = useState(false);

  useEffect(() => {
    supabase.functions.invoke("founders-slots").then(({ data, error }) => {
      if (!error && data?.remaining != null) {
        setVagasRestantes(data.remaining);
      }
      setSlotsLoaded(true);
    });
  }, []);

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
      if (pct >= REVEAL_AT_PERCENT && !revealed) setRevealed(true);
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

  const vagasPreenchidas = VAGAS_TOTAL - vagasRestantes;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─── Animated Urgency Ticker ─── */}
      <div className="relative overflow-hidden border-b py-4" style={{ background: AMBER }}>
        <motion.div
          className="flex whitespace-nowrap gap-12 text-base font-bold uppercase tracking-wide text-white"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
          
          {Array.from({ length: 16 }).map((_, i) =>
          <span key={i} className="flex items-center gap-2">
              🔥 APENAS {vagasRestantes} VAGAS RESTANTES
            </span>
          )}
        </motion.div>
      </div>

      {/* ─── Hero ─── */}
      <main className="flex-1 px-5 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto w-full space-y-6">

          {/* Floating badges - scattered */}
          <div className="relative">
            {/* Top-right badge */}
            <div className="flex justify-end pr-2 sm:pr-8 -mb-2">
              <FloatingBadge rotate={3}>
                🎯 DESCONTO DE <span className="text-base font-extrabold ml-1">50% OFF</span>
              </FloatingBadge>
            </div>
          </div>

          {/* Left-leaning badge */}
          <div className="flex justify-start pl-2 sm:pl-4 -mb-3">
            <FloatingBadge rotate={-2}>
              ✨ Vagas limitadas para membros fundadores
            </FloatingBadge>
          </div>

          {/* Headline */}
          <motion.h1
            className="text-center text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-[1.15] text-foreground"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}>
            
            O jeito mais inteligente de estudar para o ENEM.
          </motion.h1>



          {/* Headline */}
          <motion.h1
            className="text-center text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-[1.15] text-foreground"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}>
            
            Restam{" "}
            <span
              className="relative inline-block px-2 py-0.5 rounded-md"
              style={{ color: AMBER, background: AMBER_BG }}>
              
              {vagasRestantes} vagas
            </span>{" "}
            para os primeiros membros fundadores do Atlas
          </motion.h1>

          {/* Sub-headline with floating badge */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}>
            <p className="text-center text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              <FloatingBadge rotate={-3} className="mr-1 -mt-1 align-middle text-[11px]">
                ✅ VITALÍCIO
              </FloatingBadge>
              {" "}A IA analisa seu desempenho nas próprias questões do ENEM e mostra exatamente o que estudar para alcançar{" "}
              <span className="font-semibold text-foreground">900+ pontos</span>.
            </p>
            <p className="text-center text-sm text-muted-foreground mt-3">
              Os primeiros membros fundadores recebem <span className="font-semibold text-foreground">50% de desconto vitalício</span>.
            </p>
          </motion.div>

          {/* Video placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}>
            <div
              className="relative aspect-video rounded-2xl border bg-card shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group"
              onClick={handlePlay}>
              <div className="absolute inset-0 bg-foreground/[0.02] group-hover:bg-foreground/[0.04] transition-colors" />
              <AnimatePresence>
                {!isPlaying && progress === 0 &&
                <motion.div
                  className="text-center space-y-3 relative z-10"
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}>
                  
                    <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-105 transition-transform"
                    style={{ background: AMBER }}>
                    
                      <svg className="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Veja como o Atlas funciona
                    </p>
                  </motion.div>
                }
              </AnimatePresence>
              {isPlaying &&
              <div className="relative z-10 text-center space-y-2">
                  <div
                  className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto"
                  style={{ borderColor: AMBER, borderTopColor: "transparent" }} />
                
                  <p className="text-xs text-muted-foreground">Reproduzindo vídeo...</p>
                </div>
              }
              {(isPlaying || progress > 0) &&
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
                  <motion.div
                  className="h-full"
                  style={{ width: `${progress * 100}%`, background: AMBER }}
                  transition={{ duration: 0.2 }} />
                
                </div>
              }
            </div>
          </motion.div>

          {/* CTA below video */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}>
            
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.98] border-0"
              style={{ background: AMBER }}
              onClick={() => navigate("/fundadores/cadastro")}>
              
              Garantir minha vaga
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          {/* ─── Scattered micro-badges ─── */}
          <div className="relative py-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <FloatingBadge rotate={-2} className="text-[11px]">
                📚 Questões reais do ENEM
              </FloatingBadge>
              <FloatingBadge rotate={2} className="text-[11px]">
                📝 Plano de estudo inteligente
              </FloatingBadge>
              <FloatingBadge rotate={-1} className="text-[11px]">
                📊 Análise de desempenho
              </FloatingBadge>
            </div>
          </div>

          {/* ─── Sections with separator badges ─── */}
          <motion.div
            className="space-y-16 pt-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}>
            
            {/* Features */}
            <section className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                Tudo que você precisa para o ENEM
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {FEATURES.map((f, i) =>
                <motion.div
                  key={f.title}
                  className="rounded-2xl border bg-card p-5 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}>
                  
                    <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: AMBER_BG }}>
                    
                      <f.icon className="w-5 h-5" style={{ color: AMBER }} />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </motion.div>
                )}
              </div>
            </section>

            {/* ─── Separator badge: urgency ─── */}
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border shadow-sm animate-pulse"
                style={{ borderColor: AMBER, color: AMBER, background: AMBER_BG }}>
                
                🔥 VAGAS ACABANDO — apenas {vagasRestantes} restantes
              </span>
            </div>

            {/* Benefits checklist */}
            <section className="space-y-5 max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                O que você recebe
              </h2>
              <ul className="space-y-3">
                {BENEFITS.map((b) =>
                <li key={b} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: AMBER }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    {b}
                  </li>
                )}
              </ul>
            </section>

            {/* ─── Separator badge: guarantee ─── */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-border bg-secondary/50 text-muted-foreground">
                <Check className="w-4 h-4 text-emerald-500" />
                Cancele quando quiser — sem multa
              </span>
            </div>

            {/* FAQ */}
            <section className="space-y-6 max-w-2xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                Perguntas frequentes
              </h2>
              <Accordion type="single" collapsible className="space-y-2">
                {FAQ_ITEMS.map((item, i) => {
                  const answer = i === 2 ?
                  `Atualmente restam ${vagasRestantes} de ${VAGAS_TOTAL} vagas. Quando acabarem, o preço será o valor cheio de R$49,90/mês.` :
                  item.a;
                  return (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="rounded-xl border bg-card px-5">
                      
                      <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4 text-left">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        {answer}
                      </AccordionContent>
                    </AccordionItem>);

                })}
              </Accordion>
            </section>

            {/* ─── Final CTA with badge ─── */}
            <section className="text-center space-y-4 pb-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                style={{ borderColor: AMBER, color: AMBER, background: AMBER_BG }}>
                
                <Flame className="w-3.5 h-3.5" />
                50% OFF — oferta de fundador
              </span>
              <div>
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.98] border-0"
                  style={{ background: AMBER }}
                  onClick={() => navigate("/fundadores/cadastro")}>
                  
                  Garantir minha vaga
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </section>
          </motion.div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="py-8 text-center border-t">
        <p className="text-sm text-muted-foreground">
          Intelligence Atlas © {new Date().getFullYear()}
        </p>
      </footer>
    </div>);

}