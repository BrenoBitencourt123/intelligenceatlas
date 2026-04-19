import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  PenLine,
  Brain,
  Check,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { getMonthsUntilEnem, getDiscountTier, STRIPE_PLANS } from '@/lib/stripe';
import { useMemo } from 'react';

/* ─── Helpers de intenção de compra ─── */
function setPurchaseIntent(plan: string, coupon?: string) {
  localStorage.setItem(
    'atlas_purchase_intent',
    JSON.stringify({ plan, ...(coupon ? { coupon } : {}) })
  );
}

/* ─── Animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

/* ─── Data ─── */
const OLD_WAY = [
  {
    emoji: '📺',
    title: 'Videoaulas intermináveis',
    desc: 'Horas assistindo conteúdo sem praticar. A sensação de que está estudando — mas sem evolução real.',
  },
  {
    emoji: '🖨️',
    title: 'Imprimir provas antigas',
    desc: 'Custo, trabalho e zero feedback. Você não sabe o que errou, nem o que priorizar depois.',
  },
  {
    emoji: '❓',
    title: 'Sem saber onde está errando',
    desc: 'Estuda tudo igualmente, sem descobrir quais áreas realmente estão te custando pontos.',
  },
];

const PILLARS = [
  {
    icon: BookOpen,
    tag: 'Sem imprimir nada',
    title: 'Questões reais do ENEM',
    desc: 'Resolva provas oficiais direto no celular. O sistema mapeia onde você erra e ajusta o que você estuda — automaticamente.',
  },
  {
    icon: PenLine,
    tag: 'Resultado em minutos',
    title: 'Redação com análise completa',
    desc: 'Escreva sua redação e receba feedback por competência, nota estimada e uma versão melhorada baseada no seu próprio raciocínio.',
  },
  {
    icon: Brain,
    tag: 'Zero trabalho manual',
    title: 'Flashcards automáticos',
    desc: 'Quando você erra uma questão, o sistema cria flashcards automaticamente. Revisão espaçada que garante que o conteúdo fica.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Crie sua conta',
    desc: 'Gratuito, sem cartão de crédito. Em menos de 1 minuto você já está dentro.',
  },
  {
    num: '02',
    title: 'Configure seu perfil',
    desc: 'Escolha suas áreas de foco, língua estrangeira e meta diária. O Atlas monta seu cronograma automaticamente.',
  },
  {
    num: '03',
    title: 'Comece a evoluir',
    desc: 'Resolva questões, escreva sua redação e veja exatamente onde você está melhorando.',
  },
];

const FREE_FEATURES = [
  '5 questões por área — sem pagar nada',
  '1 redação com análise completa por IA',
  'Feedback por competência',
  'Editor de redação no celular',
];

const PRO_FEATURES = [
  'Questões ilimitadas em todas as áreas',
  '60 redações por mês',
  'Tema do dia automático',
  'Análise das 5 competências ENEM',
  'Versão melhorada da redação',
  'Flashcards automáticos ao errar',
  'Cápsulas de conhecimento',
  'Plano diário personalizado',
  'Histórico completo de desempenho',
];

