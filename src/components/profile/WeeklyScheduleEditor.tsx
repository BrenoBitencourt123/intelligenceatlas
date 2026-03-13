import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CalendarDays, Loader2, Save, Check } from 'lucide-react';

const AREAS = [
  { id: 'matematica', label: 'Matemática', icon: '📐' },
  { id: 'linguagens', label: 'Linguagens', icon: '📝' },
  { id: 'natureza', label: 'Ci. Natureza', icon: '🔬' },
  { id: 'humanas', label: 'Ci. Humanas', icon: '🌍' },
];

const WEEKDAYS = [
  { key: 'monday', label: 'Segunda' },
  { key: 'tuesday', label: 'Terça' },
  { key: 'wednesday', label: 'Quarta' },
  { key: 'thursday', label: 'Quinta' },
  { key: 'friday', label: 'Sexta' },
];

type DaySchedule = Record<string, string[]>;

export function WeeklyScheduleEditor() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<DaySchedule>({});
  const [dailyTarget, setDailyTarget] = useState<number>(20);
  const [foreignLanguage, setForeignLanguage] = useState<string>('ingles');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [original, setOriginal] = useState<string>('');

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('day_schedule, daily_questions_target, foreign_language')
          .eq('user_id', user.id)
          .maybeSingle();

        const s = (data?.day_schedule as DaySchedule) ?? {};
        setSchedule(s);
        setDailyTarget(data?.daily_questions_target ?? 20);
        setForeignLanguage(data?.foreign_language ?? 'ingles');
        setOriginal(JSON.stringify({ s, t: data?.daily_questions_target ?? 20, fl: data?.foreign_language ?? 'ingles' }));
      } catch {
        // use defaults
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    const current = JSON.stringify({ s: schedule, t: dailyTarget, fl: foreignLanguage });
    setHasChanges(current !== original);
  }, [schedule, dailyTarget, foreignLanguage, original]);

  const setDayArea = (day: string, areaId: string) => {
    setSchedule((prev) => ({ ...prev, [day]: [areaId] }));
  };

  const getDayArea = (day: string): string => {
    return schedule[day]?.[0] ?? '';
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          day_schedule: { ...schedule, saturday: [], sunday: [] },
          daily_questions_target: dailyTarget,
          foreign_language: foreignLanguage,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setOriginal(JSON.stringify({ s: schedule, t: dailyTarget, fl: foreignLanguage }));
      setHasChanges(false);
      toast.success('Cronograma atualizado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Cronograma Semanal
        </CardTitle>
        <CardDescription>
          Defina a área de estudo de cada dia da semana. Sábado = Simulado, Domingo = Descanso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Weekday selectors */}
        <div className="space-y-3">
          {WEEKDAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm font-medium w-20 shrink-0">{label}</span>
              <Select value={getDayArea(key) || 'none'} onValueChange={(v) => setDayArea(key, v)}>
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.icon} {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {/* Fixed days */}
          <div className="flex items-center gap-3 opacity-60">
            <span className="text-sm font-medium w-20 shrink-0">Sábado</span>
            <div className="flex-1 h-9 px-3 rounded-md border bg-muted flex items-center text-sm text-muted-foreground">
              📋 Simulado (90 questões)
            </div>
          </div>
          <div className="flex items-center gap-3 opacity-60">
            <span className="text-sm font-medium w-20 shrink-0">Domingo</span>
            <div className="flex-1 h-9 px-3 rounded-md border bg-muted flex items-center text-sm text-muted-foreground">
              🧘 Descanso Ativo (flashcards)
            </div>
          </div>
        </div>

        {/* Daily target */}
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-sm font-medium">Meta diária de questões</Label>
          <Select value={String(dailyTarget)} onValueChange={(v) => setDailyTarget(Number(v))}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 questões — leve</SelectItem>
              <SelectItem value="20">20 questões — recomendado</SelectItem>
              <SelectItem value="30">30 questões — intenso</SelectItem>
              <SelectItem value="40">40 questões — máximo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Foreign language */}
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-sm font-medium">Língua estrangeira</Label>
          <Select value={foreignLanguage} onValueChange={setForeignLanguage}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ingles">🇬🇧 Inglês</SelectItem>
              <SelectItem value="espanhol">🇪🇸 Espanhol</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="w-full gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasChanges ? (
            <Save className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {isSaving ? 'Salvando...' : hasChanges ? 'Salvar Alterações' : 'Tudo salvo'}
        </Button>
      </CardContent>
    </Card>
  );
}
