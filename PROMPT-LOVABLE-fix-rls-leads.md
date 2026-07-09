# Prompt para Lovable — FIX 2 do ufu_leads: RLS bloqueando o insert (URGENTE)

Teste em produção (08/07): insert anônimo em `ufu_leads` agora falha com
**42501 "new row violates row-level security policy"**. O erro anterior
(42P10, ON CONFLICT) mudou — alguma migration recente recriou a tabela ou as
policies e o INSERT de visitante (anon) parou de ser permitido. Resultado:
a página /ufu/lista continua salvando NADA (count = 0).

## Corrigir

```sql
-- Garantir grant + policy de insert pra visitante anônimo (o funil é público)
grant insert on public.ufu_leads to anon, authenticated;

drop policy if exists "ufu_leads_insert_anon" on public.ufu_leads;
create policy "ufu_leads_insert_anon"
  on public.ufu_leads for insert
  to anon, authenticated
  with check (true);

-- Conferir que a constraint única na COLUNA email existe (fix anterior):
-- se não existir:
-- alter table public.ufu_leads add constraint ufu_leads_email_key unique (email);
```

Se houver outra policy de INSERT na tabela com WITH CHECK restritivo,
remover — ela sobrepõe esta.

## Verificação obrigatória (a MESMA que falhou 2 vezes)
1. Em janela anônima (deslogado), abrir `/ufu/lista?curso=medicina-integral-uberlandia`,
   enviar um e-mail de teste.
2. No SQL editor: `select count(*) from ufu_leads;` → tem que ser ≥ 1.
3. Se a tela disser "Você está na lista ✅" mas o count for 0, o bug do
   falso-positivo voltou — revisar o tratamento de erro do ListaUfu.tsx
   (só erro `code === '23505'` pode ser tratado como sucesso).