/* ─── Component ─── */
export default function Landing() {
  const navigate = useNavigate();
  const monthsUntilEnem = useMemo(() => getMonthsUntilEnem(), []);
  const discountTier = useMemo(() => getDiscountTier(monthsUntilEnem), [monthsUntilEnem]);
  const proPrice = STRIPE_PLANS.pro.price;
  const discountedPrice = discountTier
    ? proPrice * (1 - discountTier.percent / 100)
    : proPrice;

  const handleStartPro = () => {
    setPurchaseIntent('pro');
    navigate('/cadastro');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://storage.googleapis.com/gpt-engineer-file-uploads/f4QJ9UCag0bQmfSQvlHZMs1PDKy2/uploads/1770063094363-favicon.ico"
              alt="Atlas"
              className="h-6 w-6 rounded-md"
            />
            <span className="font-bold tracking-tight">Atlas</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-sm">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm" className="text-sm font-bold rounded-full px-4">
                Criar conta grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-32 pb-24 px-5">
        <div className="max-w-3xl mx-auto text-center">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-xs font-semibold mb-7"
          >
            <Smartphone className="h-3 w-3" />
            Provas reais do ENEM direto no celular
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-[2.4rem] sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6"
          >
            Você já sabe que precisa{' '}
            <br className="hidden sm:block" />
            resolver provas.{' '}
            <span className="text-muted-foreground">
              O Atlas descobre
              {' '}onde você erra.
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Questões adaptativas, redação corrigida por IA e flashcards automáticos —
            tudo baseado no seu desempenho real, sem imprimir nada.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <Link to="/cadastro">
              <Button
                size="lg"
                className="h-13 px-8 text-base font-bold rounded-full shadow-lg active:scale-[0.98] transition-transform"
              >
                Criar conta grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3">
              Sem cartão de crédito · Funciona no celular e computador
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Problema ─── */}
      <section className="py-20 px-5 bg-secondary/40">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              O problema
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Como a maioria dos estudantes se prepara
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {OLD_WAY.map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="bg-card border border-border rounded-2xl p-6 space-y-3"
              >
                <span className="text-3xl">{item.emoji}</span>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={4}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            Muito esforço. Pouco progresso real.
          </motion.p>
        </div>
      </section>

      {/* ─── Solução / Pilares ─── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-14"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              A solução
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold max-w-xl mx-auto leading-snug">
              O método que funciona — do jeito que deveria ser desde o início
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
              Resolver provas antigas é o caminho certo. O Atlas faz isso no seu celular
              e ainda te diz o que fazer com os resultados.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="bg-card border border-border rounded-2xl p-6 space-y-4"
              >
                <div className="w-11 h-11 rounded-xl bg-foreground flex items-center justify-center">
                  <p.icon className="h-5 w-5 text-background" />
                </div>
                <div className="space-y-1">
                  <span className="inline-block text-xs font-semibold bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                    {p.tag}
                  </span>
                  <h3 className="font-bold text-lg text-foreground">{p.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Como funciona ─── */}
      <section className="py-20 px-5 bg-foreground text-background">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-background">
              Comece em menos de 5 minutos
            </h2>
          </motion.div>

          <div className="space-y-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="flex gap-6 items-start"
              >
                <span className="text-5xl font-black text-background/15 shrink-0 w-14 text-right leading-none pt-1">
                  {step.num}
                </span>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-background">{step.title}</h3>
                  <p className="text-sm text-background/60 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={4}
            className="text-center mt-14"
          >
            <Link to="/cadastro">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base font-bold rounded-full"
              >
                Criar conta grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Preços ─── */}
      <section className="py-24 px-5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-4"
          >
            <h2 className="text-2xl sm:text-3xl font-bold">
              Comece grátis, evolua quando quiser
            </h2>
          </motion.div>

          {discountTier && (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="text-center mb-10"
            >
              <span className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-4 py-2 rounded-full text-sm font-medium">
                <Calendar className="h-3.5 w-3.5" />
                {monthsUntilEnem} meses até o ENEM · Assine agora e ganhe {discountTier.percent}% de desconto
              </span>
            </motion.div>
          )}

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">

            {/* Free */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-6"
            >
              <div>
                <h3 className="font-bold text-xl">Grátis</h3>
                <p className="text-muted-foreground text-sm mt-1">Para experimentar sem compromisso</p>
                <p className="text-4xl font-black mt-4">R$ 0</p>
                <p className="text-xs text-muted-foreground">para sempre</p>
              </div>
              <ul className="space-y-3 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/cadastro">
                <Button variant="outline" className="w-full font-semibold rounded-xl">
                  Criar conta grátis
                </Button>
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={3}
              className="rounded-2xl border-2 border-foreground bg-foreground text-background p-6 flex flex-col gap-6 relative"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-background text-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                  Recomendado
                </span>
              </div>

              <div>
                <h3 className="font-bold text-xl text-background">PRO</h3>
                <p className="text-background/60 text-sm mt-1">Preparação completa e ilimitada</p>

                {discountTier ? (
                  <div className="mt-4">
                    <span className="text-sm text-background/40 line-through">
                      R$ {proPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <p className="text-4xl font-black text-background">
                      R$ {discountedPrice.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-amber-400 font-semibold mt-1">
                      -{discountTier.percent}% por tempo limitado
                    </p>
                  </div>
                ) : (
                  <p className="text-4xl font-black mt-4 text-background">
                    R$ {proPrice.toFixed(2).replace('.', ',')}
                  </p>
                )}
                <p className="text-xs text-background/40 mt-1">/mês · cancele quando quiser</p>
              </div>

              <ul className="space-y-3 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-background mt-0.5 shrink-0" />
                    <span className="text-background/90">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="secondary"
                className="w-full font-bold rounded-xl"
                onClick={handleStartPro}
              >
                Começar com PRO
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="py-20 px-5 bg-secondary/40">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="max-w-xl mx-auto text-center space-y-6"
        >
          <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
            O ENEM não espera.<br />Comece hoje.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Crie sua conta grátis, faça sua primeira redação ou questão agora mesmo
            e veja onde você realmente está.
          </p>
          <div>
            <Link to="/cadastro">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-bold rounded-full shadow-lg active:scale-[0.98] transition-transform"
              >
                Criar conta grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3">
              Sem cartão de crédito · Funciona no celular
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 text-center border-t border-border space-y-2">
        <p className="text-xs text-muted-foreground">
          Inteligência Atlas © {new Date().getFullYear()}
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/termos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Termos de uso
          </Link>
          <span className="text-xs text-muted-foreground">·</span>
          <Link to="/privacidade" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Política de privacidade
          </Link>
        </div>
      </footer>

    </div>
  );
}
