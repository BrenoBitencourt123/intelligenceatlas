import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Calendar, Zap, ArrowRight } from 'lucide-react';
import { QuotaReason } from '@/hooks/useQuotaCheck';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

interface QuotaExceededModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: QuotaReason;
}

export const QuotaExceededModal = ({
  open,
  onOpenChange,
  reason,
}: QuotaExceededModalProps) => {
  const navigate = useNavigate();
  const { planType, isFree } = usePlanFeatures();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/plano');
  };

  const getContent = () => {
    if (reason === 'limit_reached' && isFree) {
      return {
        icon: Lock,
        title: 'Você usou sua redação gratuita',
        description: 'O plano gratuito inclui 1 correção para você experimentar. Assine um plano para continuar praticando e melhorar sua nota!',
        cta: 'Ver planos',
        showUpgrade: true,
      };
    }

    if (reason === 'daily_limit') {
      return {
        icon: Calendar,
        title: 'Limite diário atingido',
        description: `Você atingiu o limite de correções de hoje. Volte amanhã para continuar praticando!${planType === 'free' ? ' O plano Pro oferece 2 correções por dia.' : ''}`,
        cta: planType === 'free' ? 'Fazer upgrade para Pro' : 'Entendi',
        showUpgrade: planType === 'free',
      };
    }

    if (reason === 'monthly_limit') {
      // Calculate days until next month
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        icon: Zap,
        title: 'Limite mensal atingido',
        description: `Você usou todas as suas correções do mês. Sua cota renova em ${daysUntilReset} dia${daysUntilReset > 1 ? 's' : ''}.${planType === 'free' ? ' O plano Pro oferece 60 correções por mês!' : ''}`,
        cta: planType === 'free' ? 'Fazer upgrade para Pro' : 'Entendi',
        showUpgrade: planType === 'free',
      };
    }

    return {
      icon: Lock,
      title: 'Limite atingido',
      description: 'Você atingiu seu limite de correções.',
      cta: 'Ver planos',
      showUpgrade: true,
    };
  };

  const content = getContent();
  const Icon = content.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">{content.title}</DialogTitle>
          <DialogDescription className="text-base">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {content.showUpgrade ? (
            <Button onClick={handleUpgrade} className="w-full gap-2">
              {content.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)} variant="secondary" className="w-full">
              {content.cta}
            </Button>
          )}
          {content.showUpgrade && (
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
