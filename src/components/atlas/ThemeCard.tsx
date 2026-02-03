import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ThemeCardProps {
  title: string;
  motivatingText: string;
}

export const ThemeCard = ({ title, motivatingText }: ThemeCardProps) => {
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
          <Badge variant="secondary" className="text-xs shrink-0">
            Plano Básico
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
