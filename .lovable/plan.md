

# Plano: Integrar Stripe para Pagamentos de Assinatura

## Visao Geral

Implementar fluxo completo de assinatura com Stripe, permitindo que usuarios do Plano Basico facam upgrade para o Plano Pro, e que novos usuarios escolham seu plano.

## Produtos Criados no Stripe

| Plano   | Product ID           | Price ID                          | Valor     |
|---------|----------------------|-----------------------------------|-----------|
| Basico  | prod_TuYV8OLHKPqp3Y  | price_1SwjOrLbqFmREm0fqfXpdc8L    | R$ 29,90  |
| Pro     | prod_TuYWj1Y0ffKgoX  | price_1SwjPWLbqFmREm0fpy8ef02R    | R$ 49,90  |

## Arquitetura do Fluxo

```text
+------------------+     +------------------+     +------------------+
|  Plan.tsx        |     | create-checkout  |     | Stripe Checkout  |
|  (Frontend)      | --> | (Edge Function)  | --> | (Pagina Stripe)  |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +------------------+     +------------------+
|  profiles.       | <-- | check-sub        | <-- | Success Page     |
|  plan_type='pro' |     | (Edge Function)  |     | /plano?success   |
+------------------+     +------------------+     +------------------+
```

## Edge Functions a Criar

### 1. create-checkout

Cria sessao de checkout no Stripe para assinatura.

- Recebe: `price_id` (qual plano)
- Busca/cria customer no Stripe pelo email do usuario
- Retorna URL do checkout
- Success URL: `/plano?success=true`
- Cancel URL: `/plano`

### 2. check-subscription

Verifica status da assinatura do usuario no Stripe.

- Busca customer pelo email
- Verifica assinaturas ativas
- Retorna: `subscribed`, `product_id`, `subscription_end`
- Chamado apos login e apos retorno do checkout

### 3. customer-portal

Permite usuario gerenciar assinatura (cancelar, trocar cartao).

- Cria sessao do Customer Portal do Stripe
- Retorna URL do portal

## Modificacoes no Frontend

### 1. Constantes de Planos

Criar mapeamento entre planos e IDs do Stripe:

```typescript
const STRIPE_PLANS = {
  basic: {
    product_id: 'prod_TuYV8OLHKPqp3Y',
    price_id: 'price_1SwjOrLbqFmREm0fqfXpdc8L',
    name: 'Básico',
    price: 29.90,
    limit: 30,
  },
  pro: {
    product_id: 'prod_TuYWj1Y0ffKgoX',
    price_id: 'price_1SwjPWLbqFmREm0fpy8ef02R',
    name: 'Pro',
    price: 49.90,
    limit: 999,
  },
};
```

### 2. Plan.tsx

- Adicionar botao funcional "Fazer upgrade para Pro"
- Ao clicar, chamar `create-checkout` com `price_id` do Pro
- Redirecionar para URL retornada
- Detectar `?success=true` na URL e chamar `check-subscription`
- Atualizar `profiles.plan_type` se assinatura confirmada
- Adicionar botao "Gerenciar assinatura" que abre Customer Portal

### 3. AuthContext (Opcional)

Chamar `check-subscription` apos login para sincronizar estado.

## Fluxo do Usuario

### Upgrade para Pro

1. Usuario clica em "Fazer upgrade para Pro" na pagina /plano
2. Sistema chama `create-checkout` com price_id do Pro
3. Usuario e redirecionado para Stripe Checkout
4. Usuario preenche dados de pagamento
5. Apos sucesso, Stripe redireciona para /plano?success=true
6. Frontend detecta parametro e chama `check-subscription`
7. Sistema confirma assinatura e atualiza `profiles.plan_type = 'pro'`
8. Usuario ve confirmacao e novos beneficios desbloqueados

### Gerenciar Assinatura

1. Usuario clica em "Gerenciar assinatura"
2. Sistema chama `customer-portal`
3. Usuario e redirecionado para portal Stripe
4. Usuario pode cancelar, trocar cartao, ver faturas
5. Ao voltar, sistema pode re-verificar status

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/create-checkout/index.ts` | Cria sessao de checkout |
| `supabase/functions/check-subscription/index.ts` | Verifica assinatura |
| `supabase/functions/customer-portal/index.ts` | Abre portal Stripe |
| `src/lib/stripe.ts` | Constantes e tipos dos planos |

## Arquivos a Modificar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/config.toml` | Adicionar novas functions |
| `src/pages/Plan.tsx` | Botoes funcionais e logica de checkout |

## Seguranca

- Todas as edge functions validam JWT do usuario
- Nunca expor STRIPE_SECRET_KEY no frontend
- Apenas price_ids sao enviados do frontend
- Verificacao de assinatura sempre via Stripe API (nao confiar em parametros)

## Consideracoes

- Usuario pode comecar no plano gratuito (sem assinatura Stripe)
- Primeiro pagamento ativa o plano correspondente
- Cancelamento no portal nao remove acesso imediatamente (ate fim do periodo)
- Sincronizacao de `plan_type` baseada no produto assinado

