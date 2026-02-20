
# Corrigir erros de build + Redeploy da parse-exam-pdf

## Erros identificados

Sao 3 categorias de erros de build que precisam ser corrigidos:

### 1. Edge Functions: `error` is of type `unknown` (3 arquivos)
Os catch blocks em 3 edge functions usam `error.message` sem type guard.

**Arquivos afetados:**
- `supabase/functions/clean-flashcards/index.ts` (linha 64)
- `supabase/functions/generate-flashcard/index.ts` (linha 92)
- `supabase/functions/generate-pedagogy/index.ts` (linha 137)

**Correção:** Trocar `error.message` por `error instanceof Error ? error.message : "Unknown error"` nos 3 arquivos.

### 2. QuotaExceededModal: tipo `'basic'` nao existe no union type
O componente compara `planType` com `'basic'`, mas o tipo so aceita `'free' | 'pro'`.

**Arquivo:** `src/components/atlas/QuotaExceededModal.tsx` (linhas 49-51, 64-66)

**Correção:** Trocar todas as 6 ocorrencias de `'basic'` por `'free'`.

### 3. useFreeAreaQuota: `.finally()` nao existe em `PromiseLike`
O retorno de `.then()` do Supabase e `PromiseLike`, nao `Promise`, e nao tem `.finally()`.

**Arquivo:** `src/hooks/useFreeAreaQuota.ts` (linha 38)

**Correção:** Substituir `.finally(() => setLoading(false))` por `.then(() => setLoading(false), () => setLoading(false))`.

### 4. Redeploy da edge function `parse-exam-pdf`
O codigo local ja esta correto. Apenas precisa ser redeployado para que a versao em producao aceite o campo `images`.

## Resumo das mudancas

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/clean-flashcards/index.ts` | Type guard no catch |
| `supabase/functions/generate-flashcard/index.ts` | Type guard no catch |
| `supabase/functions/generate-pedagogy/index.ts` | Type guard no catch |
| `src/components/atlas/QuotaExceededModal.tsx` | `'basic'` -> `'free'` |
| `src/hooks/useFreeAreaQuota.ts` | `.finally()` -> `.then(ok, err)` |
| `supabase/functions/parse-exam-pdf/index.ts` | Redeploy (sem mudanca de codigo) |
