import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, PenLine, Target, BookOpen, Check } from 'lucide-react';
import { CURSOS_UFU, TOTAL_QUESTOES, EDICAO } from '@/data/ufu/vestibular';
import { useMemo } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const CRITERIOS_DIRPS = [
  {
    n: 'C1',
    titulo: 'Adequação ao tema e ao gênero',
    desc: 'Sua redação responde exatamente ao que a banca pediu, no gênero exigido pelo edital.',
  },
  {
    n: 'C2',
    titulo: 'Coerência e argumentação',
    desc: 'Encadeamento das ideias, consistência do ponto de vista e força dos argumentos.',
  },
  {
    n: 'C3',
    titulo: 'Coesão textual',
    desc: 'Uso adequado de conectivos, referência, repetições evitadas — o texto flui.',
  },
  {
    n: 'C4',
    titulo: 'Modalidade escrita padrão',
    desc: 'Ortografia, acentuação, pontuação, concordância e regência conforme a norma culta.',
  },
  {
    n: 'C5',
    titulo: 'Uso produtivo dos textos-base',
    desc: 'Diálogo real com a coletânea, sem cópia — a banca DIRPS penaliza paráfrase preguiçosa.',
  },
];

export default function Landing() {
  const totalCursos = CURSOS_UFU.length;
  const campi = useMemo(
    () => new Set(CURSOS_UFU.map((c) => `${c.campus}-${c.cidade}`)).size,
    [],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-14">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold tracking-tight">Placar UFU</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-sm">Entrar</Button>
            </Link>
            <Link to="/ufu">
              <Button size="sm" className="text-sm font-bold rounded-full px-4">
                Calcular acertos
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-xs font-semibold mb-7"
          >
            <Calculator className="h-3 w-3" />
            Vestibular UFU {EDICAO} · dados oficiais DIRPS
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-[2.4rem] sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6"
          >
            Quantos acertos te colocam{' '}
            <span className="text-muted-foreground">dentro da UFU?</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Calculadora gratuita, sem cadastro. Descubra em 30 segundos onde você está
            em relação à nota de corte real do seu curso — em {totalCursos} cursos,
            {' '}{campi} campi.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <Link to="/ufu">
              <Button
                size="lg"
                className="h-13 px-8 text-base font-bold rounded-full shadow-lg active:scale-[0.98] transition-transform"
              >
                Calcular meus acertos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3">
              Grátis · Sem cadastro · Cortes oficiais {EDICAO}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Insight — passar no corte não é passar */}
      <section className="py-24 px-5 bg-foreground text-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-14"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-background/50 mb-3">
              O que ninguém te conta
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-background leading-tight max-w-2xl mx-auto">
              A UFU classifica <span className="text-background/60">6×</span> mais candidatos
              que vagas para a 2ª fase.
            </h2>
            <p className="text-background/70 mt-5 max-w-xl mx-auto text-base leading-relaxed">
              Passar no corte só te dá o direito de ter a redação corrigida.
              A vaga é decidida na 2ª fase, contra 5 concorrentes por vaga que também passaram.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { n: '1ª fase', t: 'Objetiva', d: '65 questões. Classifica 6× o número de vagas.' },
              { n: '2ª fase', t: 'Redação', d: 'Corrigida só para os classificados. Peso 3 na nota final.' },
              { n: 'Vaga', t: 'Nota ponderada', d: 'Soma dos acertos × pesos do curso + nota da redação.' },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="border border-background/15 rounded-2xl p-6 space-y-2"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-background/50">
                  {s.n}
                </p>
                <h3 className="font-bold text-lg text-background">{s.t}</h3>
                <p className="text-sm text-background/70 leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={4}
            className="text-center text-sm text-background/60 mt-10 max-w-lg mx-auto"
          >
            Por isso o Placar UFU não te treina pra passar no corte — te treina pra passar com folga.
          </motion.p>
        </div>
      </section>

      {/* Redação DIRPS */}
      <section className="py-24 px-5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-xs font-semibold mb-5">
              <PenLine className="h-3 w-3" />
              2ª fase · onde a vaga é decidida
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold leading-tight max-w-2xl mx-auto">
              Corretor de redação nos 5 critérios oficiais da banca DIRPS
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base leading-relaxed">
              Sua redação avaliada exatamente pela rubrica do edital — sem inventar
              critério, sem simplificação. Nota estimada, feedback por critério e uma
              versão melhorada baseada no seu próprio texto.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {CRITERIOS_DIRPS.map((c, i) => (
              <motion.div
                key={c.n}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="bg-card border border-border rounded-2xl p-5 flex gap-4"
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-sm">
                  {c.n}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{c.titulo}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/redacao-ufu">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base font-bold rounded-full"
              >
                Corrigir minha redação
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Em breve — trilha por curso */}
      <section className="py-24 px-5 bg-secondary/40">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-full text-xs font-semibold mb-5">
              <Target className="h-3 w-3" />
              Em breve
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold leading-tight max-w-2xl mx-auto">
              Trilha de questões por curso, com os pesos oficiais
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base leading-relaxed">
              Cada curso da UFU pesa as 11 disciplinas de forma diferente. Estudar 1 hora
              de matemática vale muito mais pra quem quer Engenharia do que pra quem quer
              Direito. A trilha vai priorizar automaticamente as disciplinas que mais pesam
              no seu curso — usando os pesos oficiais do quadro DIRPS {EDICAO}.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              { icon: Target, t: 'Priorização por peso', d: 'As disciplinas com peso 3 no seu curso viram foco automático.' },
              { icon: BookOpen, t: 'Questões reais', d: `${TOTAL_QUESTOES} questões por prova, cobertura das 11 disciplinas.` },
              { icon: Check, t: 'Onde investir', d: 'Análise de pontos deixados na mesa por disciplina × peso.' },
            ].map((f, i) => (
              <motion.div
                key={f.t}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="bg-card border border-border rounded-2xl p-5 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                  <f.icon className="h-4 w-4 text-background" />
                </div>
                <h3 className="font-semibold text-foreground">{f.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Comece pelo que importa: descobrir onde você está
          </h2>
          <p className="text-muted-foreground mb-8">
            A calculadora é grátis e não pede cadastro. Você sai dela sabendo,
            em acertos brutos, quanto falta pra chegar no seu curso.
          </p>
          <Link to="/ufu">
            <Button
              size="lg"
              className="h-13 px-8 text-base font-bold rounded-full shadow-lg"
            >
              Calcular meus acertos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-5 text-center text-xs text-muted-foreground">
        Dados oficiais DIRPS/UFU · Vestibular {EDICAO} ·{' '}
        <Link to="/privacidade" className="underline">Privacidade</Link> ·{' '}
        <Link to="/termos" className="underline">Termos</Link>
      </footer>
    </div>
  );
}
