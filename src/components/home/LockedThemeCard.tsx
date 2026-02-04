import { Lock, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const LockedThemeCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-amber-500/70 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Tema do Dia
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center text-center py-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            O Tema do Dia é exclusivo do Plano Pro. Inclui tema diário, contexto, perguntas norteadoras e estrutura sugerida.
          </p>
        </div>
        
        <Button 
          onClick={() => navigate('/plano')} 
          className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          size="lg"
        >
          Ver Plano Pro
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
