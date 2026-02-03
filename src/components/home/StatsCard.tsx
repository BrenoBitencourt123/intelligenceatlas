import { TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface StatsCardProps {
  lastScore: number | null;
  monthlyAverage: number | null;
}

export const StatsCard = ({ lastScore, monthlyAverage }: StatsCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Suas Notas</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Última nota</p>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-foreground" />
              <span className="text-2xl font-bold text-foreground">
                {lastScore !== null ? lastScore : '—'}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Média do mês</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-foreground" />
              <span className="text-2xl font-bold text-foreground">
                {monthlyAverage !== null ? monthlyAverage : '—'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
