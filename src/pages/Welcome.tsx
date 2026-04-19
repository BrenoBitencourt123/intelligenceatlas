import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, PenLine, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/* ─── Mapeamento de áreas ─── */
const AREA_LABELS: Record<string, string> = {
  matematica: 'Matemática',
  linguagens: 'Linguagens',
  natureza: 'Ciências da Natureza',
  humanas: 'Ciências Humanas',
};

const ALL_AREA_LABELS = Object.values(AREA_LABELS);

/* ─── Animações ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

/* ─── Component ─── */
export default function Welcome() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState<{
    focus_areas: string[];
    daily_questions_target: number;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_preferences')
      .select('focus_areas, daily_questions_target')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setPrefs(data as { focus_areas: string[]; daily_questions_target: number });
      });
  }, [user]);

  /* Dados personalizados */
  const firstName = (profile as any)?.full_name?.split(' ')[0] || null;
  const focusAreas: string[] = prefs?.focus_areas ?? [];
  const dailyTarget = prefs?.daily_questions_target ?? 20;
  const areaLabels =
    focusAreas.length > 0
      ? focusAreas.map((a) => AREA_LABELS[a] ?? a)
      : ALL_AREA_LABELS;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">
      <div className="max-w-md w-full space-y-8">

        {/* ─── Ícone de sucesso ─── */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center shadow-lg">
            <Check className="w-8 h-8 text-background" />
          </div>
        </motion.div>

        {/* ─── Título ─── */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {firstName ? `Pronto, ${firstName}!` : 'Tudo pronto!'}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            O Atlas foi configurado com base nas suas respostas.
            Agora é hora de sentir como funciona.
          </p>
        </motion.div>

        {/* ─── Card: o que foi configurado ─── */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            Configurado para você
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Áreas de foco:</span>{' '}
                <span className="text-muted-foreground">{areaLabels.join(', ')}</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Meta diária:</span>{' '}
                <span className="text-muted-foreground">{dailyTarget} questões por dia</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Cronograma semanal:</span>{' '}
                <span className="text-muted-foreground">gerado automaticamente</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── Escolha da primeira ação ─── */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-3"
        >
          <p className="text-sm font-medium text-center text-muted-foreground">
            Por onde você quer começar?
          </p>

          {/* Card: Questões */}
          <button
            onClick={() => navigate('/objetivas')}
            className="w-full text-left bg-card border-2 border-border hover:border-foreground/40 hover:bg-secondary/30 transition-all rounded-2xl p-5 space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-background" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="mt-3">
              <p className="font-semibold text-foreground">Resolver questões do ENEM</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                O Atlas já sabe por onde começar. Você resolve, ele aprende onde você trava.
              </p>
            </div>
          </button>

          {/* Card: Redação */}
          <button
            onClick={() => navigate('/redacao')}
            className="w-full text-left bg-card border-2 border-border hover:border-foreground/40 hover:bg-secondary/30 transition-all rounded-2xl p-5 space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <PenLine className="h-5 w-5 text-background" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="mt-3">
              <p className="font-semibold text-foreground">Fazer minha primeira redação</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Receba análise por competência e uma versão melhorada — completamente grátis.
              </p>
            </div>
          </button>
        </motion.div>

        {/* ─── Skip ─── */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center"
        >
          <button
            onClick={() => navigate('/hoje')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Explorar o Atlas por conta própria
          </button>
        </motion.div>

      </div>
    </div>
  );
}
