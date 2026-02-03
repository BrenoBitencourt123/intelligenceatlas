import { Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface DailyThemeCardProps {
  title: string;
  hasWrittenToday: boolean;
}

export const DailyThemeCard = ({ title, hasWrittenToday }: DailyThemeCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-foreground/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Tema do Dia
            </span>
          </div>
          {hasWrittenToday && (
            <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Concluída
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight">
          "{title}"
        </h2>
        
        <Button 
          onClick={() => navigate('/redacao')} 
          className="w-full gap-2"
          size="lg"
        >
          {hasWrittenToday ? (
            <>
              Ver correção
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              Escrever redação de hoje
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
