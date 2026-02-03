

# Plano Completo: Bloqueio de Cota + Correções Críticas

## Resumo

Este plano implementa três correções críticas:

1. **Bloqueio de cota por plano** - Validação frontend e backend
2. **Correção do erro ao criar conta** - Atualizar constraint do banco que rejeita 'free'
3. **Correção da tela de resultados no desktop** - Limitar Sheet apenas ao mobile

---

## Problema 1: Erro ao criar conta

### Causa Raiz

Existe uma CHECK CONSTRAINT na tabela `profiles` que aceita apenas 'basic' ou 'pro':

```sql
CHECK ((plan_type = ANY (ARRAY['basic'::text, 'pro'::text])))
```

O trigger `handle_new_user` tenta inserir `'free'`, causando o erro:
> "Database error saving new user"

### Solucao

Atualizar a constraint para incluir 'free':

**Arquivo:** Nova migracao SQL

```sql
-- Remover constraint antiga
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_plan_type_check;

-- Criar nova constraint incluindo 'free'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_plan_type_check 
CHECK (plan_type IN ('free', 'basic', 'pro'));
```

---

## Problema 2: Tela de resultados aparece no desktop

### Causa Raiz

O componente `MobileResultsBar` usa um `Sheet` (modal) que renderiza via Portal. Mesmo o componente pai tendo `md:hidden`, o `useEffect` abre o Sheet quando a analise completa:

```tsx
useEffect(() => {
  if (hasAnalysis && analyzedCount === totalCount) {
    setOpen(true); // Abre mesmo no desktop!
  }
}, [hasAnalysis, analyzedCount, totalCount]);
```

### Solucao

Usar o hook `useIsMobile` para so abrir o Sheet em dispositivos moveis:

**Arquivo:** `src/components/atlas/MobileResultsBar.tsx`

```tsx
import { useIsMobile } from '@/hooks/use-mobile';

// Dentro do componente:
const isMobile = useIsMobile();

useEffect(() => {
  // So abre automaticamente no mobile
  if (isMobile && hasAnalysis && analyzedCount === totalCount) {
    setOpen(true);
  }
}, [isMobile, hasAnalysis, analyzedCount, totalCount]);
```

---

## Problema 3: Bloqueio de cota por plano

### Estrutura de Limites

| Plano  | Limite Total/Mensal | Limite Diario |
|--------|---------------------|---------------|
| Free   | 1 (total, permanente) | N/A         |
| Basico | 30/mes              | 1/dia         |
| Pro    | 60/mes              | 2/dia         |

### Etapa 3.1: Atualizar useUserStats

Adicionar contagem de analises do dia atual.

**Arquivo:** `src/hooks/useUserStats.ts`

Adicionar:
- `todayAnalyzedCount: number` - analises feitas hoje (com `analyzed_at` no dia atual)

### Etapa 3.2: Criar hook useQuotaCheck

**Novo arquivo:** `src/hooks/useQuotaCheck.ts`

Funcionalidades:
- Combina dados de `useUserStats` e `usePlanFeatures`
- Verifica limite mensal (ou total para Free)
- Verifica limite diario
- Retorna: `{ canAnalyze, reason, remaining, isLoading }`

Logica:
```typescript
// Free: bloqueado apos 1 uso TOTAL (nao mensal)
if (isFree) {
  if (totalEssays >= 1) {
    return { canAnalyze: false, reason: 'limit_reached' };
  }
}

// Basic/Pro: verificar limite mensal E diario
if (monthlyEssays >= monthlyLimit) {
  return { canAnalyze: false, reason: 'monthly_limit' };
}
if (todayAnalyzedCount >= dailyLimit) {
  return { canAnalyze: false, reason: 'daily_limit' };
}

return { canAnalyze: true, remaining: monthlyLimit - monthlyEssays };
```

### Etapa 3.3: Criar modal de paywall

**Novo arquivo:** `src/components/atlas/QuotaExceededModal.tsx`

Componente modal que exibe:
- Mensagem baseada no plano e motivo do bloqueio:
  - Free: "Voce usou sua redacao gratuita. Assine para continuar praticando!"
  - Basic/Pro (diario): "Voce atingiu seu limite diario. Volte amanha!"
  - Basic/Pro (mensal): "Voce atingiu seu limite mensal. Renova em X dias."
- Botao para ir a pagina de planos (para upgrade)
- Estilo consistente com o app (usando Dialog do shadcn)

