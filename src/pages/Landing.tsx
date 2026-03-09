import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, PenLine, Brain, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const PILLARS = [
  {
    icon: BookOpen,
    title: 'Questões inteligentes',
    desc: 'Resolva questões reais do ENEM e o sistema identifica seus pontos fracos para focar onde você mais precisa.',
  },
  {
    icon: PenLine,
    title: 'Redação com IA',
    desc: 'Receba análise por competência e uma versão nota 1.000 baseada no seu próprio raciocínio.',
  },
  {
    icon: Brain,
    title: 'Flashcards espaçados',
    desc: 'Memorize conteúdos com revisão inteligente que se adapta ao seu ritmo de aprendizado.',
  },
];

const FEATURES = [
  'Correção de redação com feedback detalhado por competência',
  'Banco de questões ENEM com classificação por tema',
  'Sistema adaptativo que prioriza seus pontos fracos',
  'Flashcards com repetição espaçada (SRS)',
  'Acompanhamento completo de desempenho',
  'Funciona no celular e no computador',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://storage.googleapis.com/gpt-engineer-file-uploads/f4QJ9UCag0bQmfSQvlHZMs1PDKy2/uploads/1770063094363-favicon.ico"
              alt="Atlas"
              className="h-7 w-7 rounded-md"
            />
            <span className="font-bold text-lg">Atlas</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm">Criar conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma de estudos com IA para o ENEM
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Estude de forma{' '}
              <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                inteligente
              </span>
              {' '}para o ENEM
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Questões adaptativas, redação corrigida por IA e flashcards espaçados — tudo o que você precisa para maximizar sua nota.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/cadastro">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold">
                  Começar agora — é grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/fundadores">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                  Programa Fundadores
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20 px-5 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Três pilares para sua aprovação
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 space-y-3"
              >
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                  <p.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features list */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Tudo que você precisa em um só lugar
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Pronto para estudar de verdade?
          </h2>
          <p className="text-primary-foreground/70">
            Crie sua conta gratuita e comece a praticar agora mesmo.
          </p>
          <Link to="/cadastro">
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-8 text-base font-semibold"
            >
              Criar conta grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
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
