
# Plano: Rastreamento de Tokens com Dashboard Admin

## Resumo

Implementar rastreamento completo de tokens usados em cada chamada a API OpenAI, com armazenamento no banco de dados e dashboard para visualizacao.

**Fase 1 (agora):** Mostrar tokens no frontend para testes
**Fase 2 (futuro):** Adicionar autenticacao para restringir acesso ao admin

---

## Custos de Referencia - GPT-4.1-mini

| Tipo | Preco por 1M tokens |
|------|---------------------|
| Input | $0.40 |
| Output | $1.60 |

---

## Arquitetura

```text
+-------------------+      +-------------------+      +------------------+
|   Edge Functions  | ---> |   token_usage     | ---> |  /admin page     |
|  analyze-block    |      |   (tabela)        |      |  (dashboard)     |
|  improve-essay    |      +-------------------+      +------------------+
+-------------------+
        |
        v
   Retorna usage no
   response JSON
```

---

## Mudancas Tecnicas

### 1. Criar Tabela token_usage

**SQL Migration:**

```sql
CREATE TABLE public.token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  operation_type TEXT NOT NULL, -- 'analyze-block' ou 'improve-essay'
  block_type TEXT, -- 'introduction', 'development', 'conclusion' ou null
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost_usd NUMERIC(10, 6) NOT NULL
);

-- RLS desabilitado por enquanto (fase de testes)
-- Depois adicionamos politica para admin only
```

### 2. Atualizar Edge Function analyze-block

**Arquivo:** `supabase/functions/analyze-block/index.ts`

**Mudancas:**
- Importar cliente Supabase
- Extrair `usage` da resposta OpenAI
- Calcular custo estimado
- Inserir registro na tabela `token_usage`
- Retornar dados de uso na resposta

**Trecho relevante:**

```typescript
const data = await response.json();
const usage = data.usage;

// Calcular custo (GPT-4.1-mini: input $0.40/1M, output $1.60/1M)
const estimatedCost = 
  (usage.prompt_tokens * 0.40 / 1_000_000) + 
  (usage.completion_tokens * 1.60 / 1_000_000);

// Salvar no banco
await supabaseClient.from('token_usage').insert({
  operation_type: 'analyze-block',
  block_type: blockType,
  prompt_tokens: usage.prompt_tokens,
  completion_tokens: usage.completion_tokens,
  total_tokens: usage.total_tokens,
  estimated_cost_usd: estimatedCost,
});

// Retornar com dados de uso
return new Response(JSON.stringify({ 
  analysis, 
  usage: { ...usage, estimated_cost_usd: estimatedCost } 
}));
```

### 3. Atualizar Edge Function improve-essay

**Arquivo:** `supabase/functions/improve-essay/index.ts`

**Mudancas identicas:** extrair usage, calcular custo, salvar, retornar.

### 4. Atualizar Frontend para Receber Dados

**Arquivo:** `src/lib/ai.ts`

Retornar os dados de uso junto com a analise/texto melhorado.

**Arquivo:** `src/types/atlas.ts`

Adicionar interface para TokenUsage:

```typescript
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
}
```

### 5. Criar Pagina Admin

**Novo arquivo:** `src/pages/Admin.tsx`

Dashboard com:
- Tabela de historico de operacoes
- Totais agregados (hoje, semana, mes)
- Custo total estimado em USD
- Grafico de uso ao longo do tempo (opcional)

**Rota:** `/admin` (sem autenticacao na fase 1)

### 6. Adicionar Rota no App

**Arquivo:** `src/App.tsx`

```typescript
import Admin from "./pages/Admin";
// ...
<Route path="/admin" element={<Admin />} />
```

---

## Dados que Serao Exibidos no Dashboard

| Coluna | Exemplo |
|--------|---------|
| Data/Hora | 02/02/2026 20:39 |
| Operacao | analyze-block |
| Bloco | introduction |
| Tokens Input | 890 |
| Tokens Output | 412 |
| Custo USD | $0.00102 |

**Agregacoes:**
- Total de operacoes hoje
- Total de tokens (input + output)
- Custo total estimado
- Custo medio por analise vs por melhoria

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Tabela `token_usage` | Criar via migracao SQL |
| `supabase/functions/analyze-block/index.ts` | Adicionar logging de tokens |
| `supabase/functions/improve-essay/index.ts` | Adicionar logging de tokens |
| `src/types/atlas.ts` | Adicionar interface TokenUsage |
| `src/lib/ai.ts` | Retornar dados de uso |
| `src/pages/Admin.tsx` | Criar dashboard (novo) |
| `src/App.tsx` | Adicionar rota /admin |

---

## Fase 2 (Futuro) - Restricao de Acesso

Quando quiser restringir o acesso ao dashboard:

1. Criar tabela `user_roles` com enum `app_role`
2. Adicionar seu usuario como admin
3. Criar funcao `has_role()` com SECURITY DEFINER
4. Adicionar RLS na tabela `token_usage`
5. Proteger rota `/admin` com autenticacao

Isso sera implementado em um segundo momento, quando voce quiser que apenas voce tenha acesso.
