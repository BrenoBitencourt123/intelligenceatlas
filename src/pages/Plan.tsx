import { Check, Lock, Zap, Crown, Loader2, Settings, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStats } from '@/hooks/useUserStats';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { STRIPE_PLANS } from '@/lib/stripe';

const Plan = () => {
  const { planType, isFree, isBasic, isPro, monthlyLimit } = usePlanFeatures();
  const { monthlyEssays, totalEssays, isLoading } = useUserStats();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  // Calculate next reset date (first day of next month)
  const nextReset = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  }, []);

  // Get current plan config
  const currentPlanConfig = useMemo(() => {
    return STRIPE_PLANS[planType] || STRIPE_PLANS.free;
  }, [planType]);

  // Usage calculation
  const usedEssays = isFree ? totalEssays : monthlyEssays;
  const usagePercentage = Math.min(100, Math.round((usedEssays / monthlyLimit) * 100));

  const checkSubscription = useCallback(async () => {
    setIsCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      if (data?.subscribed) {
        toast.success(`Assinatura ${data.plan_type === 'pro' ? 'Pro' : 'Básica'} ativada!`);
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
      setSearchParams({}, { replace: true });
      checkSubscription();
    }
  }, [searchParams, setSearchParams, checkSubscription]);

  const handleUpgrade = async (targetPlan: 'basic' | 'pro') => {
    setIsCreatingCheckout(targetPlan);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: STRIPE_PLANS[targetPlan].price_id }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setIsCreatingCheckout(null);
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

  // Features reais de cada plano
  const freeFeatures = [
    '1 redação gratuita',
    'Editor completo',
    'Feedback resumido',
  ];

  const basicFeatures = [
    '30 correções por mês',
    'Análise das 5 competências',
    'Versão melhorada',
    'Histórico de redações',
  ];

  const proFeatures = [
    'Até 2 correções por dia',
    'Tema do dia automático',
    'Contexto e fundamentação',
    'Perguntas norteadoras',
    'Estrutura sugerida',
    'Versão melhorada',
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
          <Card className={isPro ? "border-2 border-amber-500" : isBasic ? "border-2 border-primary" : "border-2 border-muted"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isPro && <Crown className="h-5 w-5 text-amber-500" />}
                    {isBasic && <Zap className="h-5 w-5 text-primary" />}
                    <CardTitle className="text-xl">Plano {currentPlanConfig.name}</CardTitle>
                    <Badge variant="secondary">Atual</Badge>
                  </div>
                  <CardDescription>
                    {isFree 
                      ? 'Experimente o Atlas gratuitamente'
                      : `Próxima renovação: ${nextReset}`}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {currentPlanConfig.price === 0 
                      ? 'Grátis'
                      : `R$ ${currentPlanConfig.price.toFixed(2).replace('.', ',')}`}
                  </p>
                  {currentPlanConfig.price > 0 && (
                    <p className="text-xs text-muted-foreground">/mês</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isFree ? 'Redações usadas' : 'Uso do mês'}
                  </span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    <span className="font-medium text-foreground">
                      {usedEssays}/{monthlyLimit} {isFree ? 'redação' : 'correções'}
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <Skeleton className="h-2 w-full" />
                ) : (
                  <Progress value={usagePercentage} className="h-2" />
                )}
                {!isLoading && (
                  <p className="text-xs text-muted-foreground">
                    {isFree && usedEssays >= 1 
                      ? 'Você usou sua redação gratuita'
                      : `${Math.max(0, monthlyLimit - usedEssays)} ${isFree ? 'redação restante' : 'correções restantes'}`}
                  </p>
                )}
              </div>

              <Separator />

              {/* Features */}
              <ul className="space-y-2">
                {(isFree ? freeFeatures : isBasic ? basicFeatures : proFeatures).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Upgrade options for Free users */}
          {isFree && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Escolha um plano</h2>
              
              {/* Basic Plan Card */}
              <Card className="border-2 border-primary/50 hover:border-primary transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Plano Básico</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        R$ {STRIPE_PLANS.basic.price.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-muted-foreground">/mês</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5">
                    {basicFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpgrade('basic')}
                    disabled={isCreatingCheckout !== null}
                  >
                    {isCreatingCheckout === 'basic' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Assinar Básico
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan Card */}
              <Card className="border-2 border-amber-500/50 hover:border-amber-500 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-500" />
                      <CardTitle className="text-lg">Plano Pro</CardTitle>
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                        Recomendado
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        R$ {STRIPE_PLANS.pro.price.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-muted-foreground">/mês</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5">
                    {proFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-amber-500" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white" 
                    onClick={() => handleUpgrade('pro')}
                    disabled={isCreatingCheckout !== null}
                  >
                    {isCreatingCheckout === 'pro' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-2" />
                        Assinar Pro
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Upgrade option for Basic users */}
          {isBasic && (
            <Card className="border-2 border-amber-500/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-lg">Fazer upgrade para Pro</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      R$ {STRIPE_PLANS.pro.price.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-muted-foreground">/mês</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Desbloqueie o tema do dia e orientações completas para sua redação.
                </p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-amber-500" />
                    <span className="text-foreground">Tema do dia automático</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-amber-500" />
                    <span className="text-foreground">Contexto e perguntas norteadoras</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-amber-500" />
                    <span className="text-foreground">Até 2 correções por dia</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white" 
                  onClick={() => handleUpgrade('pro')}
                  disabled={isCreatingCheckout !== null}
                >
                  {isCreatingCheckout === 'pro' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Fazer upgrade para Pro
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Manage subscription for paying users */}
          {(isBasic || isPro) && (
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
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Plan;
