
# Fase 1 — Implementação

Verificação feita: **MarkdownText.tsx não tem nenhum regex `[cite]`** — será adicionado novo. **InlineStatementRenderer.tsx tem regex `[CITE]` nas linhas 95 e 97** — receberá flag `i`.

## 1.1 Regex [cite] case-insensitive

**`src/components/study/InlineStatementRenderer.tsx`** — adicionar flag `i` nos regexes das linhas 95 e 97.

**`src/components/atlas/MarkdownText.tsx`** — duas mudanças:
1. Em `markdownToHtml`: pré-processar blocos `[cite]...[/cite]` antes do split por linhas, extraindo-os como spans HTML dedicados para que citações multi-linha não sejam quebradas pelo autoFormat.
2. Em `formatInline`: adicionar regex `[cite]` case-insensitive como fallback para citações inline curtas.

## 1.2 Filtrar questões anuladas

**`src/hooks/useStudySession.ts`**:
- Tipo `correct_answer: string` → `string | null`
- Adicionar `.not('correct_answer', 'is', null)` nas queries das linhas 672, 714, 1161
- Linha 818 (single question by ID) mantém sem filtro

**`src/hooks/useSimuladoSession.ts`**:
- Adicionar `.not('correct_answer', 'is', null)` na query da linha 151-157

**`src/components/admin/QuestionsPanel.tsx`**:
- Badge "Anulada" quando `correct_answer === null`

## 1.3 Fallback topic Geral

**`src/hooks/useStudySession.ts`**:
- Em `mapQuestion` (linha 408): `topic: normalizeTopic(q.topic) === 'Geral' ? (q.disciplina || q.area) : normalizeTopic(q.topic)`

5 arquivos, 0 migrations. Screenshot após deploy para validação.
