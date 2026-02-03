import { Check, Lock, Zap, Crown, Loader2, Settings } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStats } from '@/hooks/useUserStats';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { STRIPE_PLANS } from '@/lib/stripe';

const Plan = () => {
  const { profile } = useAuth();
  const { monthlyEssays, isLoading } = useUserStats();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const isPro = profile?.plan_type === 'pro';

  // Calculate next reset date (first day of next month)
  const nextReset = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  }, []);

  // Plan config based on profile
  const planConfig = useMemo(() => {
    if (isPro) {
      return STRIPE_PLANS.pro;
    }
    return STRIPE_PLANS.basic;
  }, [isPro]);

  const usagePercentage = Math.min(100, Math.round((monthlyEssays / planConfig.limit) * 100));

  const checkSubscription = useCallback(async () => {
    setIsCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      if (data?.subscribed && data?.plan_type === 'pro') {
        toast.success('Assinatura Pro ativada com sucesso!');
        // Force page reload to update profile data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsCheckingSubscription(false);
    }
  }, []);

  // Check for success parameter and verify subscription
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      // Clear the success parameter
      setSearchParams({}, { replace: true });
      checkSubscription();
    }
  }, [searchParams, setSearchParams, checkSubscription]);

  const handleUpgrade = async () => {
    setIsCreatingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: STRIPE_PLANS.pro.price_id }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Erro ao abrir portal. Tente novamente.');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const basicFeatures = [
    '30 correções por mês',
    'Tema do dia liberado',
    'Análise das 5 competências',
    'Versão melhorada',
  ];

  const proFeatures = [
    'Correções ilimitadas',
    'Todos os temas anteriores',
    'Análise detalhada por parágrafo',
    'Sugestões de repertório',
    'Histórico completo',
    'Prioridade no suporte',
  ];

  if (isCheckingSubscription) {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando sua assinatura...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Seu Plano</h1>
            <p className="text-muted-foreground">
              Gerencie sua assinatura e veja seu uso
            </p>
          </div>

          {/* Current Plan Card */}
          <Card className={isPro ? "border-2 border-amber-500" : "border-2 border-primary"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isPro && <Crown className="h-5 w-5 text-amber-500" />}
                    <CardTitle className="text-xl">Plano {planConfig.name}</CardTitle>
                    <Badge variant="secondary">Atual</Badge>
                  </div>
                  <CardDescription>
                    Próxima renovação: {nextReset}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    R$ {planConfig.price.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uso do mês</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    <span className="font-medium text-foreground">
                      {monthlyEssays}/{isPro ? '∞' : planConfig.limit} correções
                    </span>
                  )}
                </div>
                {!isPro && (
                  <>
                    {isLoading ? (
                      <Skeleton className="h-2 w-full" />
                    ) : (
                      <Progress value={usagePercentage} className="h-2" />
                    )}
                    {isLoading ? (
                      <Skeleton className="h-3 w-32" />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {Math.max(0, planConfig.limit - monthlyEssays)} correções restantes
                      </p>
                    )}
                  </>
                )}
              </div>

              <Separator />

              {/* Features */}
              <ul className="space-y-2">
                {(isPro ? proFeatures : basicFeatures).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Pro Plan Card - Only show if not Pro */}
          {!isPro && (
            <Card className="relative overflow-hidden opacity-75">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 z-10 pointer-events-none" />
              <div className="absolute top-4 right-4 z-20">
                <Badge variant="outline" className="gap-1 bg-background">
                  <Lock className="h-3 w-3" />
                  Bloqueado
                </Badge>
              </div>
              
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-xl">Plano Pro</CardTitle>
                </div>
                <CardDescription>
                  Para quem quer treinar sem limites
                </CardDescription>
                <div className="pt-2">
                  <p className="text-2xl font-bold text-foreground">
                    R$ {STRIPE_PLANS.pro.price.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {proFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* CTA Buttons */}
          {isPro ? (
            <Button 
              className="w-full gap-2" 
              size="lg" 
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isOpeningPortal}
            >
              {isOpeningPortal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              Gerenciar assinatura
            </Button>
          ) : (
            <Button 
              className="w-full gap-2" 
              size="lg" 
              onClick={handleUpgrade}
              disabled={isCreatingCheckout}
            >
              {isCreatingCheckout ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              Fazer upgrade para Pro
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Plan;
