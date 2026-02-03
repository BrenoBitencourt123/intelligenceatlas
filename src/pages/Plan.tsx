import { Check, Lock, Zap, Crown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const Plan = () => {
  // Mock data
  const currentPlan = {
    name: 'Básico',
    price: 29.90,
    used: 12,
    total: 30,
    nextReset: '15 de fevereiro',
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

  const usagePercentage = Math.round((currentPlan.used / currentPlan.total) * 100);

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
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">Plano {currentPlan.name}</CardTitle>
                    <Badge variant="secondary">Atual</Badge>
                  </div>
                  <CardDescription>
                    Próxima renovação: {currentPlan.nextReset}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    R$ {currentPlan.price.toFixed(2).replace('.', ',')}
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
                  <span className="font-medium text-foreground">
                    {currentPlan.used}/{currentPlan.total} correções
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {currentPlan.total - currentPlan.used} correções restantes
                </p>
              </div>

              <Separator />

              {/* Features */}
              <ul className="space-y-2">
                {basicFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Pro Plan Card - Locked */}
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
                  R$ 49,90
                </p>
                <p className="text-xs text-muted-foreground">/mês</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          <Button className="w-full gap-2" size="lg" disabled>
            <Crown className="h-4 w-4" />
            Fazer upgrade para Pro (em breve)
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Plan;
