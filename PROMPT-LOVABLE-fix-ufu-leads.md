# Prompt para Lovable — FIX URGENTE: ufu_leads perde 100% dos cadastros

Cole na Lovable. Bug confirmado em produção (08/07/2026): todo envio do formulário
`/ufu/lista` falha com erro Postgres 42P10, o código engole o erro e mostra
"Você está na lista ✅" — mas **nada é salvo**. `ufu_leads_count()` retorna 0.

**Causa:** o índice único é na expressão `lower(email)`, mas o upsert usa
`onConflict: 'email'`. `ON CONFLICT (email)` exige constraint única na COLUNA
`email` — não casa com índice de expressão → erro
"there is no unique or exclusion constraint matching the ON CONFLICT
specification". Como a mensagem contém a palavra "unique", o regex
`/duplicate|unique/i` do ListaUfu.tsx trata como sucesso.

---

## 1. Migration corretiva

```sql
-- Troca o índice de expressão por constraint única na coluna.
-- (O app já normaliza o e-mail com lowercase antes de inserir.)
drop index if exists public.ufu_leads_email_idx;

alter table public.ufu_leads
  add constraint ufu_leads_email_key unique (email);
```

## 2. Corrigir o tratamento de erro em `src/pages/ListaUfu.tsx`

No `catch`/tratamento do upsert, substitua o teste frouxo
`!/duplicate|unique/i.test(error.message)` por checagem do código:

```ts
// Duplicata real (já está na lista) = sucesso silencioso.
// QUALQUER outro erro = falha de verdade: mostrar toast e NÃO marcar sucesso.
if (error && error.code !== "23505") {
  throw error;
}
```

Mantenha o `upsert(..., { onConflict: "email", ignoreDuplicates: true })` —
com a constraint nova ele passa a funcionar; o check de 23505 fica como
cinto de segurança.

## 3. Verificação obrigatória (não pule)

1. Abrir `/ufu/lista?curso=medicina-integral-uberlandia`, enviar um e-mail de
   teste → conferir no banco que a linha existe em `ufu_leads`.
2. `select public.ufu_leads_count();` deve retornar ≥ 1.
3. Enviar o MESMO e-mail de novo → deve mostrar sucesso sem criar linha nova.
4. Enviar com o Supabase off/erro simulado não pode mostrar "Você está na
   lista" (o bug era exatamente esse falso-positivo).
