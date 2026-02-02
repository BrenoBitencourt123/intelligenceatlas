import { BlockStatus } from '@/types/atlas';
import { cn } from '@/lib/utils';
import { Circle, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface StatusPillProps {
  status: BlockStatus;
  className?: string;
}

const statusConfig: Record<BlockStatus, { label: string; className: string; icon: typeof Circle }> = {
  empty: {
    label: 'Vazio',
    className: 'status-pill-empty',
    icon: Circle,
  },
  draft: {
    label: 'Rascunho',
    className: 'status-pill-draft',
    icon: FileText,
  },
  analyzed: {
    label: 'Analisado',
    className: 'status-pill-analyzed',
    icon: CheckCircle2,
  },
  unavailable: {
    label: 'Indisponível',
    className: 'status-pill-unavailable',
    icon: AlertCircle,
  },
};

export const StatusPill = ({ status, className }: StatusPillProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <span className={cn('status-pill gap-1.5', config.className, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};
