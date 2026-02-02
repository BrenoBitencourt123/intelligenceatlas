
# Plano: Corrigir Sistema de Checklist ENEM

## Diagnostico Completo

Identifiquei **quatro problemas** no sistema de checklist:

### Problema 1: O checklist da IA nao esta sendo exibido

O componente `BlockCard.tsx` exibe apenas o **precheck local** (heuristicas), ignorando completamente o checklist gerado pela IA apos a analise.

**Codigo atual (linha 175):**
```tsx
({precheck.checklist.filter(i => i.checked).length}/{precheck.checklist.length})
```

Isso significa que mesmo apos clicar em "Analisar bloco" e a IA retornar seu checklist, o usuario continua vendo o checklist das heuristicas locais.

### Problema 2: Lista de conectivos incompleta no precheck local

A lista em `src/lib/precheck.ts` nao inclui expressoes validas como:
- "Diante desse cenario" / "Diante disso"
- "Esse cenario"
- "Nesse panorama"
- Outras expressoes contextuais

### Problema 3: Deteccao de causa-efeito muito restritiva

A lista `CAUSE_EFFECT` em `precheck.ts` busca palavras explicitas como "causa", "efeito", mas nao detecta relacoes implicitas como:
- "o que dificulta" (consequencia)
- "contribui para" (causa)
- "limitando" (efeito)

### Problema 4: Prompt da IA sem criterios claros

O prompt na edge function `analyze-block` lista os criterios de forma generica sem explicar **como identificar** cada elemento. A IA pode interpretar de forma inconsistente.

---

## Solucao Proposta

### 1. Exibir checklist da IA quando disponivel

**Arquivo:** `src/components/atlas/BlockCard.tsx`

Alterar a logica para:
- Se bloco foi analisado pela IA: mostrar `block.analysis.checklist`
- Caso contrario: mostrar `precheck.checklist`

### 2. Expandir lista de conectivos

**Arquivo:** `src/lib/precheck.ts`

Adicionar expressoes contextuais e de transicao:
- "diante desse cenario"
- "diante disso"
- "nesse panorama"
- "esse cenario"
- "tal situacao"
- "frente a isso"
- "considerando isso"

### 3. Expandir deteccao de causa-efeito

**Arquivo:** `src/lib/precheck.ts`

Adicionar padroes implicitos:
- "o que"
- "contribui para"
- "limitando"
- "dificultando"
- "prejudicando"
- "favorecendo"
- "permitindo"
- "impossibilitando"

### 4. Melhorar prompt da IA

**Arquivo:** `supabase/functions/analyze-block/index.ts`

Adicionar instrucoes explicitas sobre **como identificar** cada elemento:

**Para Conectivos:**
```
CONECTIVOS incluem expressoes como: "Diante desse cenario", "Nesse sentido", "Dessa forma", alem dos classicos "Portanto", "Alem disso", etc. Qualquer expressao que faca transicao logica entre ideias e um conectivo.
```

**Para Causa-Efeito:**
```
RELACAO CAUSA-EFEITO inclui construcoes como "o que provoca", "o que dificulta", "contribui para", "limitando", "em razao de", mesmo que nao usem as palavras "causa" ou "efeito" explicitamente.
```

---

## Mudancas Tecnicas Detalhadas

### Arquivo: `src/components/atlas/BlockCard.tsx`

```tsx
// Determinar qual checklist exibir
const displayChecklist = useMemo(() => {
  if (hasAnalysis && block.analysis?.checklist && block.analysis.checklist.length > 0) {
    return block.analysis.checklist;
  }
  return precheck.checklist;
}, [hasAnalysis, block.analysis, precheck.checklist]);

// No render, usar displayChecklist ao inves de precheck.checklist
```

### Arquivo: `src/lib/precheck.ts`

Adicionar na lista CONNECTIVES:
```typescript
'diante desse cenário', 'diante disso', 'frente a isso', 
'nesse panorama', 'ante o exposto', 'considerando isso',
'diante dessa realidade', 'esse cenário', 'tal situação'
```

Adicionar na lista CAUSE_EFFECT:
```typescript
'o que', 'contribui para', 'limitando', 'dificultando',
'prejudicando', 'favorecendo', 'permitindo', 'impossibilitando',
'comprometendo', 'afetando', 'impactando', 'refletindo em'
```

### Arquivo: `supabase/functions/analyze-block/index.ts`

Atualizar SYSTEM_PROMPT com criterios mais explicitos:

```typescript
CRITÉRIOS POR TIPO DE BLOCO:

INTRODUÇÃO:
- Contextualização do tema (histórica, social, cultural)
- Tese clara e assertiva
- Repertório sociocultural (citação, dado, referência)
- Gancho inicial que prende atenção
- CONECTIVO: Qualquer expressão que faça transição lógica (ex: "Diante desse cenário", "Nesse contexto", "Sob essa perspectiva")

DESENVOLVIMENTO:
- Conectivo inicial que liga ao parágrafo anterior
- Argumento central claro
- Evidências/exemplos concretos (dados, citações, casos)
- RELAÇÃO CAUSA-EFEITO: Identificar construções como "o que provoca", "contribui para", "limitando", "em decorrência de" - não precisa usar as palavras "causa" ou "efeito" explicitamente
- Conexão com a tese

IMPORTANTE PARA O CHECKLIST:
- Marque como TRUE se o elemento estiver PRESENTE, mesmo que de forma implícita
- Expressões como "Diante desse cenário" SÃO conectivos válidos
- Construções como "o que dificulta X, limitando Y" CONTÊM relação causa-efeito
```

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/atlas/BlockCard.tsx` | Exibir checklist da IA quando disponivel |
| `src/lib/precheck.ts` | Expandir listas de conectivos e causa-efeito |
| `supabase/functions/analyze-block/index.ts` | Melhorar prompt com criterios explicitos |

---

## Resultado Esperado

### Antes da correcao:
- Introducao com "Diante desse cenario": **Conectivo NAO detectado**
- Desenvolvimento com "o que dificulta... limitando": **Causa-efeito NAO detectado**
- Checklist exibido: sempre o local (heuristicas)

### Depois da correcao:
- Introducao com "Diante desse cenario": **Conectivo DETECTADO**
- Desenvolvimento com "o que dificulta... limitando": **Causa-efeito DETECTADO**
- Checklist exibido: da IA apos analise, local antes
- Notas mais justas baseadas em deteccao correta
