import { Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ContextCardProps {
  context: string;
}

export const ContextCard = ({ context }: ContextCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-foreground" />
          <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Contexto do Tema
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {context}
        </p>
      </CardContent>
    </Card>
  );
};
