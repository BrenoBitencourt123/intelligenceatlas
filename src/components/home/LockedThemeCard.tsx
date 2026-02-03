import { Lock, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const LockedThemeCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-dashed border-muted-foreground/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tema do Dia
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center text-center py-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            O Tema do Dia é um benefício exclusivo do Plano Pro, que oferece tema diário e orientação completa para a redação.
          </p>
        </div>
        
        <Button 
          onClick={() => navigate('/plano')} 
          variant="outline"
          className="w-full gap-2"
          size="lg"
        >
          Ver Plano Pro
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
