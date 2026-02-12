

# Flashcards Inteligentes para o ENEM

## Problema Atual

Hoje, quando voce erra uma questao, o sistema simplesmente copia o enunciado bruto da questao (truncado em 200 caracteres) como frente do flashcard. Isso gera cartoes pesados, dificeis de revisar e que nao ativam a memoria de forma eficiente.

## Solucao

Usar IA para gerar flashcards sintetizados no momento da criacao, transformando cada erro em um "gatilho mental rapido" ao inves de um mini-texto.

## O que muda

### 1. Nova funcao backend para gerar flashcards inteligentes
Criar uma edge function `generate-flashcard` que recebe os dados da questao (enunciado, alternativas, resposta correta, explicacao, area) e retorna:
- **Frente**: Pergunta curta e objetiva (max 2 linhas) focada em decisao, reconhecimento de padrao ou conceito minimo
- **Verso**: Explicacao resumida (3-4 linhas) + aplicacao pratica no ENEM (1 linha)

### 2. Atualizar geracao de flashcards no frontend
Modificar `generateFlashcard` em `useStudySession.ts` para chamar a edge function ao inves de truncar o enunciado. Incluir fallback local caso a chamada falhe (para nao travar o fluxo).

### 3. Melhorar a UI de revisao
Ajustar o layout dos flashcards tanto na pagina dedicada (`Flashcards.tsx`) quanto no modo inline (`Objectives.tsx`):
- Texto maior e mais limpo na frente
- Separacao visual clara entre explicacao e dica pratica no verso
- Label "FRENTE" removido (desnecessario) - so mostrar a pergunta
- Label "RESPOSTA" mantido no verso com formatacao mais clara

---

## Detalhes Tecnicos

### Edge Function `generate-flashcard`

```
POST /generate-flashcard
Body: { statement, alternatives, correctAnswer, explanation, area }
Response: { front, back }
```

Usa modelo Lovable AI (gemini-2.5-flash-lite - rapido e barato, ideal para sintese curta) com prompt instruindo:
- Tipo 1 (Decisao Estrategica): "Quando o enunciado traz X, o que isso indica?"
- Tipo 2 (Conceito minimo): "O que e X?"
- Tipo 3 (Pegadinha ENEM): padrao de erro comum

### Alteracoes em `useStudySession.ts`

Funcao `generateFlashcard`:
- Chamar edge function `generate-flashcard` com dados da questao
- Se falhar, usar fallback simplificado (melhor que o atual, mas sem IA)
- Manter mesma estrutura de insert no banco

### Alteracoes de UI

**`Flashcards.tsx`** e secao inline em **`Objectives.tsx`**:
- Frente: texto com `text-lg font-medium` centralizado, sem label "FRENTE"
- Verso: separacao com linha entre explicacao e dica pratica
- Card com `min-h-[240px]` para manter proporcao limpa

