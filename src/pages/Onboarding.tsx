import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'es'>('en');
  const [dailyMinutes, setDailyMinutes] = useState<string>('60');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        preferred_language: preferredLanguage,
        daily_minutes_target: Number(dailyMinutes),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Preferencias salvas.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Nao foi possivel salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Preferencias opcionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Lingua estrangeira</Label>
              <Select value={preferredLanguage} onValueChange={(v: 'en' | 'es') => setPreferredLanguage(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">Ingles</SelectItem>
                  <SelectItem value="es">Espanhol</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Meta diaria (minutos)</Label>
              <Select value={dailyMinutes} onValueChange={setDailyMinutes}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                  <SelectItem value="120">120</SelectItem>
                  <SelectItem value="180">180+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/')} disabled={saving}>Voltar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
