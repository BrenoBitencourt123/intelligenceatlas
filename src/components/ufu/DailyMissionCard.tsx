// O único botão da /hoje. Não decide nada: chama o orquestrador `/trilha/dia`
// que compõe o plano e encadeia os segmentos.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { comporPlanoDia, preview, tempoTotalMin, type PlanoDia } from '@/lib/ufu/composerDia';

export function DailyMissionCard({ diaRedacao }: { diaRedacao: number }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plano, setPlano] = useState<PlanoDia | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    // Preview: recompõe o plano só pra mostrar a 1 linha honesta.
    // O plano real é composto de novo (e persistido) ao apertar Começar.
    comporPlanoDia({ userId: user.id, diaRedacao }).then((p) => {
      if (!cancelled) setPlano(p);
    });
    return () => {
      cancelled = true;
    };
  }, [user, diaRedacao]);

  const onStart = () => navigate('/trilha/dia');

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-6 space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Missão de hoje{plano ? ` · ~${tempoTotalMin(plano)} min` : ''}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            Começar o dia
          </h2>
          {plano ? (
            <p className="text-sm text-muted-foreground line-clamp-2">{preview(plano)}</p>
          ) : (
            <Skeleton className="h-4 w-48 rounded mt-1" />
          )}
        </div>
        <Button onClick={onStart} size="lg" className="w-full gap-2">
          COMEÇAR
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
