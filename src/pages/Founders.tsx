import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, BookOpen, PenLine, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ─── Config ─── */
const VAGAS_TOTAL = 20;
const AMBER = "hsl(25, 95%, 53%)";
const AMBER_BG = "hsl(25, 95%, 53% / 0.35)";

/* ─── Data ─── */
const FEATURES = [
  {
    icon: BookOpen,
    title: "Questões Objetivas Inteligentes",
    desc: "Resolva +2.000 questões reais do ENEM com correção instantânea e análise de desempenho por competência.",
  },
  {
    icon: PenLine,
    title: "Redação com IA",
    desc: "Escreva sua redação e receba análise detalhada por competência + uma versão nota 1.000 para comparação.",
  },
  {
    icon: Brain,
    title: "Flashcards com Revisão Espaçada",
    desc: "Memorize conteúdos com flashcards inteligentes que se adaptam ao seu ritmo de aprendizado.",
  },
];

const BENEFITS = [
  "50% de desconto vitalício",
  "Acesso antecipado a novos recursos",
  "Canal direto com os desenvolvedores",
  "Todas as funcionalidades premium",
  "+2.000 questões reais do ENEM",
  "Correção de redação com IA",
];

const FAQ_ITEMS = [
  {
    q: "O que é o programa de membros fundadores?",
    a: "É uma oferta limitada a 20 vagas com 50% de desconto vitalício para os primeiros apoiadores do Atlas. Você paga metade do preço — para sempre.",
  },
  {
    q: "O desconto é realmente vitalício?",
    a: "Sim! Sua assinatura sempre terá o desconto de fundador. O valor nunca aumenta para fundadores.",
  },
  {
    q: "Quantas vagas restam?",
    a: "", // dynamic
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim, sem multa ou fidelidade, você pode cancelar a qualquer momento.",
  },
  {
    q: "O Atlas já está funcionando?",
    a: "Sim! O Atlas já conta com questões objetivas, redação com IA, flashcards e plano de estudo personalizado. Novos recursos são lançados semanalmente.",
  },
];

/* ─── Helpers ─── */
const stagger = (i: number) => ({ duration: 0.5, delay: 0.08 * i, ease: "easeOut" as const });

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

  const vagasPreenchidas = VAGAS_TOTAL - vagasRestantes;
  const progressPct = (vagasPreenchidas / VAGAS_TOTAL) * 100;

  const handleCTA = () => navigate("/fundadores/cadastro");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ─── Urgency Ticker ─── */}
      <div className="relative overflow-hidden bg-foreground py-2.5">
        <motion.div
          className="flex whitespace-nowrap gap-16 text-sm font-semibold uppercase tracking-widest text-background"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="flex items-center gap-2">
              ● Apenas {vagasRestantes} vagas restantes
            </span>
          ))}
        </motion.div>
      </div>

      {/* ─── Hero ─── */}
      <main className="flex-1">
        <section className="px-5 pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={stagger(0)}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium tracking-wide text-muted-foreground bg-card">
                Membros Fundadores · Oferta limitada
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={stagger(1)}
            >
              <span
                className="relative inline-block"
                style={{
                  color: AMBER,
                  backgroundImage: `linear-gradient(${AMBER_BG}, ${AMBER_BG})`,
                  backgroundPosition: "0 85%",
                  backgroundSize: "100% 35%",
                  backgroundRepeat: "no-repeat",
                }}
              >
                50% off
              </span>
              <br />
              <span className="text-foreground">Para sempre.</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={stagger(2)}
            >
              Os primeiros {VAGAS_TOTAL} membros pagam metade do preço — para sempre. Sem letras miúdas.
            </motion.p>

            {/* CTA */}
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={stagger(3)}
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg font-bold rounded-full text-white shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.98] border-0"
                  style={{ background: AMBER }}
                  onClick={handleCTA}
                >
                  Garantir minha vaga
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
              <p className="text-sm text-muted-foreground">
                Cancele quando quiser · Sem fidelidade
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─── Social Proof — Progress ─── */}
        <motion.section
          className="px-5 pb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(4)}
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground">Vagas preenchidas</span>
              <span style={{ color: AMBER }}>
                {vagasPreenchidas}/{VAGAS_TOTAL}
              </span>
            </div>
            <Progress value={progressPct} className="h-2.5 bg-secondary" />
            <p className="text-center text-xs text-muted-foreground">
              {vagasRestantes > 0
                ? `Restam ${vagasRestantes} vagas com desconto de fundador`
                : "Todas as vagas foram preenchidas!"}
            </p>
          </div>
        </motion.section>

        {/* ─── O que está incluso ─── */}
        <section className="px-5 pb-16">
          <div className="max-w-lg mx-auto space-y-6">
            <motion.h2
              className="text-2xl sm:text-3xl font-bold text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={stagger(0)}
            >
              O que está incluso
            </motion.h2>
            <ul className="space-y-4">
              {BENEFITS.map((b, i) => (
                <motion.li
                  key={b}
                  className="flex items-start gap-3 text-base"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={stagger(i)}
                >
                  <span
                    className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: AMBER_BG }}
                  >
                    <Check className="w-3 h-3" style={{ color: AMBER }} />
                  </span>
                  <span className="text-foreground font-medium">{b}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section className="px-5 pb-16">
          <div className="max-w-3xl mx-auto space-y-8">
            <motion.h2
              className="text-2xl sm:text-3xl font-bold text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={stagger(0)}
            >
              Tudo que você precisa para o ENEM
            </motion.h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="rounded-2xl border bg-card p-6 space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={stagger(i)}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: AMBER_BG }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: AMBER }} />
                  </div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="px-5 pb-16">
          <div className="max-w-2xl mx-auto space-y-8">
            <motion.h2
              className="text-2xl sm:text-3xl font-bold text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={stagger(0)}
            >
              Perguntas frequentes
            </motion.h2>
            <Accordion type="single" collapsible className="space-y-2">
              {FAQ_ITEMS.map((item, i) => {
                const answer =
                  i === 2
                    ? `Atualmente restam ${vagasRestantes} de ${VAGAS_TOTAL} vagas. Quando acabarem, o preço será o valor cheio de R$49,90/mês sem desconto.`
                    : item.a;
                return (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="rounded-xl border bg-card px-5"
                  >
                    <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4 text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-4">
                      {answer}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </section>

        {/* ─── CTA Final ─── */}
        <section className="px-5 pb-20">
          <motion.div
            className="max-w-lg mx-auto text-center space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={stagger(0)}
          >
            <h2 className="text-xl sm:text-2xl font-bold">
              Pronto para garantir seu desconto?
            </h2>
            <Button
              size="lg"
              className="h-14 px-10 text-lg font-bold rounded-full text-white shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.98] border-0"
              style={{ background: AMBER }}
              onClick={handleCTA}
            >
              Garantir minha vaga
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="py-8 text-center border-t">
        <p className="text-sm text-muted-foreground">
          Intelligence Atlas © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
