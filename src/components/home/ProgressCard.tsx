import { FileText, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ProgressCardProps {
  used: number;
  total: number;
  isFree?: boolean;
}

export const ProgressCard = ({ used, total, isFree = false }: ProgressCardProps) => {
  const navigate = useNavigate();
  const percentage = Math.min(100, Math.round((used / total) * 100));
  const remaining = Math.max(0, total - used);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {isFree ? 'Seu Uso' : 'Progresso Mensal'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex flex-col flex-1">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{used}</span>
          <span className="text-muted-foreground">/ {total} {isFree ? 'redação' : 'redações'}</span>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {isFree 
            ? (remaining === 0 ? 'Você usou sua redação gratuita' : `${remaining} redação gratuita restante`)
            : `${remaining} correções restantes este mês`}
        </p>
        <div className="mt-auto pt-2">
          <Button 
            className="w-full" 
            size="sm"
            onClick={() => navigate('/redacao')}
          >
            <PenLine className="h-4 w-4 mr-2" />
            Escrever redação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
