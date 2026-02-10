import { useCallback, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Load Stripe with publishable key
const stripePromise = loadStripe('pk_live_51SwmwuLCrHbXOvxe3vDTpLjWPUqI8L0FPx3p1jgQy8NmXDT0DdJYuqVzFHQ3EvFQFfGe45g7UJGJSJhVl8fhXjzU00xLJvNzjz');

export interface EmbeddedCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceId: string;
  planName: string;
  couponId?: string;
}

export const EmbeddedCheckoutModal = ({
  open,
  onOpenChange,
  priceId,
  planName,
  couponId,
}: EmbeddedCheckoutModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const fetchClientSecret = useCallback(async () => {
    setError(null);
    try {
      const body: Record<string, string> = { price_id: priceId };
      if (couponId) body.coupon_id = couponId;

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body,
      });

      if (error) throw error;
      if (!data?.clientSecret) throw new Error('No client secret received');

      return data.clientSecret;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar checkout';
      setError(message);
      throw err;
    }
  }, [priceId, couponId]);

  const options = { fetchClientSecret };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Assinar Plano {planName}</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          {!session ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          ) : (
            <div id="checkout" className="min-h-[400px]">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
