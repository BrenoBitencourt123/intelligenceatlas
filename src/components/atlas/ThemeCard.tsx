import { Calendar, CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ThemeCardProps {
  title: string;
  motivatingText: string;
  planType?: 'free' | 'basic' | 'pro';
  hasWrittenToday?: boolean;
  onRedo?: () => void;
}

export const ThemeCard = ({ 
  title, 
  motivatingText, 
  planType = 'pro',
  hasWrittenToday = false,
  onRedo,
}: ThemeCardProps) => {
  const navigate = useNavigate();
  const isPro = planType === 'pro';
  const isBasic = planType === 'basic';
  
  const getBadgeLabel = () => {
    if (isPro) return 'Plano Pro';
    if (isBasic) return 'Plano Básico';
    return 'Plano Free';
  };

  const handleViewCorrection = () => {
    const today = new Date().toISOString().split('T')[0];
    navigate(`/historico?date=${today}`);
  };
  
  // Compact version when essay is completed
  if (hasWrittenToday) {
    return (
      <Card className="border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="font-medium text-foreground">Redação do dia concluída</span>
                <p className="text-sm text-muted-foreground line-clamp-1">"{title}"</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="outline"
                size="sm"
                onClick={onRedo}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refazer
              </Button>
              <Button 
                size="sm"
                onClick={handleViewCorrection}
                className="gap-2"
              >
                Ver correção
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Full version when essay is not completed
  return (
    <Card className={cn(
      "border-2",
      isPro 
        ? "border-amber-500/40 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent" 
        : "border-foreground/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className={cn("h-5 w-5", isPro ? "text-amber-600 dark:text-amber-400" : "text-foreground")} />
            <span className={cn(
              "text-sm font-semibold uppercase tracking-wide",
              isPro ? "text-amber-700 dark:text-amber-400" : "text-foreground"
            )}>
              Tema do Dia
            </span>
          </div>
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs shrink-0",
              isPro && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300/50"
            )}
          >
            {getBadgeLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight">
          "{title}"
        </h2>
        <blockquote className="border-l-2 border-muted-foreground/30 pl-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {motivatingText}
        </blockquote>
      </CardContent>
    </Card>
  );
};
