import { Check, Zap, Crown, Loader2, Settings, Sparkles, Star } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmbeddedCheckoutModal } from '@/components/checkout/EmbeddedCheckoutModal';
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
  const [checkoutPlan, setCheckoutPlan] = useState<'basic' | 'pro' | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  // Calculate next reset date (first day of next month)
  const nextReset = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  }, []);

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

  const handleUpgrade = (targetPlan: 'basic' | 'pro') => {
    setCheckoutPlan(targetPlan);
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
    'Análise das 5 competências ENEM',
    'Versão melhorada da redação',
    'Histórico de redações',
  ];

  const proFeatures = [
    '60 correções por mês',
    'Tema do dia automático',
    'Contexto e fundamentação',
    'Perguntas norteadoras',
    'Estrutura sugerida',
    'Análise das 5 competências ENEM',
    'Versão melhorada da redação',
    'Histórico de redações',
  ];

  if (isCheckingSubscription) {
    return (
      <MainLayout>
        <div className="container max-w-5xl mx-auto px-4 py-8">
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
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Escolha seu plano</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Prepare-se para o ENEM com a melhor plataforma de correção de redações do Brasil
            </p>
          </div>

          {/* Usage Card for paying users */}
          {!isFree && (
            <Card className="border bg-muted/30">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Uso do mês</p>
                    <p className="text-xs text-muted-foreground">
                      Renova em {nextReset}
                    </p>
                  </div>
                  <div className="flex-1 max-w-xs space-y-1">
                    {isLoading ? (
                      <Skeleton className="h-2 w-full" />
                    ) : (
                      <>
                        <Progress value={usagePercentage} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                          {usedEssays}/{monthlyLimit} correções
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plans Grid - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Pro Plan Card - Featured */}
            <Card className={`relative flex flex-col border-2 ${isPro ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-amber-500/70'} bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent`}>
              {/* Recommended Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0 shadow-md">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Recomendado
                </Badge>
              </div>
              
              <CardHeader className="pb-4 pt-6">
                <div className="space-y-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    Pro
                    {isPro && (
                      <Badge variant="secondary" className="text-xs">Seu plano</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Preparação completa para o ENEM</CardDescription>
                </div>
                <div className="pt-2">
                  <p className="text-3xl font-bold text-foreground">
                    R$ {STRIPE_PLANS.pro.price.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2.5 flex-1">
                  {proFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-6">
                  {isPro ? (
                    <Button className="w-full bg-amber-500 hover:bg-amber-500" disabled>
                      Plano atual
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white" 
                      onClick={() => handleUpgrade('pro')}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {isBasic ? 'Fazer upgrade' : 'Começar agora'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Basic Plan Card */}
            <Card className={`relative flex flex-col ${isBasic ? 'border-2 border-primary ring-2 ring-primary/20' : 'border'}`}>
              <CardHeader className="pb-4">
                <div className="space-y-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Básico
                    {isBasic && (
                      <Badge variant="secondary" className="text-xs">Seu plano</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Para quem quer praticar mais</CardDescription>
                </div>
                <div className="pt-2">
                  <p className="text-3xl font-bold text-foreground">
                    R$ {STRIPE_PLANS.basic.price.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2.5 flex-1">
                  {basicFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-6">
                  {isBasic ? (
                    <Button className="w-full" variant="outline" disabled>
                      Plano atual
                    </Button>
                  ) : isPro ? (
                    <Button className="w-full" variant="outline" disabled>
                      Incluído no Pro
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpgrade('basic')}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Assinar Básico
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Free Plan Card */}
            <Card className={`relative flex flex-col ${isFree ? 'border-2 border-primary ring-2 ring-primary/20' : 'border'}`}>
              <CardHeader className="pb-4">
                <div className="space-y-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    Grátis
                    {isFree && (
                      <Badge variant="secondary" className="text-xs">Seu plano</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Experimente grátis</CardDescription>
                </div>
                <div className="pt-2">
                  <p className="text-3xl font-bold text-foreground">R$ 0</p>
                  <p className="text-xs text-muted-foreground">para sempre</p>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2.5 flex-1">
                  {freeFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-6">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled
                  >
                    {isFree ? 'Plano atual' : 'Gratuito'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Free user usage info */}
          {isFree && (
            <Card className="border bg-muted/30">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Sua redação gratuita</p>
                    <p className="text-xs text-muted-foreground">
                      {usedEssays >= 1 ? 'Você já usou sua redação gratuita' : 'Você tem 1 redação gratuita'}
                    </p>
                  </div>
                  <div className="flex-1 max-w-xs space-y-1">
                    {isLoading ? (
                      <Skeleton className="h-2 w-full" />
                    ) : (
                      <>
                        <Progress value={usagePercentage} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                          {usedEssays}/1 usada
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manage subscription for paying users */}
          {(isBasic || isPro) && (
            <div className="flex justify-center">
              <Button 
                className="gap-2" 
                variant="ghost"
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
            </div>
          )}
        </div>

        {/* Embedded Checkout Modal */}
        {checkoutPlan && (
          <EmbeddedCheckoutModal
            open={!!checkoutPlan}
            onOpenChange={(open) => !open && setCheckoutPlan(null)}
            priceId={STRIPE_PLANS[checkoutPlan].price_id!}
            planName={STRIPE_PLANS[checkoutPlan].name}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Plan;
