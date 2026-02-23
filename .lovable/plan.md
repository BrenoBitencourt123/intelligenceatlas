

# Auditoria e Correção do Sistema de Planos Atlas

## Resultado da Auditoria

### O que FUNCIONA corretamente
- Checkout embedded com Stripe (create-checkout) -- funcional
- Verificação de assinatura (check-subscription) -- parcialmente funcional
- Redação: enforcement no backend (analyze-essay) bloqueia Free apos 1 redação -- OK
- Redação: enforcement no frontend (useQuotaCheck) -- OK
- Página de planos (/plano) mostra apenas Free e Pro -- OK
- Portal do Stripe para gerenciar assinatura -- OK

### O que está QUEBRADO ou INCONSISTENTE

| # | Problema | Impacto | Arquivos |
|---|---|---|---|
| 1 | **Limite de questões é 5 POR ÁREA, não 5 TOTAL** | Free pode fazer 20 questões (5 x 4 áreas) em vez de 5 total | `useFreeAreaQuota.ts`, `usePlanFeatures.ts`, `Objectives.tsx` |
| 2 | **`STRIPE_PLANS` ainda tem plano `basic`** | Código referencia plano inexistente; PlanType exporta 3 tipos | `src/lib/stripe.ts` |
| 3 | **`check-subscription` mapeia produto para `basic`** | Se alguém assinou o Básico antigo, recebe tipo `basic` no DB | `check-subscription/index.ts` |
| 4 | **`analyze-essay` tem limites para `basic` (30/mês, 1/dia)** | Backend aceita plano intermediário que não deveria existir | `analyze-essay/index.ts` |
| 5 | **Cancelamento NÃO reverte plano para `free`** | Quando não há assinatura ativa, `check-subscription` retorna `free` mas NÃO atualiza o profiles. Usuário que cancela mantém `pro` no banco eternamente | `check-subscription/index.ts` |
| 6 | **Sem enforcement de questões no backend** | O limite de 5 questões é apenas frontend. Nada impede chamadas diretas à API | Sem validação server-side |

---

## Plano de Correções

### 1. Corrigir limite de questões: 5 TOTAL (não por área)

**Arquivo: `src/hooks/useFreeAreaQuota.ts`**
- Mudar a lógica para contar o TOTAL de tentativas do usuário (soma de todas as áreas), não por área individual
- `isAreaLocked` passa a verificar se o total global >= 5 (qualquer área fica bloqueada quando o total atinge 5)

**Arquivo: `src/pages/Objectives.tsx`**
- Ajustar textos: "5 questões gratuitas" em vez de "5 questões nesta área"
- O lock deve aparecer quando o total global >= 5

### 2. Remover plano `basic` do `STRIPE_PLANS`

**Arquivo: `src/lib/stripe.ts`**
- Remover a entrada `basic` do objeto `STRIPE_PLANS`
- Tipo `PlanType` passa a ser apenas `'free' | 'pro'`

### 3. Corrigir `check-subscription` -- mapear tudo para `pro` e reverter cancelamentos

**Arquivo: `supabase/functions/check-subscription/index.ts`**
- Remover `basic` do `PRODUCT_TO_PLAN` -- ambos os product IDs mapeiam para `pro`
- Quando NÃO há assinatura ativa mas o customer existe: atualizar `profiles.plan_type` para `'free'` (reverte cancelamentos)
- Quando NÃO há customer: também garantir que profile está como `'free'`

### 4. Remover limites de `basic` do backend de redações

**Arquivo: `supabase/functions/analyze-essay/index.ts`**
- Remover entrada `basic` do objeto `limits`
- Manter apenas `free` (1 total) e `pro` (60/mês, 2/dia)
- Se `planType` for `basic` (legado), tratar como `pro`

### 5. Redeploy das edge functions alteradas

Funções que precisam ser redeployadas:
- `check-subscription`
- `analyze-essay`

---

## Resumo das mudanças

| Arquivo | Mudança |
|---|---|
| `src/hooks/useFreeAreaQuota.ts` | Contar questões TOTAL em vez de por área |
| `src/lib/stripe.ts` | Remover plano `basic` |
| `supabase/functions/check-subscription/index.ts` | Mapear basic para pro, reverter cancelamentos para free |
| `supabase/functions/analyze-essay/index.ts` | Remover limites de basic |
| `src/pages/Objectives.tsx` | Ajustar textos do limite de questões |

