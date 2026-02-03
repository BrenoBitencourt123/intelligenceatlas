
# Sistema Híbrido de Temas Diários

Implementação de um sistema onde temas são buscados do banco de dados primeiro, e caso não exista tema para o dia atual, a IA gera automaticamente um novo tema.

---

## Resumo do Funcionamento

```
Usuário acessa a Home ou Redação
            ↓
Busca tema na tabela `daily_themes` para a data de hoje
            ↓
    ┌───────────────────────────────────────┐
    │         Tema encontrado?              │
    └───────────────────────────────────────┘
            ↓                    ↓
           Sim                  Não
            ↓                    ↓
    Retorna tema            Chama Edge Function
    do banco              `generate-theme` (IA)
                                 ↓
                          IA gera tema completo
                                 ↓
                          Salva no banco
                                 ↓
                          Retorna tema novo
```

---

## Etapa 1: Criar Tabela `daily_themes`

Criar nova tabela no banco para armazenar os temas cadastrados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| date | date | Data do tema (única) |
| title | text | Título do tema ENEM |
| motivating_text | text | Texto motivador (citações/dados) |
| context | text | Contextualização do tema |
| guiding_questions | jsonb | Array de 5 perguntas norteadoras |
| structure_guide | jsonb | Guia de estrutura (intro, dev, conclusão) |
| is_ai_generated | boolean | Se foi gerado por IA ou manual |
| created_at | timestamp | Data de criação |

**RLS Policies:**
- SELECT: público (qualquer usuário pode ler)
- INSERT: apenas administrador ou service_role (para a IA)

---

## Etapa 2: Criar Edge Function `generate-theme`

Nova função que será chamada quando não houver tema cadastrado para hoje.

**Entrada:** Data (opcional, padrão = hoje)

**Processo:**
1. Verifica se já existe tema para a data
2. Se existir, retorna o tema existente
3. Se não existir, chama GPT-4.1-mini para gerar tema completo
4. Salva no banco com `is_ai_generated = true`
5. Retorna o tema gerado

**Prompt para IA:**
- Gerar tema relevante e atual no estilo ENEM
- Incluir texto motivador com citação/dado real
- Gerar 5 perguntas norteadoras
- Incluir contexto histórico-social
- Manter guia de estrutura padrão

**Arquivo:** `supabase/functions/generate-theme/index.ts`

---

## Etapa 3: Criar Hook `useDailyTheme`

Novo hook React para gerenciar a busca do tema.

**Localização:** `src/hooks/useDailyTheme.ts`

**Funcionalidades:**
- Busca tema no banco para a data de hoje
- Se não encontrar, chama a Edge Function
- Gerencia estados: `isLoading`, `error`, `theme`
- Cache local para evitar requisições repetidas

**Código simplificado:**
```typescript
export function useDailyTheme() {
  // 1. Tenta buscar do banco (WHERE date = hoje)
  // 2. Se não existir, chama generate-theme
  // 3. Retorna { theme, isLoading, error }
}
```

---

## Etapa 4: Atualizar Páginas para Usar Hook

### Home.tsx
- Substituir `getDailyTheme()` por `useDailyTheme()`
- Adicionar skeleton enquanto carrega
- Exibir badge se tema foi gerado por IA

### Essay.tsx
- Substituir `getDailyTheme()` por `useDailyTheme()`
- Passar tema dinâmico para `PedagogicalSection`
- Adicionar loading state

---

## Etapa 5: Painel Admin para Cadastrar Temas (Opcional)

Criar interface para cadastrar temas manualmente.

**Funcionalidades:**
- Formulário com todos os campos do tema
- Calendário para selecionar a data
- Preview do tema antes de salvar
- Lista de temas agendados

**Localização:** Nova rota `/admin/themes` ou integrar em `/admin`

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| Migration SQL | Criar | Tabela `daily_themes` com RLS |
| `supabase/functions/generate-theme/index.ts` | Criar | Edge Function para gerar tema via IA |
| `supabase/config.toml` | Modificar | Adicionar config da nova função |
| `src/hooks/useDailyTheme.ts` | Criar | Hook para buscar/gerar tema |
| `src/pages/Home.tsx` | Modificar | Usar hook dinâmico |
| `src/pages/Essay.tsx` | Modificar | Usar hook dinâmico |
| `src/data/dailyThemes.ts` | Modificar | Manter como fallback/tipos |

---

## Detalhes Técnicos

### Estrutura da Tabela (SQL)

```sql
CREATE TABLE public.daily_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  motivating_text TEXT NOT NULL,
  context TEXT NOT NULL,
  guiding_questions JSONB NOT NULL DEFAULT '[]',
  structure_guide JSONB NOT NULL DEFAULT '[]',
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: todos podem ler
ALTER TABLE public.daily_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read themes" ON public.daily_themes
  FOR SELECT USING (true);
```

### Custo Estimado por Geração de Tema

- Input: ~500 tokens (prompt)
- Output: ~1500 tokens (tema completo)
- Custo: ~$0.003 por tema gerado
- Se gerar 1 tema por dia = ~$0.09/mês

---

## Benefícios do Sistema Híbrido

1. **Controle total**: você pode cadastrar temas específicos antecipadamente
2. **Nunca fica sem tema**: IA gera automaticamente se esquecer de cadastrar
3. **Custo baixo**: apenas gera via IA quando necessário
4. **Flexibilidade**: pode desativar geração automática se quiser
5. **Rastreabilidade**: campo `is_ai_generated` identifica a origem

---

## Ordem de Implementação

1. Criar tabela `daily_themes` via migration
2. Criar Edge Function `generate-theme`
3. Criar hook `useDailyTheme`
4. Atualizar `Home.tsx` e `Essay.tsx`
5. (Opcional) Criar painel admin para cadastrar temas
