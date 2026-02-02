
# Plano: Unificar Análise para Reduzir Custos

## Problema Identificado
Atualmente, o ciclo completo de análise envia o texto da redação para a IA **duas vezes**:
1. **analyze-block**: Analisa cada bloco individualmente (~3 chamadas)
2. **evaluate-competencies**: Envia a redação completa novamente para avaliar competências

Isso resulta em custo duplicado de tokens de entrada, pois o mesmo texto é processado duas vezes.

## Solução Proposta
Unificar a análise de blocos e a avaliação de competências em uma **única chamada de IA** que retorna ambos os resultados de uma vez só.

## Como vai funcionar

### Nova Edge Function: `analyze-essay` (substitui as duas anteriores)
Uma única função que:
- Recebe **toda a redação** de uma vez
- Analisa **cada bloco** (checklist, sugestões, evidências)
- Avalia as **5 competências do ENEM**
- Retorna tudo em uma única resposta JSON

### Fluxo Simplificado
```text
ANTES (3-4 chamadas):
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  analyze-block   │     │  analyze-block   │     │  analyze-block   │     │   evaluate-     │
│  (introdução)    │ --> │ (desenvolvimento)│ --> │   (conclusão)    │ --> │  competencies   │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
     ~1000 tokens             ~1200 tokens            ~1000 tokens             ~2000 tokens
                                                                          
DEPOIS (1 chamada):
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                              analyze-essay                                                  │
│  • Analisa todos os blocos + Avalia 5 competências em uma única chamada                    │
└────────────────────────────────────────────────────────────────────────────────────────────┘
     ~2500 tokens (economia de ~50-60% em tokens de entrada)
```

### Economia Estimada
- **Antes**: ~5200 tokens de input (3 blocos + competências)
- **Depois**: ~2500 tokens de input (uma chamada unificada)
- **Economia**: ~50-60% nos custos de análise

## O que muda para o usuário
- **Nada muda na interface** - o botão "Analisar todos" continua funcionando igual
- A análise será mais rápida (1 chamada ao invés de 4)
- A análise individual de blocos deixará de existir (pois era redundante)

---

## Detalhes Técnicos

### 1. Nova Edge Function `analyze-essay`
Criar função que combina os prompts de `analyze-block` e `evaluate-competencies`:
- Recebe: `{ blocks: [...], theme?: string }`
- Retorna: `{ blockAnalyses: [...], competencies: [...], totalScore, usage }`
- O prompt instruirá a IA a analisar cada bloco E avaliar competências em um único JSON

### 2. Atualizar `src/lib/ai.ts`
- Remover `analyzeBlock()` e `evaluateCompetencies()` 
- Criar `analyzeEssay()` que chama a nova função unificada
- Manter `generateImprovedVersion()` separado (esse faz sentido ser independente)

### 3. Atualizar `src/pages/Index.tsx`
- Simplificar `handleAnalyzeAll()` para chamar apenas `analyzeEssay()`
- Remover `handleAnalyzeBlock()` (análise individual)
- Os botões de analisar bloco individual serão removidos dos cards

### 4. Atualizar `src/components/atlas/BlockCard.tsx`
- Remover botão "Analisar" individual de cada bloco
- O bloco mostra análise quando disponível (após "Analisar todos")

### 5. Limpar funções antigas
- Manter `analyze-block` e `evaluate-competencies` temporariamente para compatibilidade
- Futuramente podem ser removidas do `config.toml`

### 6. Registro de uso no banco
- A nova função registrará como `operation_type: 'analyze-essay'`
- Facilitará comparação de custos no dashboard admin
