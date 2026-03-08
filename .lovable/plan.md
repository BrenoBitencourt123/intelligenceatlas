

## Plano: Detecção de Chute por Tempo + Prompt Condicional "Foi um chute?"

### Conceito Revisado

A pergunta "Isso foi um chute?" **só aparece quando o sistema detecta resposta suspeitamente rápida**. Se o tempo de resposta for normal, a resposta é submetida imediatamente como hoje. Fluxo:

```text
Aluno clica alternativa
  ├─ Tempo OK (>= threshold) → submete normalmente, peso 1.0
  └─ Tempo suspeito (< threshold) → NÃO submete ainda
       ├─ Aparece card: "Isso foi um chute?"
       │   ├─ "Não, respondi consciente" → submete com peso 1.0
       │   └─ "Sim, foi chute" → submete com peso reduzido
       └─ Botão "Não sei" continua bypassando (sem prompt)
```

### Cálculo do threshold

Baseado no tamanho do enunciado + alternativas:
- `totalChars = statement.length + sum(alternatives.text.length)`
- `estimatedReadSec = max(8, (totalChars / 5) / 4)` (~240 palavras/min, ~5 chars/palavra)
- Se `timeSpentSec < estimatedReadSec * 0.4` → suspeito

### Mudanças

**1. `src/hooks/useStudySession.ts`**

- Adicionar função helper `isLikelyGuess(statement, alternatives, timeSpentSec)` → boolean
- `answerQuestion` recebe novo parâmetro opcional `wasGuess: boolean = false`
- Quando `wasGuess === true`, aplicar multiplicadores em `syncTopicProfile`:
  - Chute correto: `correct` conta +0.3 (não +1), `correctStreak` não incrementa
  - Chute errado: `wrong` conta +0.5 (penaliza menos)
  - `user_mastery`: `newCorrect` recebe +0.3 em vez de +1 quando chute correto
- **Novo retorno**: `answerQuestion` retorna `{ submitted: boolean, suspectedGuess: boolean }` em vez de void
  - Se `isLikelyGuess` e `selectedLetter !== null`: retorna `{ submitted: false, suspectedGuess: true }` sem submeter
  - Senão: submete normalmente e retorna `{ submitted: true, suspectedGuess: false }`
- Novo método `confirmAnswer(selectedLetter, autoFlashcard, wasGuess)` que efetivamente submete após o prompt

**2. `src/pages/Objectives.tsx`**

- Novo estado: `pendingGuessAnswer: string | null`
- No `onClick` da alternativa: chamar `answerQuestion(alt.letter, hasAutoFlashcards)`, checar retorno
  - Se `suspectedGuess === true` → setar `pendingGuessAnswer = alt.letter`, destacar alternativa
  - Se `submitted === true` → fluxo normal (feedback aparece)
- Quando `pendingGuessAnswer !== null && !showFeedback`:
  - Alternativa selecionada fica com borda `border-primary`
  - Renderizar card de confirmação abaixo das alternativas:
    - Ícone `HelpCircle` + "Isso foi um chute?"
    - Texto: "O Atlas aprende com suas respostas para personalizar seu estudo. Respostas honestas nos ajudam a criar recomendações melhores para você."
    - Botão outline: "Não, respondi consciente" → `confirmAnswer(pendingGuessAnswer, hasAutoFlashcards, false)`
    - Botão secondary/muted: "Sim, foi chute" → `confirmAnswer(pendingGuessAnswer, hasAutoFlashcards, true)`
  - Limpar `pendingGuessAnswer` após confirmar
- Botão "Não sei" continua chamando `answerQuestion(null, ...)` direto (null bypassa detecção)

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/hooks/useStudySession.ts` | `isLikelyGuess()`, parâmetro `wasGuess`, `confirmAnswer()`, multiplicadores em `syncTopicProfile` e `user_mastery` |
| `src/pages/Objectives.tsx` | Estado `pendingGuessAnswer`, card de confirmação condicional, ajuste no onClick |

Sem migração SQL. Sem chamada extra à IA. Custo zero.

