
## Objetivo

Reescrever `renderMath` para renderizar corretamente fórmulas químicas, frações empilhadas, raízes e macros LaTeX. Corrigir o bug do subscrito greedy (`H_2O` → subscrevendo "2O" inteiro).

## Mudanças

### 1. Reescrever `src/lib/renderMath.ts`

Substituir a implementação atual (que usa KaTeX e retorna string HTML) pela nova versão fornecida nas instruções, que:
- Retorna `ReactNode` em vez de string
- Suporta `\frac{num}{den}` com componente `Frac` (flex-col)
- Suporta `\sqrt{x}` e `\sqrt[n]{x}` com componente `Sqrt`
- Expande macros LaTeX (`\times` → ×, `\pi` → π, etc.)
- Corrige subscrito: `_X` captura apenas 1 char (não greedy)
- Remove dependência do KaTeX

Remover `katex` do package.json (`bun remove katex`).

### 2. Criar `renderMathHtml` para contextos de string HTML

O `MarkdownText.tsx` usa `renderMath` dentro de uma pipeline que retorna string HTML (concatenada com bold/italic/cite já em HTML). Não dá para injetar ReactNode ali.

Solução: exportar uma segunda função `renderMathHtml(text: string): string` no mesmo arquivo que faz as mesmas expansões (macros, sub/sup, frac, sqrt) mas retorna HTML string. Frac e Sqrt serão `<span>` com inline styles.

### 3. Atualizar 6 consumidores

| Arquivo | Mudança |
|---------|---------|
| `EnemQuestionCard.tsx` | `mathHtml` → usar `renderMath` direto, remover `dangerouslySetInnerHTML`, renderizar `{renderMath(text)}` |
| `QuestionContent.tsx` | Idem |
| `Objectives.tsx` | `<span dangerouslySetInnerHTML=...>` → `<span>{renderMath(alt.text)}</span>` |
| `Diagnostico.tsx` | Idem |
| `SimuladoSession.tsx` | Idem |
| `MarkdownText.tsx` | Trocar `renderMath` por `renderMathHtml` (mantém pipeline HTML) |

### 4. Safelist Tailwind (preventivo)

Adicionar safelist em `tailwind.config.ts` com as classes usadas nos componentes Frac/Sqrt.

### Detalhes técnicos

- A função `renderMath` agora é recursiva (frac chama renderMath no numerador/denominador), permitindo fórmulas compostas como `\frac{k^{2}\sqrt{3}}{24}`
- O regex de subscrito muda de `_([\w]+)` (greedy, multi-char) para `_(\w)` (1 char apenas), com `_{...}` para múltiplos chars — corrigindo o bug de `H_2O`
- O HTML escaping (que antes era feito nos `mathHtml` helpers) será feito dentro do novo `renderMath` antes do parse, já que agora retorna React nodes seguros
