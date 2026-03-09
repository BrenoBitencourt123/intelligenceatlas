import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useMotionValueEvent, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Check,
  ArrowRight,
  BookOpen,
  PenLine,
  Brain,
  ChevronDown } from
"lucide-react";
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

/* ─── Data ─── */
const PILLARS = [
{
  num: "01",
  icon: BookOpen,
  title: "Questões inteligentes",
  desc: "Resolva questões reais do ENEM e o sistema identifica seus pontos fracos para focar onde você mais precisa."
},
{
  num: "02",
  icon: PenLine,
  title: "Redação com IA",
  desc: "Receba análise por competência e uma versão nota 1.000 baseada no seu próprio raciocínio."
},
{
  num: "03",
  icon: Brain,
  title: "Flashcards espaçados",
  desc: "Memorize conteúdos com revisão inteligente que se adapta ao seu ritmo de aprendizado."
}];


const FOUNDER_BENEFITS = [
"50% de desconto — para sempre",
"Acesso antecipado a cada novo recurso",
"Canal direto com os desenvolvedores",
"Todas as funcionalidades premium desde o dia 1",
"Influência nas próximas features do produto"];


const FAQ_ITEMS = [
{
  q: "O que é o programa de membros fundadores?",
  a: "É uma oferta limitada a 20 vagas com 50% de desconto vitalício para os primeiros apoiadores do Atlas. Você paga metade do preço — para sempre."
},
{
  q: "O desconto é realmente vitalício?",
  a: "Sim! Sua assinatura sempre terá o desconto de fundador, independente de reajustes futuros."
},
{
  q: "Quantas vagas restam?",
  a: ""
},
{
  q: "Posso cancelar a qualquer momento?",
  a: "Sim, sem multa ou fidelidade. Cancele quando quiser."
},
{
  q: "O Atlas já está funcionando?",
  a: "Sim! O Atlas já conta com questões objetivas, redação com IA, flashcards e plano de estudo personalizado. Novos recursos são lançados semanalmente."
}];


