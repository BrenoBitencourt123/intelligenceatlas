import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Check, GraduationCap, Users, PenLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CURSOS_UFU, COTAS, getCurso } from '@/data/ufu/vestibular';
import { DIAS_SEMANA } from '@/lib/ufu/temaSemana';

const STEPS = [
  { icon: GraduationCap, label: 'Curso' },
  { icon: Users, label: 'Modalidade' },
  { icon: PenLine, label: 'Dia D' },
];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 80 : -80, opacity: 0 }),
};

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [cursoId, setCursoId] = useState<string>('');
  const [cotaId, setCotaId] = useState<string>('');
  const [diaRedacao, setDiaRedacao] = useState<number>(6);
  const [saving, setSaving] = useState(false);

  const cursosPorCampus = useMemo(() => {
    const map = new Map<string, typeof CURSOS_UFU>();
    for (const curso of CURSOS_UFU) {
      const key = `${curso.campus} — ${curso.cidade}`;
      const arr = map.get(key) ?? [];
      arr.push(curso);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const cursoSelecionado = cursoId ? getCurso(cursoId) : undefined;

  const handleFinish = async () => {
    if (!user || !cursoId || !cotaId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          curso_ufu: cursoId,
          cota_ufu: cotaId,
        } as any)
        .eq('id', user.id);
      if (error) throw error;

      await refreshProfile();
      const dest = localStorage.getItem('redirect_after_auth');
      localStorage.removeItem('redirect_after_auth');
      navigate(dest && dest.startsWith('/') ? dest : '/hoje', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full pt-8 pb-4 px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto space-y-6"
        >
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight">Configurar Atlas</h1>
            <p className="text-xs text-muted-foreground mt-1">Vestibular UFU 2027</p>
          </div>

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
                    {done ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                    <span>{s.label}</span>
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

      <div className="flex-1 flex items-start justify-center px-4 pb-8 pt-2">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
              <motion.div
                key="step-curso"
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
                    🎓
                  </motion.div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Qual curso você quer na UFU?
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Escolha o curso que você quer conquistar. Todo o Atlas vai se ajustar aos
                    pesos e à nota de corte dele.
                  </p>
                </div>

                <div className="space-y-3">
                  <Select value={cursoId} onValueChange={setCursoId}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Selecione um curso" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[60vh]">
                      {cursosPorCampus.map(([campus, cursos]) => (
                        <SelectGroup key={campus}>
                          <SelectLabel>{campus}</SelectLabel>
                          {cursos.map((curso) => (
                            <SelectItem key={curso.id} value={curso.id}>
                              {curso.nome} · {curso.turno}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>

                  {cursoSelecionado && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-muted/40 p-4 text-sm"
                    >
                      <p className="font-semibold">{cursoSelecionado.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Campus {cursoSelecionado.campus} · {cursoSelecionado.cidade} ·{' '}
                        {cursoSelecionado.turno}
                      </p>
                    </motion.div>
                  )}
                </div>

                <Button
                  className="w-full h-12 text-base gap-2 rounded-xl"
                  disabled={!cursoId}
                  onClick={() => goTo(1)}
                >
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-cota"
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
                    👥
                  </motion.div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Em qual modalidade você concorre?
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Isso define qual nota de corte o Atlas usa como referência para você.
                  </p>
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {COTAS.map((cota) => {
                    const selected = cotaId === cota.id;
                    return (
                      <button
                        key={cota.id}
                        onClick={() => setCotaId(cota.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{cota.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {cota.descricao}
                            </p>
                          </div>
                          {selected && (
                            <div className="w-5 h-5 shrink-0 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl"
                    onClick={() => goTo(0)}
                    disabled={saving}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    className="flex-1 h-12 text-base gap-2 rounded-xl"
                    disabled={!cotaId || saving}
                    onClick={handleFinish}
                  >
                    {saving ? 'Salvando...' : 'Concluir'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
