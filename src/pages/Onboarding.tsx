import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Check, Clock, Languages, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AREAS = [
  { id: 'matematica', label: 'Matemática', icon: '📐', desc: 'Álgebra, geometria, probabilidade' },
  { id: 'linguagens', label: 'Linguagens', icon: '📝', desc: 'Português, literatura, artes' },
  { id: 'natureza', label: 'Ciências da Natureza', icon: '🔬', desc: 'Física, química, biologia' },
  { id: 'humanas', label: 'Ciências Humanas', icon: '🌍', desc: 'História, geografia, filosofia' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui',
  friday: 'Sex', saturday: 'Sáb', sunday: 'Dom',
};

type DaySchedule = Record<string, string[]>;

const ALL_AREAS = AREAS.map((a) => a.id);
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

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

const STEPS = [
  { icon: Languages, label: 'Língua', title: 'Língua Estrangeira' },
  { icon: Target, label: 'Foco', title: 'Áreas de Foco' },
  { icon: Clock, label: 'Plano', title: 'Cronograma' },
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 80 : -80, opacity: 0 }),
};

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [foreignLanguage, setForeignLanguage] = useState<string>('ingles');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [dailyTarget, setDailyTarget] = useState('20');
  const [daySchedule, setDaySchedule] = useState<DaySchedule>({});
  const [customized, setCustomized] = useState(false);
  const [saving, setSaving] = useState(false);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    if (next === 2 && (!customized || Object.keys(daySchedule).length === 0)) {
      applyRecommended();
    }
    setStep(next);
  };

  const toggleArea = (areaId: string) => {
    setFocusAreas((prev) =>
      prev.includes(areaId) ? prev.filter((a) => a !== areaId) : [...prev, areaId]
    );
  };

  const toggleScheduleArea = (day: string, areaId: string) => {
    setDaySchedule((prev) => {
      const current = prev[day] ?? [];
      const updated = current.includes(areaId)
        ? current.filter((a) => a !== areaId)
        : [...current, areaId];
      return { ...prev, [day]: updated };
    });
    setCustomized(true);
  };

  const applyRecommended = () => {
    setDaySchedule(generateRecommendedSchedule(focusAreas.length > 0 ? focusAreas : AREAS.map((a) => a.id)));
    setCustomized(false);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      if (profileError) throw profileError;

      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          focus_areas: focusAreas,
          daily_questions_target: Number(dailyTarget),
          day_schedule: daySchedule,
          foreign_language: foreignLanguage,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (prefError) throw prefError;

      await refreshProfile();
      toast.success('Tudo pronto! Bora estudar 🚀');
      navigate('/hoje');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar with step indicators */}
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
              const done = i < step;
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

      {/* Content area */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8 pt-2">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
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
                {/* Hero illustration area */}
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
                    { id: 'ingles', label: 'Inglês', flag: '🇬🇧', desc: 'English' },
                    { id: 'espanhol', label: 'Espanhol', flag: '🇪🇸', desc: 'Español' },
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
                        <span className="text-4xl block mb-3">{lang.flag}</span>
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

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button className="w-full h-12 text-base gap-2 rounded-xl" onClick={() => goTo(1)}>
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

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
                    📅
                  </motion.div>
                  <h2 className="text-2xl font-bold tracking-tight">Seu cronograma</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Defina sua meta diária e organize as áreas por dia da semana.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-medium">Meta diária</Label>
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

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Área por dia</Label>
                    {customized && (
                      <button
                        className="text-xs text-primary underline underline-offset-2"
                        onClick={applyRecommended}
                      >
                        Usar recomendado
                      </button>
                    )}
                  </div>

                  <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5">
                    {DAYS.map((day) => (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-xs font-semibold w-8 text-muted-foreground shrink-0 uppercase tracking-wider">
                          {DAY_LABELS[day]}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {AREAS.map((area) => {
                            const selected = (daySchedule[day] ?? []).includes(area.id);
                            return (
                              <button
                                key={area.id}
                                onClick={() => toggleScheduleArea(day, area.id)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                                  selected
                                    ? 'border-primary bg-primary text-primary-foreground font-medium'
                                    : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50'
                                }`}
                              >
                                {area.icon} {area.label.split(' ')[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!customized && (
                    <p className="text-xs text-muted-foreground text-center">
                      Cronograma gerado automaticamente com base nas suas áreas de foco
                    </p>
                  )}
                </motion.div>

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
