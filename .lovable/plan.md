# Visão multimodal na geração pedagógica

Hoje a edge function `generate-pedagogy` envia só texto para o Gemini, então questões com charges, gráficos, pinturas e tirinhas geram pedagogia sem o contexto visual essencial. Vamos passar a primeira imagem da questão como input multimodal.

## Mudanças

### 1. `supabase/functions/generate-pedagogy/index.ts`
- Aceitar campo opcional `imageUrl: string | null` no body, **desestruturado junto com os demais campos no início do handler** (antes da montagem do `prompt`), para evitar `ReferenceError` no template string:
  ```ts
  const { questionId, statement, alternatives, correctAnswer, explanation, area, tags, imageUrl } = await req.json();
  ```
- Adicionar **uma única linha condicional** ao prompt para garantir que o Flash Lite efetivamente analise a imagem (sem alterar a estrutura pedagógica):
  ```
  ${imageUrl ? 'A questão contém uma imagem enviada junto. Analise-a como parte integral do enunciado ao gerar a pedagogia.' : ''}
  ```
- Montar `content` como array multimodal só quando houver imagem:
  ```ts
  const messageContent = imageUrl
    ? [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ]
    : prompt;
  messages: [{ role: 'user', content: messageContent }]
  ```
- Cache, parsing JSON e upsert em `question_pedagogy` permanecem idênticos.

### 2. `src/hooks/useQuestionPedagogy.ts`
- Estender `QuestionData` com `images?: { url: string }[]` (formato real `QuestionImage[]` que circula no app — não `string[]`).
- Na chamada `supabase.functions.invoke('generate-pedagogy', { body })`, adicionar:
  ```ts
  imageUrl: question.images?.[0]?.url ?? null,
  ```

### 3. Repassar `images` nos call sites do hook
Hoje os dois consumidores montam o objeto `question` manualmente e **não incluem `images`** — sem essa correção o `imageUrl` chegaria sempre `null` na edge function.

- **`src/pages/Objectives.tsx`** (linhas ~81-90): adicionar `images: currentQuestion.images` ao objeto passado para `useQuestionPedagogy`. O tipo `Question` de `useStudySession` já carrega `images: QuestionImage[]`.
- **`src/pages/SimuladoSession.tsx`** (linhas ~52-62): mesma adição. Confirmar que o tipo de `currentQuestion` em `useSimuladoSession` também carrega `images` (deve carregar — vem do mesmo `select("*")` em `questions`); se não estiver tipado, ajustar a interface local para incluir `images: QuestionImage[]`.
- `PedagogyBlocks.tsx` apenas consome o resultado `pedagogy`, não chama o hook — nenhum ajuste.

### 4. Carregamento das questões
- `useStudySession` e `useSimuladoSession` já fazem `select("*")` em `questions` e normalizam via `normalizeQuestionImages`. Nada a alterar no fetch.

## Observações técnicas
- Endpoint mantido: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` com `gemini-2.5-flash-lite`, que aceita `image_url` no formato OpenAI-compat.
- Bucket `question-images` é público → URL bate direto, sem signed URL.
- Apenas a primeira imagem é enviada para manter custo/latência baixos (questões com múltiplas imagens são raras nesse contexto e a principal costuma carregar o significado).

## Decisão consciente sobre o cache existente
A tabela `question_pedagogy` cacheia por `question_id` sem distinguir se a geração teve visão ou não. Isso significa:
- Questões já abertas por qualquer usuário antes do deploy ficam com pedagogia **textual** gravada para sempre.
- Questões abertas pela primeira vez após o deploy passam a usar visão automaticamente.

**Decisão recomendada: aceitar.** É a opção mais simples e o impacto é limitado — a base de pedagogia cacheada ainda é pequena no estágio atual e o ganho marginal de invalidar não compensa a complexidade. Caso no futuro queiramos invalidar seletivamente, basta adicionar uma coluna `has_image boolean` em `question_pedagogy` e um backfill que limpa registros onde a questão tem imagem mas o cache foi gerado sem ela.
