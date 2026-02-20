import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Check, Target, BookOpen, Clock, Phone } from 'lucide-react';

const AREAS = [
  { id: 'matematica', label: 'Matemática', icon: '📐' },
  { id: 'linguagens', label: 'Linguagens', icon: '📝' },
  { id: 'natureza', label: 'Ciências da Natureza', icon: '🔬' },
  { id: 'humanas', label: 'Ciências Humanas', icon: '🌍' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Seg',
  tuesday: 'Ter',
  wednesday: 'Qua',
  thursday: 'Qui',
  friday: 'Sex',
  saturday: 'Sáb',
  sunday: 'Dom',
};

type DaySchedule = Record<string, string[]>;

const ALL_AREAS = AREAS.map((a) => a.id);
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

// Áreas de foco ganham peso 2 (aparecem mais vezes na semana)
// Outras áreas ganham peso 1 — garante cobertura completa
function generateRecommendedSchedule(focusAreas: string[]): DaySchedule {
  const schedule: DaySchedule = {};

  // Sábado e Domingo ficam vazios (o schedule fallback já trata como Simulado/Descanso)
  schedule['saturday'] = [];
  schedule['sunday'] = [];

  // Monta lista ponderada: focus_areas com peso 2, demais com peso 1
  const weighted: string[] = [];
  for (const area of ALL_AREAS) {
    const weight = focusAreas.includes(area) ? 2 : 1;
    for (let i = 0; i < weight; i++) weighted.push(area);
  }

  // Distribui pelos 5 dias úteis de forma proporcional
  WEEKDAYS.forEach((day, i) => {
    schedule[day] = [weighted[i % weighted.length]];
  });

  return schedule;
}

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Name + Phone
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Focus areas
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  // Step 3: Schedule
  const [dailyTarget, setDailyTarget] = useState('20');
  const [daySchedule, setDaySchedule] = useState<DaySchedule>({});
  const [customized, setCustomized] = useState(false);

  const [saving, setSaving] = useState(false);

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

  // When entering step 3, auto-generate schedule if not customized
  const goToStep3 = () => {
    if (!customized || Object.keys(daySchedule).length === 0) {
      applyRecommended();
    }
    setStep(3);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save name + phone + onboarding_completed to profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: name.trim() || null,
          phone: phone.trim() || null,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Save focus_areas + daily_questions_target + day_schedule to user_preferences
      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          focus_areas: focusAreas,
          daily_questions_target: Number(dailyTarget),
          day_schedule: daySchedule,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (prefError) throw prefError;

      await refreshProfile();
      toast.success('Configuração salva! Bom estudo!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Configurar meu Atlas</h1>
          <p className="text-sm text-muted-foreground">Passo {step} de {totalSteps}</p>
        </div>

        {/* Progress bar */}
        <Progress value={(step / totalSteps) * 100} className="h-1.5" />

        {/* Step 1: Name + Phone */}
        {step === 1 && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary mb-3">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm font-medium uppercase tracking-wider">Bem-vindo</span>
                </div>
                <h2 className="text-xl font-semibold">Vamos começar!</h2>
                <p className="text-sm text-muted-foreground">Precisamos de algumas informações básicas</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome</Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Telefone / WhatsApp
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Usado apenas para suporte e novidades</p>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  if (!phone.trim()) {
                    toast.error('Informe seu telefone para continuar.');
                    return;
                  }
                  setStep(2);
                }}
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Focus areas */}
        {step === 2 && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary mb-3">
                  <Target className="h-5 w-5" />
                  <span className="text-sm font-medium uppercase tracking-wider">Áreas de foco</span>
                </div>
                <h2 className="text-xl font-semibold">Em quais áreas você quer focar?</h2>
                <p className="text-sm text-muted-foreground">Selecione as que você tem mais dificuldade ou quer priorizar</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {AREAS.map((area) => {
                  const selected = focusAreas.includes(area.id);
                  return (
                    <button
                      key={area.id}
                      onClick={() => toggleArea(area.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{area.icon}</span>
                      <span className="text-sm font-medium">{area.label}</span>
                      {selected && <Check className="h-4 w-4 text-primary mt-1" />}
                    </button>
                  );
                })}
              </div>
              {focusAreas.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Nenhuma seleção = todas as áreas com peso igual
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button className="flex-1 gap-2" onClick={goToStep3}>
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary mb-3">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium uppercase tracking-wider">Cronograma</span>
                </div>
                <h2 className="text-xl font-semibold">Qual é sua meta diária?</h2>
                <p className="text-sm text-muted-foreground">Defina quantas questões por dia e quais áreas estudar</p>
              </div>

              {/* Daily target */}
              <div className="space-y-2">
                <Label>Questões por dia</Label>
                <Select value={dailyTarget} onValueChange={setDailyTarget}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 questões (leve)</SelectItem>
                    <SelectItem value="20">20 questões (recomendado)</SelectItem>
                    <SelectItem value="30">30 questões (intenso)</SelectItem>
                    <SelectItem value="40">40 questões (máximo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Weekly schedule */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Área por dia da semana</Label>
                  {customized && (
                    <button
                      className="text-xs text-primary underline underline-offset-2"
                      onClick={applyRecommended}
                    >
                      Usar recomendado
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-8 text-muted-foreground shrink-0">
                        {DAY_LABELS[day]}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {AREAS.map((area) => {
                          const selected = (daySchedule[day] ?? []).includes(area.id);
                          return (
                            <button
                              key={area.id}
                              onClick={() => toggleScheduleArea(day, area.id)}
                              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                selected
                                  ? 'border-primary bg-primary/10 text-primary font-medium'
                                  : 'border-border text-muted-foreground hover:border-primary/50'
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
                  <p className="text-xs text-muted-foreground">
                    Cronograma recomendado gerado automaticamente a partir das suas áreas de foco
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleFinish}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Começar a estudar'}
                  {!saving && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary chips */}
        {step > 1 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {name && <Badge variant="secondary">{name}</Badge>}
            {focusAreas.length > 0 && step >= 2 && (
              <Badge variant="secondary">
                {focusAreas.map((a) => AREAS.find((x) => x.id === a)?.icon).join(' ')} foco
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
