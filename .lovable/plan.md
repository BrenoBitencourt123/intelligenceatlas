

## Plano: Componente de Questão ENEM com renderização matemática/química

### Problema
Textos com notação tipo `H_{2}O`, `10^3`, `x^{-1}` aparecem crus para o usuário. Não existe `renderMath` no projeto.

### Mudanças

**1. Função `renderMath` em `src/lib/renderMath.ts`**
- Regex: `/\^[({]([^)}]+)[)}]|\^([\w\-+]+)|_[({]([^)}]+)[)}]|_([\w]+)/g`
- Converte `^` → `<sup>`, `_` → `<sub>`
- Exporta como string HTML

**2. Integrar `renderMath` no `MarkdownText` existente**
- Chamar `renderMath()` dentro de `formatInline()` para que todos os textos do app (enunciados, alternativas) já se beneficiem automaticamente
- Isso resolve o problema atual sem precisar de componente novo

**3. Novo componente `src/components/study/EnemQuestionCard.tsx`**
- Props: `question` (estrutura do JSON informado), `selectedAnswer`, `onSelectAnswer`
- Header: badge com exam + número
- Content blocks renderizados em ordem:
  - `type: "text"` → `<div>` com `whitespace-pre-wrap`, respeita `format.color/bold/align`, usa `dangerouslySetInnerHTML` com `renderMath` + `formatInline`
  - `type: "image"` → imagem centralizada, `max-h-[280px]`, rounded, caption em cinza
- Command: texto em `font-medium font-semibold` com renderMath
- Alternativas A–E: botões clicáveis com círculo de letra à esquerda
  - Neutro: `border-gray-200 bg-white`
  - Selecionado: `border-violet-500 bg-violet-50`, círculo `bg-violet-500 text-white`
  - Texto com renderMath; se `image` presente, exibe abaixo do texto
- Visual: `bg-white rounded-xl shadow-sm`, espaçamento generoso

**4. Tipos em `src/types/enemQuestion.ts`**
- Interfaces: `EnemContentBlock`, `EnemAlternative`, `EnemQuestion`

### Ordem
1. Criar `renderMath` utility
2. Integrar no `formatInline` do MarkdownText (fix global)
3. Criar tipos
4. Criar `EnemQuestionCard`

