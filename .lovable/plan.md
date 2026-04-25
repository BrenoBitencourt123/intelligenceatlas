## Normalização de imagens das questões — `images[]` como fonte de verdade

### Estado atual no banco

Verificação direta: das 185 questões, **0 têm `image_url` preenchido** e 121 têm `images` vazio. Ou seja, hoje **nenhuma linha precisa migrar dados**, mas a migration continua valiosa como salvaguarda contra dados legados que possam aparecer (ex.: imports antigos, scripts admin) e para deixar o invariante explícito.

### Estado atual no frontend

Já existem **três cópias** quase idênticas de uma função `normalizeImages`/`normalizeQuestionImages` que faz exatamente o que o prompt pede (priorizar `images[]`, cair para `image_url`):

- `src/hooks/useStudySession.ts` (linha 103) — usado no fluxo principal de Objetivas
- `src/pages/Diagnostico.tsx` (linha 56) — usado no diagnóstico inicial
- `src/hooks/useImportExam.ts` (linha 163) — usado no admin de importação (essa não recebe `image_url`, só array)

Outros pontos relevantes:
- `useStudySession.ts:894`: `question.images?.[0]?.url ?? question.image_url ?? null` — já correto.
- `Objectives.tsx:390/427` e `Diagnostico.tsx:469`: leem `alt.image_url` (campo dentro de **alternativa**, não da questão). **Fora de escopo** — o prompt fala de `image_url` da questão.
- `useFlashcardReview.ts:22`: `Flashcard.image_url` vem da edge function `flashcards-smart` e não da tabela `questions`. Fora de escopo.
- `QuestionsPanel.tsx`: tem `image_url` no tipo TS mas **não renderiza o campo**, só usa `images`. Não precisa mudar.

### Plano

#### 1. Migration de dados (idempotente, segura)

Arquivo: `supabase/migrations/<timestamp>_normalize_question_images.sql`

```sql
-- Para cada questão com image_url preenchido mas images vazio/nulo,
-- popula images com [{url, order: 0}] preservando image_url intacto.
UPDATE public.questions
SET images = jsonb_build_array(
  jsonb_build_object('url', image_url, 'order', 0)
)
WHERE image_url IS NOT NULL
  AND image_url <> ''
  AND (images IS NULL OR jsonb_array_length(images) = 0);
```

- **Não deleta** `image_url`.
- **Não toca** linhas que já têm `images` populado.
- Como `0` linhas precisam, o `UPDATE` afeta 0 rows na primeira execução — esperado.

#### 2. Centralizar a normalização (DRY + correção)

Criar export em `src/lib/questionImages.ts`:

```ts
export function normalizeQuestionImages(
  images: unknown,
  imageUrl?: string | null,
): QuestionImage[] {
  // mesma lógica das três cópias, prioriza array, fallback p/ imageUrl
}
```

Atualizar imports em:
- `src/hooks/useStudySession.ts` — remover a função local, importar do lib.
- `src/pages/Diagnostico.tsx` — idem.
- `src/hooks/useImportExam.ts` — usar a versão central (sem passar `imageUrl`).

Comportamento idêntico ao atual, só consolidado em um lugar.

#### 3. Garantir prioridade `images[]` em todos os pontos de leitura da imagem da questão

- `useStudySession.ts:894` já está correto. Manter.
- Buscar e ajustar qualquer outro `.image_url` direto da **questão** (não de alternativa). Após a busca acima, só esse ponto existe.

### Garantias

- Nenhum dado é perdido: `image_url` permanece intacto na tabela.
- Nenhuma query de leitura quebra: `image_url` continua selecionável.
- Comportamento atual (já com fallback) preservado, só centralizado.
- Componentes que usam `alt.image_url` (alternativa) ficam fora — escopo diferente.

### Arquivos afetados

- **Novo**: `supabase/migrations/<timestamp>_normalize_question_images.sql`
- **Edit**: `src/lib/questionImages.ts` (adiciona `normalizeQuestionImages`)
- **Edit**: `src/hooks/useStudySession.ts` (importa do lib, remove cópia local)
- **Edit**: `src/pages/Diagnostico.tsx` (importa do lib, remove cópia local)
- **Edit**: `src/hooks/useImportExam.ts` (importa do lib, remove cópia local)

### Verificação após implementar

- `bun run build` passa.
- Query: `SELECT count(*) FROM questions WHERE image_url IS NOT NULL AND image_url <> '' AND (images IS NULL OR jsonb_array_length(images) = 0)` deve retornar `0`.
- Fluxo de Objetivas e Diagnóstico continua mostrando imagens normalmente.