### Etapa 3.4: Integrar na pagina Essay.tsx

**Arquivo:** `src/pages/Essay.tsx`

Modificacoes:
1. Importar `useQuotaCheck` e `QuotaExceededModal`
2. Adicionar estado para mostrar modal: `[showQuotaModal, setShowQuotaModal]`
3. Modificar `handleAnalyzeAll`:
   - Verificar `canAnalyze` antes de processar
   - Se nao pode, abrir o modal de paywall
4. Desabilitar botao "Analisar redacao" visualmente quando sem cota

```tsx
const { canAnalyze: hasQuota, reason } = useQuotaCheck();

const handleAnalyzeAll = async () => {
  if (!hasQuota) {
    setShowQuotaModal(true);
    return;
  }
  // ... resto do codigo
};
```

### Etapa 3.5: Validacao no Backend (seguranca)

**Arquivo:** `supabase/functions/analyze-essay/index.ts`

Apos autenticar o usuario:
1. Buscar `plan_type` da tabela `profiles`
2. Contar essays com `analyzed_at` no mes atual
3. Contar essays com `analyzed_at` no dia atual
4. Verificar contra limites
5. Retornar 403 se limite excedido

```typescript
// Buscar plano do usuario
const { data: profile } = await supabaseClient
  .from('profiles')
  .select('plan_type')
  .eq('id', user.id)
  .single();

const planType = profile?.plan_type || 'free';

// Contar uso
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const { count: monthlyCount } = await supabaseClient
  .from('essays')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .not('analyzed_at', 'is', null)
  .gte('analyzed_at', startOfMonth.toISOString());

// Verificar limites
const limits = {
  free: { monthly: 1, daily: 1 },
  basic: { monthly: 30, daily: 1 },
  pro: { monthly: 60, daily: 2 },
};

if (monthlyCount >= limits[planType].monthly) {
  return new Response(
    JSON.stringify({ 
      error: 'Limite de correções atingido',
      code: 'QUOTA_EXCEEDED',
      limit_type: 'monthly'
    }),
    { status: 403, headers: corsHeaders }
  );
}
```

---

## Fluxo Visual

```text
Usuario clica "Analisar"
        |
        v
+--------------------+
| Frontend: Check    |
| useQuotaCheck      |
+--------------------+
        |
   canAnalyze?
   /         \
  Sim        Nao
   |          |
   v          v
+--------+  +----------------+
| API    |  | Modal Paywall  |
| Call   |  | (upgrade CTA)  |
+--------+  +----------------+
   |
   v
+-------------------------+
| Backend: Validacao      |
| - Busca plan_type       |
| - Conta uso mensal/dia  |
| - Verifica limites      |
+-------------------------+
   |
   v
 Quota OK?
  /     \
Sim      Nao
 |        |
 v        v
AI     403 + JSON
       code: QUOTA_EXCEEDED
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useQuotaCheck.ts` | Hook de verificacao de cota |
| `src/components/atlas/QuotaExceededModal.tsx` | Modal de paywall/upgrade |

## Arquivos a Modificar

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| Nova migracao SQL | Corrigir constraint `profiles_plan_type_check` para incluir 'free' |
| `src/hooks/useUserStats.ts` | Adicionar `todayAnalyzedCount` |
| `src/components/atlas/MobileResultsBar.tsx` | Usar `useIsMobile` no useEffect |
| `src/pages/Essay.tsx` | Integrar verificacao de cota e modal |
| `supabase/functions/analyze-essay/index.ts` | Adicionar validacao de cota no backend |

---

## Secao Tecnica

### Tratamento de Erro no Frontend

Quando o backend retorna 403 com `code: 'QUOTA_EXCEEDED'`:
- Frontend deve exibir o modal de paywall
- Mensagem amigavel baseada em `limit_type` ('monthly', 'daily', 'total')

### Calculo de Datas

```typescript
// Inicio do mes atual
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

// Inicio do dia atual
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);
```

### Queries Supabase

```typescript
// Contar analises do mes
const { count } = await supabase
  .from('essays')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .not('analyzed_at', 'is', null)
  .gte('analyzed_at', startOfMonth.toISOString());

// Contar analises do dia
const { count: todayCount } = await supabase
  .from('essays')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .not('analyzed_at', 'is', null)
  .gte('analyzed_at', startOfToday.toISOString());
```

