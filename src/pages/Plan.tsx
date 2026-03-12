import { Check, Crown, Loader2, Settings, Star, Clock, Tag } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { PlanSkeleton } from '@/components/skeletons/PlanSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { EmbeddedCheckoutModal } from '@/components/checkout/EmbeddedCheckoutModal';
import { useUserStats } from '@/hooks/useUserStats';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { STRIPE_PLANS, getMonthsUntilEnem, getDiscountTier } from '@/lib/stripe';

const Plan = () => {
  const { planType, isFree, isPro, monthlyLimit } = usePlanFeatures();
  const { monthlyEssays, totalEssays, isLoading } = useUserStats();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'pro' | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [useEnemDiscount, setUseEnemDiscount] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  const monthsUntilEnem = useMemo(() => getMonthsUntilEnem(), []);
  const discountTier = useMemo(() => getDiscountTier(monthsUntilEnem), [monthsUntilEnem]);
  const [checkoutCouponId, setCheckoutCouponId] = useState<string | undefined>(undefined);

  // Calculate next reset date (first day of next month)
  const nextReset = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  }, []);

  // Usage calculation
  const usedEssays = isFree ? totalEssays : monthlyEssays;
  const usagePercentage = Math.min(100, Math.round((usedEssays / monthlyLimit) * 100));

  const getDiscountedPrice = (basePrice: number) => {
    if (!useEnemDiscount || !discountTier) return basePrice;
    return basePrice * (1 - discountTier.percent / 100);
  };

  const checkSubscription = useCallback(async () => {
    setIsCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      if (data?.subscribed) {
        toast.success('Assinatura PRO ativada!');
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

  const handleUpgrade = (targetPlan: 'pro') => {
    // Priority: promo code > ENEM discount > none
    const coupon = promoCode.trim() || (useEnemDiscount && discountTier ? discountTier.id : undefined);
    setCheckoutCouponId(coupon || undefined);
    setCheckoutPlan(targetPlan);
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        const errorData = error.message ? JSON.parse(error.message) : null;
        if (errorData?.error?.includes('No Stripe customer found')) {
          toast.error('Nenhuma assinatura encontrada. Entre em contato com o suporte.');
          return;
        }
        throw error;
      }

      if (data?.error) {
        if (data.error.includes('No Stripe customer found')) {
          toast.error('Nenhuma assinatura encontrada. Entre em contato com o suporte.');
          return;
        }
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Erro ao abrir portal. Entre em contato com o suporte.');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  // Features reais de cada plano
  const freeFeatures = [
    '5 questões por área (one-time)',
    '1 redação gratuita',
    'Editor completo',
    'Feedback resumido',
  ];

  const proFeatures = [
    'Questões ilimitadas em todas as áreas',
    '60 redações por mês',
    'Tema do dia automático',
    'Contexto e fundamentação',
    'Perguntas norteadoras',
    'Estrutura sugerida',
    'Análise das 5 competências ENEM',
    'Versão melhorada da redação',
    'Histórico de redações',
    'Sessões completas (20 questões) com 3 blocos',
    'Flashcards automáticos ao errar',
    'Cápsulas de conhecimento',
  ];

  if (isCheckingSubscription) {
    return <PlanSkeleton />;
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

          {/* Promo code — prominent placement */}
          {isFree && (
            <Card className="border-2 border-primary/30 bg-primary/5 max-w-md mx-auto w-full">
              <CardContent className="py-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Tem um código promocional?</p>
                  </div>
                  <div className="flex items-center gap-2 w-full max-w-[280px]">
                    <Input
                      placeholder="Digite seu código"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="h-10 text-center text-sm uppercase font-semibold tracking-wider"
                    />
                  </div>
                  {promoCode && (
                    <p className="text-xs text-primary font-medium">
                      ✓ Código "{promoCode}" será aplicado no checkout
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Discount toggle */}
          {isFree && discountTier && monthsUntilEnem >= 3 && (
            <Card className="border border-amber-500/30 bg-amber-500/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <p className="text-sm font-medium text-foreground">
                        Até o ENEM ({monthsUntilEnem} meses)
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Assine por {monthsUntilEnem} meses e ganhe {discountTier.percent}% de desconto
                    </p>
                  </div>
                  <Switch
                    checked={useEnemDiscount}
                    onCheckedChange={setUseEnemDiscount}
                  />
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Plans Grid - 2 columns: Free + PRO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto w-full">
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
                  <CardDescription>Degustação — experimente sem compromisso</CardDescription>
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
                  <Button className="w-full" variant="outline" disabled>
                    {isFree ? 'Plano atual' : 'Gratuito'}
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                    PRO
                    {isPro && (
                      <Badge variant="secondary" className="text-xs">Seu plano</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Preparação completa e ilimitada para o ENEM</CardDescription>
                </div>
                <div className="pt-2">
                  {useEnemDiscount && discountTier ? (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground line-through">
                        R$ {STRIPE_PLANS.pro.price.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        R$ {getDiscountedPrice(STRIPE_PLANS.pro.price).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        -{discountTier.percent}% · Total: R$ {(getDiscountedPrice(STRIPE_PLANS.pro.price) * monthsUntilEnem).toFixed(2).replace('.', ',')} por {monthsUntilEnem} meses
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-foreground">
                        R$ {STRIPE_PLANS.pro.price.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-muted-foreground">/mês</p>
                    </>
                  )}
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
                      Começar agora
                    </Button>
                  )}
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
          {isPro && (
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
            couponId={checkoutCouponId}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Plan;
