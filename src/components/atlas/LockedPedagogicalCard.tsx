import { Lock, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const LockedPedagogicalCard = () => {
  const navigate = useNavigate();

  const features = [
    'Tema do dia automático',
    'Contexto e fundamentação',
    'Perguntas norteadoras',
    'Estrutura sugerida',
  ];

  return (
    <Card className="border-dashed">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Orientação de Redação</h3>
            </div>
            
            <p className="text-sm text-muted-foreground">
              O Plano Pro oferece recursos para guiar sua escrita:
            </p>
            
            <ul className="text-sm text-muted-foreground space-y-1">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <Button 
              onClick={() => navigate('/plano')} 
              variant="outline"
              size="sm"
              className="gap-2 mt-2"
            >
              Ver Plano Pro
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
