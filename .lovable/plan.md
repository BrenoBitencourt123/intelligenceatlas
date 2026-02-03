
# Plano: Corrigir Fluxo de Planos e Paridade Mobile

## Resumo

Este plano aborda os seguintes problemas identificados:

1. Usuarios novos entram como "Basico" quando deveriam ser "Free"
2. Features incorretas listadas no Plano Pro (promessas falsas)
3. Paridade mobile comprometida (nota nao aparece apos analise)
4. Hierarquia visual dos botoes confusa

---

## 1. Sistema de Planos Corrigido

### Estrutura Real dos Planos

| Plano   | Preco    | Limite        | Tema do Dia | Pedagogico | Versao Melhorada |
|---------|----------|---------------|-------------|------------|------------------|
| Free    | R$ 0     | 1 redacao     | Nao         | Nao        | Nao              |
| Basico  | R$ 29,90 | 30/mes (1/dia)| Nao         | Nao        | Sim              |
| Pro     | R$ 49,90 | 60/mes (2/dia)| Sim         | Sim        | Sim              |

### Alteracao no Banco de Dados

Atualizar o trigger `handle_new_user` para criar usuarios com `plan_type = 'free'`:

```sql
-- Alterar default da coluna
ALTER TABLE public.profiles 
ALTER COLUMN plan_type SET DEFAULT 'free';

-- Atualizar trigger para criar usuarios como Free
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan_type)
  VALUES (new.id, new.email, 'free');
  RETURN new;
END;
$$;
```

---

## 2. Alteracoes no Frontend

### 2.1. Constantes de Planos

**Arquivo: `src/lib/stripe.ts`**

Adicionar plano Free e corrigir limites do Pro:

```typescript
export const STRIPE_PLANS = {
  free: {
    product_id: null,
    price_id: null,
    name: 'Free',
    price: 0,
    limit: 1, // 1 redacao total
  },
  basic: {
    product_id: 'prod_TuYV8OLHKPqp3Y',
    price_id: 'price_1SwjOrLbqFmREm0fqfXpdc8L',
    name: 'Básico',
    price: 29.90,
    limit: 30, // 30/mes
  },
  pro: {
    product_id: 'prod_TuYWj1Y0ffKgoX',
    price_id: 'price_1SwjPWLbqFmREm0fpy8ef02R',
    name: 'Pro',
    price: 49.90,
    limit: 60, // 60/mes (2/dia)
  },
} as const;
```

### 2.2. Hook de Features

**Arquivo: `src/hooks/usePlanFeatures.ts`**

Refatorar para suportar tres planos com regras corretas:

```typescript
export const usePlanFeatures = () => {
  const { profile } = useAuth();
  const planType = profile?.plan_type || 'free';
  
  const isFree = planType === 'free';
  const isBasic = planType === 'basic';
  const isPro = planType === 'pro';
  
  return {
    planType,
    isFree,
    isBasic,
    isPro,
    // Tema do dia: apenas Pro
    hasThemeAccess: isPro,
    // Pedagogico: apenas Pro
    hasPedagogicalAccess: isPro,
    // Versao melhorada: Basic e Pro
    hasImprovedVersionAccess: isBasic || isPro,
    // Limites
    monthlyLimit: isPro ? 60 : isBasic ? 30 : 1,
    dailyLimit: isPro ? 2 : 1,
  };
};
```

### 2.3. Tipo do Perfil

**Arquivo: `src/contexts/AuthContext.tsx`**

Incluir 'free' no tipo:

```typescript
interface Profile {
  // ...
  plan_type: 'free' | 'basic' | 'pro';
}
```

### 2.4. Edge Function check-subscription

**Arquivo: `supabase/functions/check-subscription/index.ts`**

Atualizar mapeamento para incluir fallback 'free':

```typescript
const PRODUCT_TO_PLAN: Record<string, "free" | "basic" | "pro"> = {
  prod_TuYV8OLHKPqp3Y: "basic",
  prod_TuYWj1Y0ffKgoX: "pro",
};

// Quando nao tem assinatura:
return { subscribed: false, plan_type: "free", ... }
```

---

## 3. Tela de Planos (Plan.tsx)

### Problema Atual (Screenshot)

O Plano Pro mostra features que nao existem:
- "Correcoes ilimitadas" (FALSO - sao 60/mes)
- "Todos os temas anteriores" (NAO EXISTE)
- "Analise detalhada por paragrafo" (JA EXISTE NO BASICO)
- "Sugestoes de repertorio" (NAO EXISTE)
- "Prioridade no suporte" (NAO EXISTE)

### Correcao

**Arquivo: `src/pages/Plan.tsx`**

Mostrar 3 cards de plano (Free, Basico, Pro) com features reais:

```typescript
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
```

Adicionar logica para:
- Mostrar card do plano atual com destaque
- Usuarios Free verem opcoes de upgrade para Basico OU Pro
- Usuarios Basico verem opcao de upgrade para Pro
- Usuarios Pro verem botao de gerenciar assinatura

---

## 4. Paridade Mobile (MobileResultsBar)

### Problema

Apos analise, a nota nao aparece destacada na barra inferior mobile. O usuario precisa abrir o sheet para ver.

