

## Análise: O que pode quebrar para o usuário hoje

Fiz uma varredura no código, edge functions e fluxo de pagamento. Existem **3 problemas que vão impactar o usuário** e um problema que **trava o deploy de Edge Functions**. Nada catastrófico, mas dois deles confundem o usuário no momento do pagamento.

---

### 🔴 1. Edge Functions não compilam (build falhando)
O build de TypeScript das Edge Functions está falhando em **2 funções**:

- **`send-push/index.ts`** (8 erros de TS): incompatibilidade de tipos `Uint8Array<ArrayBufferLike>` com `BufferSource` da WebCrypto / `fetch`. É um problema de TS estrito do Deno mais novo — o código funciona em runtime, mas o type check bloqueia deploy.
- **`clear-storage-bucket/index.ts`** (1 erro): `err` é `unknown` no catch e acessa `.message` direto.

**Impacto real**: notificações push e a função admin de limpar storage podem não conseguir ser **redeployadas** se forem editadas. As versões já em produção continuam rodando.

**Correção**: cast de `Uint8Array` para `BufferSource as any` / `new Uint8Array(buf).buffer` nas chamadas de `crypto.subtle.*` e `fetch`, e `err instanceof Error ? err.message : String(err)` no catch.

---

### 🔴 2. Página `/plano` mostra info contraditória sobre o free
Os limites do free foram atualizados na landing (10 questões/dia + 1 redação/semana), mas a página `/plano` (que o usuário vê quando clica para fazer upgrade) ainda mostra:

```
Plano Grátis:
- "5 questões por área (one-time)"   ← ERRADO
- "1 redação gratuita"                ← ERRADO (na real é 1/semana)
```

E mais embaixo: *"Sua redação gratuita — Você tem 1 redação gratuita"* + barra `usedEssays/1`.

**Impacto**: usuário compara landing (10/dia + 1/semana) com /plano (5 total + 1 na vida) e fica confuso sobre o que realmente recebe. Pior: quem já fez 1 redação vê "Você já usou sua redação gratuita" mesmo tendo direito a outra na semana.

**Correção**: alinhar `freeFeatures` em `Plan.tsx` com a landing, e trocar o card de "redação usada" por um card semanal.

---

### 🟡 3. `useFreeAreaQuota.isAreaLocked` ignora o plano Pro
```ts
// useFreeAreaQuota.ts linha 19-21
const isAreaLocked = (_area: string) =>
  questionsUsedToday >= FREE_DAILY_QUESTIONS;
```
Não checa `isFree`. Em teoria, um Pro que respondeu 10 questões hoje seria marcado como "área bloqueada". Hoje, `usePlanFeatures` ainda usa `isAreaLocked` direto sem cruzar com `isPro`.

**Impacto**: depende de cada componente que consome — em `Objectives.tsx` o gate visual pode aparecer pra Pro também. Risco médio.

**Correção**: `isAreaLocked = (_area) => isFree && questionsUsedToday >= FREE_DAILY_QUESTIONS`.

---

### 🟡 4. Texto hardcoded "5 questões · ~10 min" em `Today.tsx`
Linha 159 diz "5 questões" no card de revisão diária, mas o limite agora é 10. Inconsistência cosmética com o restante do produto.

---

### ✅ Fluxo de pagamento (Stripe) — auditoria

Verifiquei `create-checkout`, `check-subscription`, `customer-portal`, `EmbeddedCheckoutModal`, `Plan.tsx`, `Founders.tsx` e `Landing.tsx`. **O fluxo está sólido**:

| Item | Status |
|---|---|
| Stripe publishable key (live) hardcoded no front | ✅ correto, é chave pública |
| Edge `create-checkout` usa `STRIPE_SECRET_KEY` + cria session embedded | ✅ ok |
| `ui_mode: 'embedded'` + `return_url` + `clientSecret` | ✅ ok |
| Cupom passado via `discounts: [{coupon}]` | ✅ ok |
| `check-subscription` valida sub ativo e retorna `product_id` | ✅ ok |
| `customer-portal` com fallback para "no customer found" | ✅ ok, com mensagem amigável |
| Fluxo `intent → signup → /plano?checkout=pro` (landing/founders) | ✅ funciona |
| Cupom `FUNDADOR` (50% lifetime, max 20) | ✅ existe no Stripe e na lib |
| Auto-checkout ao chegar com `?checkout=pro&coupon=...` | ✅ funciona |
| Após sucesso: `?success=true` chama `check-subscription` + reload | ✅ ok |
| Webhook do Stripe | ⚠️ não tem (intencional pelo template Lovable) — `check-subscription` é chamado periodicamente. **Risco**: se usuário cancelar via Stripe Portal, só reflete no app na próxima chamada de `check-subscription`. Aceitável. |

**Único ponto de atenção real no pagamento**: o `STRIPE_SECRET_KEY2` existe nas secrets além do `STRIPE_SECRET_KEY`. Pode ser uma chave antiga/duplicada. Vale conferir e remover se não usar — não quebra nada, mas é higiene.

---

### Resumo do que precisa virar fix (próxima mensagem em modo build)

1. **Corrigir TS errors** em `send-push/index.ts` e `clear-storage-bucket/index.ts` (desbloqueia deploy)
2. **Atualizar copy do free em `Plan.tsx`** (10/dia + 1/semana, em vez de 5 total + 1 na vida)
3. **Trocar card "Sua redação gratuita"** em `Plan.tsx` por um card semanal correto
4. **Adicionar gate `isFree`** em `useFreeAreaQuota.isAreaLocked`
5. **Atualizar texto "5 questões"** em `Today.tsx` linha 159

Pagamento em si: **nada quebrado, fluxo funciona**.

