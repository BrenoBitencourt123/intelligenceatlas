
# Corrigir tratamento de questoes anuladas na importacao

## Problema

O gabarito oficial do ENEM marca questoes anuladas com caracteres como "X", "*" ou a palavra "ANULADA". O parser atual (`parseAnswerKey`) so reconhece letras A-E, causando:

1. Questoes anuladas perdem o marcador e ficam sem resposta (confundem com "sem gabarito")
2. O formato sequencial (`DACBE...`) quebra quando encontra um "X" no meio da sequencia
3. Nao ha distincao visual entre "sem gabarito" e "anulada" no preview

## Solucao

### 1. Atualizar o parser do gabarito (`useImportExam.ts`)

Modificar a funcao `parseAnswerKey` para reconhecer marcadores de anulacao:

- No formato sequencial (`/^[A-EX*]+$/`): aceitar X e * como caracteres validos
- No formato tabular: capturar padroes como `91 X`, `91 *`, `91 ANULADA`
- Retornar "ANULADA" como valor no mapa para essas questoes

### 2. Adicionar campo `annulled` ao tipo `ImportedQuestion`

Adicionar um campo booleano `annulled` que sera `true` quando o gabarito retornar "ANULADA" para a questao. Na etapa de mapeamento (linha ~178), verificar se `keyMap[q.number] === 'ANULADA'` e marcar a questao.

### 3. Auto-desselecionar questoes anuladas no preview

Questoes com `annulled: true` terao `selected: false` por padrao, evitando importacao acidental. O usuario pode reselecionar manualmente se desejar.

### 4. Indicador visual no preview (`Import.tsx`)

- Exibir badge vermelha "Anulada" ao lado do numero da questao
- Separar o alerta: mostrar "X questoes anuladas (desmarcadas)" em vermelho e "Y questoes sem gabarito" em amarelo
- Na tela de confirmacao, mostrar contagem de anuladas separadamente

### 5. Ajustar o salvamento

Na funcao `saveQuestions`, questoes anuladas que forem selecionadas manualmente serao salvas com `correct_answer: 'ANULADA'` em vez de 'X', para distincao no banco.

## Detalhes tecnicos

**Arquivos a editar:**
- `src/hooks/useImportExam.ts` — parser do gabarito + campo annulled + logica de selecao
- `src/pages/Import.tsx` — badges e alertas visuais para anuladas

**Mudancas no `parseAnswerKey`:**

```text
Antes: /^[A-E]+$/ e /([A-E])/
Depois: /^[A-EX*]+$/ e /([A-EX*])/ com mapeamento X/* -> "ANULADA"
```

**Mudancas no mapeamento de questoes:**

```text
correct_answer: keyMap[q.number] === 'ANULADA' ? null : (keyMap[q.number] || null)
annulled: keyMap[q.number] === 'ANULADA'
selected: keyMap[q.number] !== 'ANULADA'  // auto-desselecionar anuladas
```
