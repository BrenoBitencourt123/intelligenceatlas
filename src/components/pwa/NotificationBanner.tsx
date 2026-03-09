import { useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

export function NotificationBanner() {
  const { permission, isSubscribed, isSupported, loading, subscribe, unsubscribe } = useNotifications();
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('atlas-notif-dismissed') === 'true'
  );

  if (!isSupported || permission === 'denied' || isSubscribed || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('Notificações ativadas! Você receberá lembretes diários.');
    } else if (Notification.permission === 'denied') {
      toast.error('Notificações bloqueadas. Habilite nas configurações do navegador.');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('atlas-notif-dismissed', 'true');
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center gap-3 p-4">
        <Bell className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Ativar lembretes diários</p>
          <p className="text-xs text-muted-foreground">
            Receba notificações com a área do dia e o tema da redação
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" onClick={handleEnable} disabled={loading}>
            {loading ? '...' : 'Ativar'}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
