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
import { Progress } from "@/components/ui/progress";
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
    // Fade out scroll indicator as user scrolls (0 to 150px)
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
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}>
        
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="Atlas" className="h-6 w-6" />
            <span className="text-base font-bold tracking-tight text-foreground">
              Atlas
            </span>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: showNavCTA ? 1 : 0,
              scale: showNavCTA ? 1 : 0.9,
              pointerEvents: showNavCTA ? "auto" as const : "none" as const
            }}
            transition={{ duration: 0.2 }}>
            
            <Button
              size="sm"
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs px-4"
              onClick={handleCTA}>
              
              Garantir vaga
            </Button>
          </motion.div>
        </div>
      </motion.nav>

      {/* ─── Hero ─── */}
      <section
        ref={heroRef}
        className="snap-start relative min-h-screen flex items-start sm:items-center justify-center px-5 pt-28 pb-24 sm:pt-0 sm:pb-0">
        
        <div className="max-w-2xl mx-auto text-center space-y-5 sm:space-y-8">
          {/* Eyebrow */}
          <motion.p
            className="text-xs sm:text-sm font-medium tracking-[0.15em] uppercase text-muted-foreground leading-relaxed"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}>
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
            custom={1}>
            
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
            custom={2}>
            
            50% de desconto — para sempre.</motion.p>

          {/* Explicação do produto */}
          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-[16rem] sm:max-w-md mx-auto leading-relaxed"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}>
            
            Um sistema que adapta o estudo às suas fraquezas — questões,
            redação e revisão, tudo com IA.
          </motion.p>

          {/* CTA */}
          <motion.div
            className="flex flex-col items-center gap-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}>
            
            <Button
              size="lg"
              className="h-12 px-8 text-base sm:h-14 sm:px-10 sm:text-lg font-bold rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-lg active:scale-[0.98] transition-transform"
              onClick={handleCTA}>
              
              Garantir minha vaga
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-1">
              {vagasRestantes > 0 ?
              <>
                  <span className="font-semibold text-foreground">
                    {vagasPreenchidas} de {VAGAS_TOTAL}
                  </span>{" "}
                  vagas preenchidas · Cancele quando quiser
                </> :

              "Todas as vagas foram preenchidas!"
              }
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

      {/* ─── Como funciona ─── */}
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

          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
            {PILLARS.map((p, i) =>
            <motion.div
              key={p.num}
              className="space-y-2 sm:space-y-4"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}>
              
                <span className="text-xs font-mono font-bold text-muted-foreground/50 tracking-widest">
                  {p.num}
                </span>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-secondary flex items-center justify-center">
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
        </div>
      </section>

      {/* ─── Por que ser fundador — Dark section ─── */}
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

          {/* Benefits */}
          <motion.ul
            className="space-y-4 max-w-md mx-auto"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}>
            
            {FOUNDER_BENEFITS.map((b) =>
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
            custom={2}>
            
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
            custom={3}>
            
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

      {/* ─── CTA Final ─── */}
      <section className="snap-start min-h-screen flex flex-col justify-center px-5 pb-20">
        <motion.div
          className="max-w-lg mx-auto text-center space-y-5"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}>
          
          <h2 className="text-xl sm:text-2xl font-bold">
            Pronto para estudar de forma inteligente?
          </h2>
          <p className="text-sm text-muted-foreground">
            Garanta seu lugar entre os 20 primeiros e pague metade — para
            sempre.
          </p>
          <Button
            size="lg"
            className="h-14 px-10 text-lg font-bold rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-lg active:scale-[0.98] transition-transform"
            onClick={handleCTA}>
            
            Garantir minha vaga
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 text-center border-t border-border">
        <p className="text-xs text-muted-foreground">
          Inteligência Atlas © {new Date().getFullYear()}
        </p>
      </footer>
    </div>);

}