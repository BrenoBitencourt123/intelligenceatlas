
# Fix Bug 1 + Diagnóstico Bugs 2 e 3

## Bug 1 — renderMath nas alternativas (FIX)

Causa confirmada: `alt.text` é renderizado como texto bruto em 3 páginas, sem passar por `renderMath`.

| Arquivo | Linha | Atual | Fix |
|---------|-------|-------|-----|
| `src/pages/Objectives.tsx` | 563 | `<span>{alt.text}</span>` | `<span dangerouslySetInnerHTML={{ __html: renderMath(alt.text \|\| '') }} />` |
| `src/pages/SimuladoSession.tsx` | 287 | `<span>{alt.text}</span>` | idem |
| `src/pages/Diagnostico.tsx` | 453 | `{alt.text}` | `<span dangerouslySetInnerHTML={{ __html: renderMath(alt.text \|\| '') }} />` |

Adicionar `import { renderMath } from '@/lib/renderMath'` nos 3 arquivos (se não existir).

---

## Bug 2 — Console log diagnóstico no MarkdownText

Adicionar log temporário no `markdownToHtml` de `src/components/atlas/MarkdownText.tsx`, logo antes do replace de cite:

```typescript
console.log('[MarkdownText] input text (first 200 chars):', text?.slice(0, 200));
console.log('[MarkdownText] cite regex match:', text?.match(/\[cite\]/gi));
```

Isso responde: o texto chega com `[cite]` intacto ou já escapado como `&amp;#91;cite&amp;#93;`?

---

## Bug 3 — Console log diagnóstico no InlineStatementRenderer

Adicionar log temporário no `InlineStatementRenderer`, dentro do componente antes do return:

```typescript
console.log('[InlineStatement] images received:', images.length, images);
console.log('[InlineStatement] hasPlaceholders:', hasPlaceholders, 'hasResolvable:', hasResolvablePlaceholder);
```

Isso responde: as imagens estão chegando do fetch ou o array está vazio?

---

## Após deploy

Navegar até uma questão real (Q91, Q106 ou Q173 do ENEM 2025) no preview e verificar:
1. Screenshot — alternativas com notação matemática renderizando como superscript/subscript
2. Console — logs de cite e images para confirmar se Bugs 2 e 3 estão funcionando ou não
3. Se os logs mostrarem problema, fazer segundo fix direcionado

Os console logs serão removidos após diagnóstico.