/* ─── Animation ─── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 }
  })
};

/* ─── Component ─── */
export default function Founders() {
  const navigate = useNavigate();
  const [vagasRestantes, setVagasRestantes] = useState(VAGAS_TOTAL);
  const [showNavCTA, setShowNavCTA] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowNavCTA(latest > 400);
    setScrollProgress(Math.min(latest / 150, 1));
  });

  useEffect(() => {
    supabase.functions.invoke("founders-slots").then(({ data, error }) => {
      if (!error && data?.remaining != null) {
        setVagasRestantes(data.remaining);
      }
    });
  }, []);

  const vagasPreenchidas = VAGAS_TOTAL - vagasRestantes;
  const progressPct = vagasPreenchidas / VAGAS_TOTAL * 100;
  const handleCTA = () => navigate("/fundadores/cadastro");

  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory bg-background text-foreground scroll-smooth">
      {/* ─── Sticky Navbar ─── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}>
        
        {/* Header unificado */}
        <div className="bg-foreground text-background">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-14 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <img src="/icon-192.png" alt="Atlas" className="h-5 w-5 brightness-0 invert" />
              <span className="text-sm font-bold tracking-tight">Atlas</span>
            </div>

            {/* Urgência centralizada */}
            {vagasRestantes > 0 && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
                </span>
                <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase truncate">
                  🔥 Apenas {vagasRestantes} {vagasRestantes === 1 ? "vaga restante" : "vagas restantes"} — 50% off para sempre
                </span>
              </div>
            )}

            {/* CTA (aparece no scroll) */}
            <motion.div
              className="shrink-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: showNavCTA ? 1 : 0,
                scale: showNavCTA ? 1 : 0.9,
                pointerEvents: showNavCTA ? "auto" as const : "none" as const
              }}
              transition={{ duration: 0.2 }}>
              <Button
                size="sm"
                className="rounded-full bg-background text-foreground hover:bg-background/90 font-semibold text-xs px-4"
                onClick={handleCTA}>
                Garantir vaga
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ─── Hero ─── */}
      <section
        ref={heroRef}
        className="snap-start relative min-h-screen flex items-start sm:items-center justify-center px-5 pt-24 pb-24 sm:pt-0 sm:pb-0">
        
        <div className="max-w-2xl mx-auto text-center space-y-4 sm:space-y-8">

          {/* Eyebrow */}
          <motion.p
            className="text-xs sm:text-sm font-medium tracking-[0.15em] uppercase text-muted-foreground leading-relaxed"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}>
            Inteligência Atlas
            <br />
            Lançamento exclusivo
          </motion.p>

          {/* Headline */}
          <motion.h1
            className="text-[clamp(1.95rem,8.5vw,2.2rem)] sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}>
            
            <span className="text-foreground">Seja um dos 20</span>
            <br />
            <span className="text-muted-foreground whitespace-nowrap">Membros&nbsp;Fundadores</span>
          </motion.h1>

          {/* Oferta em destaque */}
          <motion.p
            className="text-[1.35rem] sm:text-3xl lg:text-4xl font-bold text-foreground whitespace-nowrap"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}>
            
            50% de desconto — para sempre.</motion.p>

          {/* Explicação do produto */}
          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-[16rem] sm:max-w-md mx-auto leading-relaxed"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}>
            
            Um sistema que adapta o estudo às suas fraquezas — questões,
            redação e revisão, tudo com IA.
          </motion.p>

          {/* CTA — Melhoria #2: progress bar separada */}
          <motion.div
            className="flex flex-col items-center gap-3"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}>
            
            <Button
              size="lg"
              className="h-12 px-8 text-base sm:h-14 sm:px-10 sm:text-lg font-bold rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-lg active:scale-[0.98] transition-transform"
              onClick={handleCTA}>
              
              Garantir minha vaga
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            {/* Mini progress bar */}
            {vagasRestantes > 0 && (
              <div className="w-48 sm:w-56 space-y-1.5 mt-1">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-foreground rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  <span className="font-semibold text-foreground">{vagasPreenchidas}</span> de {VAGAS_TOTAL} vagas preenchidas
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Cancele quando quiser · Sem fidelidade
            </p>
          </motion.div>
        </div>

        {/* ─── Scroll Indicator ─── */}
        <motion.div
          className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 sm:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 - scrollProgress }}
          transition={{ duration: 0.3 }}
          style={{ pointerEvents: scrollProgress > 0.5 ? "none" : "auto" }}>
          
          <span className="text-sm sm:text-base text-muted-foreground font-medium">
            Arraste para baixo
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}>
            
            <ChevronDown className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Como funciona — Melhoria #3: Stepper vertical mobile ─── */}
      <section className="snap-start min-h-screen flex flex-col justify-center px-5 py-10 sm:py-28">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-14"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}>
            
            Como o Atlas funciona
          </motion.h2>

          {/* Desktop: grid normal */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-6">
            {PILLARS.map((p, i) =>
            <motion.div
              key={p.num}
              className="space-y-4"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}>
              
                <span className="text-xs font-mono font-bold text-muted-foreground/50 tracking-widest">
                  {p.num}
                </span>
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center">
                  <p.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.desc}
                </p>
              </motion.div>
            )}
          </div>

          {/* Mobile: stepper vertical */}
          <div className="sm:hidden relative">
            {/* Linha vertical do stepper */}
            <div className="absolute left-[18px] top-4 bottom-4 w-px bg-border" />

            <div className="space-y-6">
              {PILLARS.map((p, i) => (
                <motion.div
                  key={p.num}
                  className="relative flex gap-4"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}>
                  
                  {/* Ícone no eixo do stepper */}
                  <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                    <p.icon className="w-5 h-5 text-foreground" />
                  </div>

                  {/* Conteúdo */}
                  <div className="pt-1 space-y-1 pb-2">
                    <span className="text-xs font-mono font-bold text-muted-foreground/50 tracking-widest">
                      {p.num}
                    </span>
                    <h3 className="font-semibold text-foreground text-base">
                      {p.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Por que ser fundador — Dark section — Melhoria #4: primeiro benefício destacado ─── */}
      <section className="snap-start min-h-screen flex flex-col justify-center bg-foreground text-background px-5 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto space-y-12">
          <motion.div
            className="space-y-4 text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}>
            
            <h2 className="text-2xl sm:text-3xl font-bold">
              Por que ser um dos 20?
            </h2>
            <p className="text-background/60 max-w-md mx-auto">
              Membros fundadores recebem benefícios exclusivos que nunca mais
              serão oferecidos.
            </p>
          </motion.div>

          {/* Benefício principal destacado */}
          <motion.div
            className="max-w-md mx-auto"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}>
            <div className="rounded-2xl border border-background/20 bg-background/10 px-5 py-4 text-center">
              <p className="text-lg sm:text-xl font-bold text-background">
                {FOUNDER_BENEFITS[0]}
              </p>
            </div>
          </motion.div>

          {/* Demais benefícios */}
          <motion.ul
            className="space-y-3 max-w-md mx-auto"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}>
            
            {FOUNDER_BENEFITS.slice(1).map((b) =>
            <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-background/15 flex items-center justify-center">
                  <Check className="w-3 h-3 text-background" />
                </span>
                <span className="text-background/90 font-medium text-sm sm:text-base">
                  {b}
                </span>
              </li>
            )}
          </motion.ul>

          {/* Progress */}
          <motion.div
            className="max-w-sm mx-auto space-y-3"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={3}>
            
            <div className="flex justify-between text-sm font-medium">
              <span className="text-background/50">Vagas preenchidas</span>
              <span className="text-background font-bold">
                {vagasPreenchidas}/{VAGAS_TOTAL}
              </span>
            </div>
            <div className="h-2.5 bg-background/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-background rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: `${progressPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }} />
              
            </div>
            <p className="text-center text-xs text-background/40">
              {vagasRestantes > 0 ?
              `Restam ${vagasRestantes} vagas com desconto de fundador` :
              "Esgotado"}
            </p>
          </motion.div>

          {/* CTA inside dark */}
          <motion.div
            className="text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={4}>
            
            <Button
              size="lg"
              className="h-14 px-10 text-lg font-bold rounded-full bg-background text-foreground hover:bg-background/90 shadow-lg active:scale-[0.98] transition-transform"
              onClick={handleCTA}>
              
              Garantir minha vaga
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="snap-start min-h-screen flex flex-col justify-center px-5 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto space-y-10">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}>
            
            Perguntas frequentes
          </motion.h2>

          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item, i) => {
              const answer =
              i === 2 ?
              `Atualmente restam ${vagasRestantes} de ${VAGAS_TOTAL} vagas. Quando acabarem, o preço será o valor cheio sem desconto.` :
              item.a;
              return (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-xl border border-border bg-card px-5">
                  
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4 text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    {answer}
                  </AccordionContent>
                </AccordionItem>);

            })}
          </Accordion>
        </div>
      </section>

      {/* ─── CTA Final — Melhoria #5: headline forte + barra de vagas ─── */}
      <section className="snap-start min-h-screen flex flex-col justify-center px-5 pb-20">
        <motion.div
          className="max-w-lg mx-auto text-center space-y-6"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}>
          
          <h2 className="text-2xl sm:text-3xl font-bold">
            Últimas vagas com 50% off
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
            Depois das 20 vagas, o preço volta ao normal. Garanta seu lugar agora e pague metade — para sempre.
          </p>

          {/* Re-exibir badge + progress */}
          {vagasRestantes > 0 && (
            <div className="flex flex-col items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                {vagasRestantes} {vagasRestantes === 1 ? "vaga restante" : "vagas restantes"}
              </span>
              <div className="w-48 space-y-1.5">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-foreground rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${progressPct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{vagasPreenchidas}</span> de {VAGAS_TOTAL} preenchidas
                </p>
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="h-14 px-10 text-lg font-bold rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-lg active:scale-[0.98] transition-transform"
            onClick={handleCTA}>
            
            Garantir minha vaga
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* ─── Footer — Melhoria #6: links de confiança ─── */}
      <footer className="py-8 text-center border-t border-border space-y-2">
        <p className="text-xs text-muted-foreground">
          Inteligência Atlas © {new Date().getFullYear()}
        </p>
        <div className="flex justify-center gap-4">
          <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Termos de uso
          </a>
          <span className="text-xs text-muted-foreground">·</span>
          <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Política de privacidade
          </a>
        </div>
      </footer>
    </div>);

}
