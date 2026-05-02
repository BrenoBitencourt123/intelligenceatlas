
## Respostas aos 4 pontos

### 1. Diagnostico.tsx
**Sim, precisa do fallback.** `Diagnostico.tsx` importa e usa `InlineStatementRenderer` (linha 9 e 421). Vai precisar do mesmo fallback `content` vs `statement`. Vou incluir no plano.

### 2. Tela "Aquecimento" / Q115
A rota `/simulado/sessao` renderiza via `SimuladoSession.tsx`, que também usa `InlineStatementRenderer` (linha 11). Não existe componente separado de "Aquecimento" -- tudo passa pelo mesmo renderer. Ou seja, os 3 pontos de uso são:
- `Objectives.tsx`
- `SimuladoSession.tsx`
- `Diagnostico.tsx`

O `EnemQuestionCard.tsx` existe no código mas **nunca é importado por nenhum arquivo** -- é dead code. Não precisa de fallback.

### 3. Campo de imagem: `url` vs `data`
O tipo `EnemContentBlock` atual usa `data` (campo `data?: string`). O `EnemQuestionCard` (dead code) lê `block.data`. No seu JSON atual, o campo também é `data` (com base64).

**Proposta:** vou manter o campo como `data` no tipo TypeScript para compatibilidade com o tipo existente. Você popula `data` com a URL do bucket Supabase (não precisa ser base64 -- funciona igual num `<img src>`). Se preferir ter um campo `url` separado, eu adiciono ao tipo, mas é redundante. Recomendo usar `data` mesmo, só trocando o valor de base64 para URL.

### 4. Estratégia de transição (dual-write)
**Totalmente a favor.** Popular AMBOS `content` + `statement` é a abordagem mais segura. O fluxo fica:
- Se `content` existe e tem itens -> usa `QuestionContent` (novo)
- Senão -> usa `InlineStatementRenderer` (antigo, lendo `statement`)

Quando estável, você dropa `statement` depois. Zero risco de rollback.

---

## Plano revisado de implementação

### 1. Migração SQL
```sql
ALTER TABLE questions ADD COLUMN content JSONB DEFAULT NULL;
ALTER TABLE questions ADD COLUMN command TEXT DEFAULT NULL;
```

### 2. Tipo TypeScript atualizado (`src/types/enemQuestion.ts`)
- Adicionar `'citation'` ao union type de `EnemContentBlock.type`
- Tipo já usa `data` para imagens -- manter assim

### 3. Novo componente `QuestionContent.tsx`
Switch simples sobre `block.type`:
- `text` -> `<div>` com `renderMath`, respeitando `format.bold/color/align`
- `image` -> `<figure><img src={block.data}>` + caption
- `citation` -> `<p>` italic muted right-aligned
- `table` -> tabela HTML
- `command` -> `<p className="font-bold">` separado

### 4. Fallback nos 3 pontos de uso
- `Objectives.tsx` (linha ~514)
- `SimuladoSession.tsx`
- `Diagnostico.tsx` (linha ~421)

Lógica: `question.content?.length > 0 ? <QuestionContent> : <InlineStatementRenderer>`

### 5. Hook `useStudySession.ts`
Incluir `content, command` no `.select()` das queries (linhas 672 e 714).

### 6. Hook `useSimuladoSession.ts`
Mesmo ajuste de `.select()`.

### 7. Tipo `DiagQuestion` em `Diagnostico.tsx`
Adicionar `content?: EnemContentBlock[]` e `command?: string`.

---

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | `ADD COLUMN content JSONB`, `ADD COLUMN command TEXT` |
| `src/types/enemQuestion.ts` | Adicionar `citation` ao type union |
| `src/components/study/QuestionContent.tsx` | **Novo** componente |
| `src/pages/Objectives.tsx` | Fallback content vs statement |
| `src/pages/SimuladoSession.tsx` | Fallback content vs statement |
| `src/pages/Diagnostico.tsx` | Fallback content vs statement |
| `src/hooks/useStudySession.ts` | Select content, command |
| `src/hooks/useSimuladoSession.ts` | Select content, command |

Nada muda no `InlineStatementRenderer` nem no `MarkdownText` -- continuam intactos para questões antigas.
