import { Calendar, ArrowRight, CheckCircle2, Clock, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import type { QuotaReason } from '@/hooks/useQuotaCheck';

interface DailyThemeCardProps {
  title: string;
  hasWrittenToday: boolean;
  quotaReason?: QuotaReason;
  dailyLimit?: number;
  isFlexibleMode?: boolean;
}

export const DailyThemeCard = ({ 
  title, 
  hasWrittenToday,
  quotaReason,
  dailyLimit = 2,
  isFlexibleMode = false,
}: DailyThemeCardProps) => {
  const navigate = useNavigate();
  
  const isBlocked = quotaReason === 'daily_limit' || quotaReason === 'monthly_limit' || quotaReason === 'limit_reached';

  const getWarningMessage = () => {
    switch (quotaReason) {
      case 'daily_limit':
        return `Você atingiu o limite de ${dailyLimit} ${dailyLimit === 1 ? 'análise' : 'análises'} por dia.`;
      case 'monthly_limit':
        return 'Limite mensal atingido. Faça upgrade para continuar praticando.';
      case 'limit_reached':
        return 'Você já usou sua correção gratuita. Faça upgrade para continuar.';
      default:
        return null;
    }
  };

  const handleButtonClick = () => {
    if (hasWrittenToday) {
      const today = new Date().toISOString().split('T')[0];
      navigate(`/historico?date=${today}`);
    } else {
      navigate('/redacao');
    }
  };

  // Compact card when essay is completed
  if (hasWrittenToday) {
    return (
      <Card className="border border-muted">
        <CardContent className="py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="font-medium text-foreground">Redação do dia concluída</span>
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            className="gap-2 shrink-0"
          >
            Ver correção
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Full card when essay is not completed
  return (
    <Card className="border-2 border-foreground/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-foreground" />
          <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Tema do Dia
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight">
          "{title}"
        </h2>
        
        {/* Warning when limit reached */}
        {isBlocked && (
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
              <span>{getWarningMessage()}</span>
              {quotaReason === 'daily_limit' && !isFlexibleMode && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 ml-1 text-amber-800 dark:text-amber-200 underline"
                  onClick={() => navigate('/perfil#quota')}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Alterar limite
                </Button>
              )}
              {quotaReason === 'daily_limit' && isFlexibleMode === false && (
                <span className="block mt-1 text-xs opacity-80">Volte amanhã ou ative o modo flexível.</span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handleButtonClick}
          className="w-full gap-2"
          size="lg"
          disabled={isBlocked}
        >
          Escrever redação de hoje
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
