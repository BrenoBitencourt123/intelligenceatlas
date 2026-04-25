## Migrar `renderMath` para KaTeX (mantendo a mesma assinatura)

### O que muda

- **Instalar dependência**: `katex` (com `@types/katex`).
- **Importar o CSS do KaTeX** uma única vez na entrada do app (via `import 'katex/dist/katex.min.css'` dentro do próprio `renderMath.ts`, no topo). Isso evita tocar em qualquer outro arquivo (`main.tsx`, `index.css`, etc.) — Vite resolve o CSS automaticamente quando o módulo é importado pelos componentes que já usam `renderMath`.
- **Reescrever `src/lib/renderMath.ts`** para detectar e renderizar fórmulas LaTeX usando KaTeX, preservando o resto do texto intacto.

### Comportamento da nova `renderMath(text)`

Mantém a assinatura `(text: string) => string` (HTML string, usada em `dangerouslySetInnerHTML`). Algoritmo:

1. Se `text` for vazio/nulo, retorna `''`.
2. Faz parse procurando, **nesta ordem de prioridade**:
   - Bloco display: `$$...$$` ou `\[...\]` → `katex.renderToString(expr, { displayMode: true, throwOnError: false, output: 'html' })`
   - Inline: `$...$` (não-greedy, sem `$$` adjacentes) ou `\(...\)` → `katex.renderToString(expr, { displayMode: false, throwOnError: false, output: 'html' })`
3. Trechos **fora** dos delimitadores são preservados exatamente como vieram (texto/HTML que o chamador já passou — ex.: `MarkdownText` passa HTML pós-markdown; `EnemQuestionCard.mathHtml` já escapou e passa texto-escapado).
4. **Compatibilidade retroativa** com a sintaxe antiga (`x^2`, `H_2`, `x^{n+1}`, `H_{2}`): aplicada **apenas nos pedaços fora de delimitadores LaTeX**, convertendo para `<sup>`/`<sub>` como hoje. Isso garante que questões já existentes no banco (que usam `^` e `_` soltos) continuem renderizando idênticas, sem quebrar nada.
5. `throwOnError: false` faz o KaTeX renderizar a expressão inválida em vermelho em vez de derrubar a UI. Adicionalmente, envolvemos cada `renderToString` em try/catch e, em caso de falha, devolvemos o trecho original (`$...$` literal) — defesa em profundidade.

### Suporte resultante

Tudo que LaTeX/KaTeX já suporta nativamente, incluindo:
- Frações `\frac{a}{b}`
- Integrais `\int_a^b`, somatórios `\sum_{i=1}^n`
- Raízes `\sqrt{x}`, `\sqrt[3]{x}`
- Notação química via `\text{}` e subscritos (ex.: `H_2O`, `\text{CO}_2`)
- Matrizes, vetores, símbolos gregos, operadores, etc.

### Por que importar o CSS dentro do `renderMath.ts`

O usuário pediu para não alterar outros arquivos além do `renderMath.ts` e o necessário para configurar o KaTeX. Importar o CSS no próprio módulo:
- Cumpre essa restrição (Vite faz tree-shaking/CSS bundling automaticamente).
- Garante que qualquer componente que use `renderMath` traga junto o estilo das fórmulas, sem dependência de ordem de importação em `main.tsx`.

### Arquivos afetados

- `package.json` (adição de `katex` e `@types/katex` via `bun add` / `bun add -d`).
- `src/lib/renderMath.ts` (reescrito).

### Garantias

- Nenhum dos componentes que chama `renderMath` (`MarkdownText.tsx`, `EnemQuestionCard.tsx`) é tocado.
- Texto puro sem `$`, `\(`, `\[`, `^`, `_` passa através inalterado.
- Sintaxe antiga (`x^2`, `H_2`) continua funcionando.
- Erros de LaTeX não derrubam a UI.

### Verificação após implementar

- `bun run build` deve passar sem erro de tipos.
- Abrir uma questão com texto comum: continua igual.
- Abrir uma questão com `H_2O` ou `x^2`: continua mostrando subscript/superscript como hoje.
- Inserir `$\frac{1}{2}$` no texto de uma questão (manual via banco/admin para teste): renderiza fração KaTeX.
