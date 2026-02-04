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
            <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
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
          disabled={isBlocked && !hasWrittenToday}
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
