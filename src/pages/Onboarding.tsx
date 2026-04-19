import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Check, Clock, Languages, Target, AlertTriangle, Brain, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  seedLevelFromSelfAssessment,
  computePriorityScore,
  nextReviewDateForLevel,
} from '@/lib/adaptiveStudy';

/* ─── Áreas ─── */
const AREAS = [
  { id: 'matematica',  label: 'Matemática',          icon: '📐', desc: 'Álgebra, geometria, probabilidade' },
  { id: 'linguagens',  label: 'Linguagens',           icon: '📝', desc: 'Português, literatura, artes' },
  { id: 'natureza',   label: 'Ciências da Natureza', icon: '🔬', desc: 'Física, química, biologia' },
  { id: 'humanas',    label: 'Ciências Humanas',     icon: '🌍', desc: 'História, geografia, filosofia' },
];

const ALL_AREAS = AREAS.map((a) => a.id);
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

/* ─── Opções de autoavaliação ─── */
const ASSESSMENT_OPTIONS = [
  { label: 'Fraco',   value: 2, color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800' },
  { label: 'Regular', value: 5, color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
  { label: 'Bom',     value: 7, color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' },
  { label: 'Ótimo',   value: 9, color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800' },
];

type DaySchedule = Record<string, string[]>;

function generateRecommendedSchedule(focusAreas: string[]): DaySchedule {
  const schedule: DaySchedule = {};
  schedule['saturday'] = [];
  schedule['sunday'] = [];
  const weighted: string[] = [];
  for (const area of ALL_AREAS) {
    const weight = focusAreas.includes(area) ? 2 : 1;
    for (let i = 0; i < weight; i++) weighted.push(area);
  }
  WEEKDAYS.forEach((day, i) => {
    schedule[day] = [weighted[i % weighted.length]];
  });
  return schedule;
}

/* ─── Steps ─── */
const STEPS = [
  { icon: Languages, label: 'Língua',  title: 'Língua Estrangeira' },
  { icon: Target,    label: 'Foco',    title: 'Áreas de Foco' },
  { icon: Clock,     label: 'Meta',    title: 'Meta Diária' },
  { icon: Brain,     label: 'Nível',   title: 'Seu Nível Atual' },
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (direction: number) => ({ x: direction < 0 ? 80 : -80, opacity: 0 }),
};

/* ─── Component ─── */
export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]       = useState(0);
  const [direction, setDirection] = useState(1);
  const [foreignLanguage, setForeignLanguage] = useState<string>('ingles');
  const [focusAreas, setFocusAreas]           = useState<string[]>([]);
  const [dailyTarget, setDailyTarget]         = useState('20');
  const [selfAssessment, setSelfAssessment]   = useState<Record<string, number>>({
    matematica: 5,
    linguagens: 5,
    natureza:   5,
    humanas:    5,
  });
  const [saving, setSaving] = useState(false);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const toggleArea = (areaId: string) => {
    setFocusAreas((prev) =>
      prev.includes(areaId) ? prev.filter((a) => a !== areaId) : [...prev, areaId]
    );
  };

  const setAreaAssessment = (areaId: string, value: number) => {
    setSelfAssessment((prev) => ({ ...prev, [areaId]: value }));
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      /* ── 1. Marcar onboarding como concluído ── */
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      if (profileError) throw profileError;

      /* ── 2. Salvar preferências e cronograma ── */
      const autoSchedule = generateRecommendedSchedule(
        focusAreas.length > 0 ? focusAreas : ALL_AREAS
      );

      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          focus_areas: focusAreas,
          daily_questions_target: Number(dailyTarget),
          day_schedule: autoSchedule,
          foreign_language: foreignLanguage,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (prefError) throw prefError;

      /* ── 3. Pre-semear perfil de tópicos com a autoavaliação ──
         Isso faz o algoritmo começar calibrado ao invés de do zero.
         seedLevelFromSelfAssessment converte 0-10 → nível 0-3 do sistema. */
      const nowIso = new Date().toISOString();
      const seedUpserts = Object.entries(selfAssessment).map(([area, value]) => {
        const level = seedLevelFromSelfAssessment(value);
        const priorityScore = computePriorityScore({ attempts: 0, correct: 0, level });
        return supabase.from('user_topic_profile').upsert(
          {
            user_id:          user.id,
            area,
            topic:            'Geral',
            subtopic:         '',
            level,
            attempts:         0,
            correct:          0,
            wrong:            0,
            dont_know:        0,
            correct_streak:   0,
            priority_score:   priorityScore,
            next_review_at:   nextReviewDateForLevel(level),
            last_attempt_at:  null,
            updated_at:       nowIso,
          },
          { onConflict: 'user_id,area,topic,subtopic' }
        );
      });
      await Promise.all(seedUpserts);

      await refreshProfile();
      toast.success('Tudo pronto! Bora estudar 🚀');

      /* ── 4. Verifica intenção de compra preservada ── */
      const rawIntent = localStorage.getItem('atlas_purchase_intent');
      if (rawIntent) {
        try {
          const intent = JSON.parse(rawIntent) as { plan: string; coupon?: string };
          localStorage.removeItem('atlas_purchase_intent');
          const params = new URLSearchParams({ checkout: intent.plan });
          if (intent.coupon) params.set('coupon', intent.coupon);
          navigate(`/plano?${params.toString()}`);
        } catch {
          localStorage.removeItem('atlas_purchase_intent');
          navigate('/bem-vindo');
        }
      } else {
        navigate('/bem-vindo');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ─── Top bar ─── */}
      <div className="w-full pt-8 pb-4 px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto space-y-6"
        >
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight">Configurar Atlas</h1>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s, i) => {
              const done   = i < step;
              const active = i === step;
              return (
                <div key={i} className="flex items-center gap-2">
                  <motion.button
                    onClick={() => i <= step && goTo(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : done
                        ? 'bg-primary/10 text-primary cursor-pointer'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    whileTap={i <= step ? { scale: 0.95 } : {}}
                  >
                    {done ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <s.icon className="h-3 w-3" />
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                  </motion.button>
                  {i < STEPS.length - 1 && (
                    <div className={`w-6 h-px ${i < step ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8 pt-2">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>

            {/* ── Step 0: Língua ── */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-6"
              >
                <div className="text-center space-y-3">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                    className="text-6xl"
                  >
                    🌍
                  </motion.div>
                  <h2 className="text-2xl font-bold tracking-tight">Qual língua estrangeira?</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    As questões 1–5 de Linguagens no ENEM são de língua estrangeira. Escolha a sua:
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'ingles',   label: 'Inglês',   abbr: 'EN', desc: 'English' },
                    { id: 'espanhol', label: 'Espanhol', abbr: 'ES', desc: 'Español' },
                  ].map((lang, i) => {
                    const selected = foreignLanguage === lang.id;
                    return (
                      <motion.button
                        key={lang.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        onClick={() => setForeignLanguage(lang.id)}
                        className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                          selected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold mb-3 ${
                          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                        }`}>
                          {lang.abbr}
                        </div>
                        <span className="text-base font-semibold block">{lang.label}</span>
                        <span className="text-xs text-muted-foreground">{lang.desc}</span>
                        {selected && (
                          <motion.div
                            layoutId="lang-check"
                            className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                          >
                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  <Button className="w-full h-12 text-base gap-2 rounded-xl" onClick={() => goTo(1)}>
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* ── Step 1: Áreas de foco ── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-6"
              >
                <div className="text-center space-y-3">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                    className="text-6xl"
                  >
                    🎯
                  </motion.div>
                  <h2 className="text-2xl font-bold tracking-tight">Áreas de foco</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Selecione as áreas que você quer priorizar. Não selecionou nada? Todas terão peso igual.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {AREAS.map((area, i) => {
                    const selected = focusAreas.includes(area.id);
                    return (
                      <motion.button
                        key={area.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.08 }}
                        onClick={() => toggleArea(area.id)}
                        className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                          selected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                        }`}
                      >
                        <span className="text-3xl block mb-2">{area.icon}</span>
                        <span className="text-sm font-semibold block">{area.label}</span>
                        <span className="text-[11px] text-muted-foreground leading-tight">{area.desc}</span>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                          >
                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-3"
                >
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => goTo(0)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button className="flex-1 h-12 text-base gap-2 rounded-xl" onClick={() => goTo(2)}>
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* ── Step 2: Meta diária ── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-6"
              >
                <div className="text-center space-y-3">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                    className="text-6xl"
                  >
                    📊
                  </motion.div>
                  <h2 className="text-2xl font-bold tracking-tight">Meta de estudo</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Defina quantas questões você quer resolver por dia.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Crosshair className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Só responda quando tiver certeza</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Chutar prejudica o algoritmo. Escolha "Não sei" quando não souber.
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">O sistema adapta o cronograma</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        As áreas mais urgentes aparecem com mais frequência — automaticamente.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-medium">Meta diária de questões</Label>
                  <Select value={dailyTarget} onValueChange={setDailyTarget}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 questões — leve</SelectItem>
                      <SelectItem value="20">20 questões — recomendado</SelectItem>
                      <SelectItem value="30">30 questões — intenso</SelectItem>
                      <SelectItem value="40">40 questões — máximo</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <AnimatePresence>
                  {dailyTarget === '40' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 p-4 rounded-xl flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Cuidado com a intensidade</p>
                          <p className="text-xs mt-1 opacity-90">
                            40 questões por dia é muito intenso. O cansaço leva ao chute, que prejudica o algoritmo. Recomendamos começar com 20.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-3"
                >
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => goTo(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button className="flex-1 h-12 text-base gap-2 rounded-xl" onClick={() => goTo(3)}>
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* ── Step 3: Autoavaliação por área ── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-6"
              >
                <div className="text-center space-y-3">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                    className="text-6xl"
                  >
                    🧠
                  </motion.div>
                  <h2 className="text-2xl font-bold tracking-tight">Como você está em cada matéria?</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Seja honesto — isso calibra seu plano antes da primeira questão.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  {AREAS.map((area, i) => (
                    <motion.div
                      key={area.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.07 }}
                      className="bg-card border border-border rounded-2xl p-4 space-y-3"
                    >
                      {/* Área */}
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{area.icon}</span>
                        <span className="text-sm font-semibold text-foreground">{area.label}</span>
                      </div>

                      {/* Opções */}
                      <div className="grid grid-cols-4 gap-2">
                        {ASSESSMENT_OPTIONS.map((opt) => {
                          const selected = selfAssessment[area.id] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setAreaAssessment(area.id, opt.value)}
                              className={`py-2 px-1 rounded-xl border-2 text-xs font-semibold transition-all ${
                                selected
                                  ? opt.color + ' border-current shadow-sm scale-105'
                                  : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs text-center text-muted-foreground"
                >
                  Não se preocupe — o sistema vai ajustar conforme você pratica.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="flex gap-3"
                >
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => goTo(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    className="flex-1 h-12 text-base gap-2 rounded-xl"
                    onClick={handleFinish}
                    disabled={saving}
                  >
                    {saving ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      />
                    ) : (
                      <>
                        Começar a estudar
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
