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
import { Lock, Calendar, Zap, ArrowRight, RefreshCcw } from 'lucide-react';
import { QuotaReason } from '@/hooks/useQuotaCheck';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useFreemiumUsage } from '@/hooks/useFreemiumUsage';

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
  const { isWelcomeBonus } = useFreemiumUsage();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/plano');
  };

  const getContent = () => {
    // Free: limite semanal atingido
    if (reason === 'weekly_limit' && isFree) {
      if (isWelcomeBonus) {
        return {
          icon: RefreshCcw,
          title: 'Bônus de boas-vindas usado',
          description: 'Você usou suas 2 correções gratuitas da primeira semana. No plano grátis você tem 1 correção por semana — ou assine o PRO para corrigir todos os dias.',
          cta: 'Ver plano PRO',
          showUpgrade: true,
        };
      }
      return {
        icon: Lock,
        title: 'Correção semanal usada',
        description: 'Você já usou sua correção gratuita desta semana. Sua cota renova em 7 dias — ou assine o PRO para corrigir redações todos os dias, sem esperar.',
        cta: 'Ver plano PRO',
        showUpgrade: true,
      };
    }

    if (reason === 'daily_limit') {
      return {
        icon: Calendar,
        title: 'Limite diário atingido',
        description: `Você atingiu o limite de correções de hoje. Volte amanhã para continuar praticando!${planType === 'free' ? ' O plano PRO oferece até 2 correções por dia.' : ''}`,
        cta: planType === 'free' ? 'Ver plano PRO' : 'Entendi',
        showUpgrade: planType === 'free',
      };
    }

    if (reason === 'monthly_limit') {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        icon: Zap,
        title: 'Limite mensal atingido',
        description: `Você usou todas as suas correções do mês. Sua cota renova em ${daysUntilReset} dia${daysUntilReset > 1 ? 's' : ''}.`,
        cta: 'Entendi',
        showUpgrade: false,
      };
    }

    return {
      icon: Lock,
      title: 'Limite atingido',
      description: 'Você atingiu seu limite de correções.',
      cta: 'Ver plano PRO',
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
