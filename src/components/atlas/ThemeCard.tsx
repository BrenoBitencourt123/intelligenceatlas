import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ThemeCardProps {
  title: string;
  motivatingText: string;
  planType?: 'free' | 'basic' | 'pro';
}

export const ThemeCard = ({ title, motivatingText, planType = 'pro' }: ThemeCardProps) => {
  const isPro = planType === 'pro';
  const isBasic = planType === 'basic';
  
  const getBadgeLabel = () => {
    if (isPro) return 'Plano Pro';
    if (isBasic) return 'Plano Básico';
    return 'Plano Free';
  };
  
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
