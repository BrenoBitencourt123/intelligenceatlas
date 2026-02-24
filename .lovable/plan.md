

# Criar Edge Function Temporaria para Expor a Service Role Key

## Objetivo

Criar uma edge function simples e temporaria que retorna a `SUPABASE_SERVICE_ROLE_KEY` para voce copiar e usar no script Python local. Depois de copiar, removemos a function.

## Plano

### 1. Criar edge function `get-service-key`

**Novo arquivo: `supabase/functions/get-service-key/index.ts`**

- Retorna um JSON com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` lidos de `Deno.env`
- Sem autenticacao (temporaria, sera removida logo apos uso)
- CORS habilitado para funcionar via browser

### 2. Configurar no config.toml

Adicionar `verify_jwt = false` para a function.

### 3. Apos voce copiar os dados

Deletar a function `get-service-key` do projeto imediatamente.

## Seguranca

Esta function expoe uma chave com acesso total ao banco. Ela sera criada, voce copia os valores, e eu removo na sequencia. Nao deixaremos ela publicada.