### Solucao

**Arquivo: `src/components/atlas/MobileResultsBar.tsx`**

1. Mostrar nota real quando disponivel (nao apenas estimatedScore)
2. Adicionar badge visual quando analise completa
3. Abrir sheet automaticamente apos primeira analise

```tsx
// Exibir nota real se disponivel
<span className="text-2xl font-bold">
  {state.totalScore > 0 ? state.totalScore : estimatedScore || '—'}
</span>

// Badge de analise completa
{state.totalScore > 0 && (
  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
    Analisado
  </Badge>
)}
```

---

## 5. Hierarquia Visual dos Botoes (Essay.tsx)

### Problema Atual (Screenshot)

Os 3 botoes estao alinhados horizontalmente com pesos visuais similares:
- "Colar e dividir"
- "Adicionar desenvolvimento"
- "Analisar tudo"

Isso causa confusao, especialmente no mobile.

### Solucao

**Arquivo: `src/pages/Essay.tsx`**

Reorganizar botoes com hierarquia clara:

```tsx
<div className="space-y-3 py-2">
  {/* Botoes secundarios - linha superior */}
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="sm" className="text-muted-foreground">
      <Scissors className="h-4 w-4 mr-1.5" />
      Colar e dividir
    </Button>
    <Button variant="ghost" size="sm" className="text-muted-foreground">
      <Plus className="h-4 w-4 mr-1.5" />
      Desenvolvimento
    </Button>
  </div>
  
  {/* Botao principal - destaque */}
  <Button
    size="lg"
    onClick={handleAnalyzeAll}
    disabled={!canAnalyze || isAnalyzingAll}
    className="w-full bg-foreground hover:bg-foreground/90 text-background"
  >
    <Sparkles className="h-5 w-5 mr-2" />
    Analisar redação
  </Button>
</div>
```

Mudancas visuais:
- Botoes secundarios: `variant="ghost"`, `size="sm"`, cor muted
- Botao principal: `size="lg"`, `w-full`, alto contraste
- Espaco vertical entre grupos

---

## 6. Bloqueio de Features por Plano

### Tela de Redacao

**Arquivo: `src/components/atlas/PedagogicalSection.tsx`**

Receber `planType` e mostrar conteudo bloqueado para Free/Basic:

```tsx
interface Props {
  theme: DailyTheme;
  planType: 'free' | 'basic' | 'pro';
}

export const PedagogicalSection = ({ theme, planType }: Props) => {
  if (planType !== 'pro') {
    return <LockedPedagogicalCard />;
  }
  // Mostrar cards normalmente
};
```

### Versao Melhorada

**Arquivo: `src/components/atlas/ResultPanel.tsx`**

Bloquear botao "Gerar versao melhorada" para usuarios Free:

```tsx
{/* Verificar se usuario pode gerar */}
{!hasImprovedVersionAccess ? (
  <div className="text-center p-4 bg-muted/30 rounded-lg">
    <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">
      Versão melhorada disponível no Plano Básico
    </p>
    <Button variant="outline" size="sm" className="mt-3">
      Ver planos
    </Button>
  </div>
) : (
  <Button onClick={onGenerateImproved}>...</Button>
)}
```

---

## Arquivos a Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| Migracao SQL | Criar | Alterar trigger e default para 'free' |
| `src/lib/stripe.ts` | Editar | Adicionar plano Free, corrigir limites |
| `src/contexts/AuthContext.tsx` | Editar | Tipo plan_type incluir 'free' |
| `src/hooks/usePlanFeatures.ts` | Editar | Refatorar para 3 planos |
| `src/pages/Plan.tsx` | Editar | 3 cards com features reais |
| `src/pages/Essay.tsx` | Editar | Hierarquia de botoes |
| `src/pages/Home.tsx` | Editar | Adaptar para 3 planos |
| `src/components/atlas/MobileResultsBar.tsx` | Editar | Exibir nota real |
| `src/components/atlas/PedagogicalSection.tsx` | Editar | Receber planType |
| `src/components/atlas/ResultPanel.tsx` | Editar | Bloquear versao melhorada para Free |
| `supabase/functions/check-subscription/index.ts` | Editar | Fallback para 'free' |

---

## Secao Tecnica

### Migracao de Usuarios Existentes

Usuarios atuais com `plan_type = 'basic'` sem assinatura Stripe ativa deveriam ser 'free'. Opcoes:

1. **Nao migrar automaticamente**: Manter usuarios existentes como 'basic' e apenas novos entram como 'free'
2. **Migrar via query**: Atualizar todos sem assinatura para 'free' (requer verificacao manual)

Recomendacao: Opcao 1 por seguranca, para nao afetar usuarios existentes negativamente.

### Ordem de Implementacao

1. Migracao do banco (trigger + default)
2. Atualizar edge function check-subscription
3. Atualizar tipos e constantes frontend
4. Refatorar usePlanFeatures
5. Atualizar Plan.tsx (features reais)
6. Atualizar Essay.tsx (botoes + bloqueios)
7. Atualizar MobileResultsBar (paridade)
8. Testar fluxos completos
