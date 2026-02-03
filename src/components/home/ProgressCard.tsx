import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProgressCardProps {
  used: number;
  total: number;
}

export const ProgressCard = ({ used, total }: ProgressCardProps) => {
  const percentage = Math.round((used / total) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Progresso Mensal</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{used}</span>
          <span className="text-muted-foreground">/ {total} redações</span>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {total - used} correções restantes este mês
        </p>
      </CardContent>
    </Card>
  );
};
