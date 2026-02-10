

## Diagramacao das Questoes com Markdown

### O que muda

A IA que extrai questoes do PDF passara a formatar o texto usando Markdown, e a interface de estudo renderizara essa formatacao corretamente.

### Formatacao que a IA aplicara

- **Enunciado principal** em negrito
- *Textos de apoio* (poemas, trechos, citacoes) em blocos italicos ou citacao (`>`)
- Separacao clara entre texto-base e pergunta
- Alternativas mantidas como texto limpo (ja sao exibidas com botoes)
- Quebras de linha preservadas em poemas e listas

### Mudancas tecnicas

**1. Edge Function `parse-exam-pdf`**
- Atualizar o `SYSTEM_PROMPT` (linhas 8-51) para instruir o modelo a usar Markdown no campo `statement`:
  - Textos de apoio em bloco de citacao (`>`)
  - Titulo/fonte do texto em italico
  - Pergunta final em negrito
  - Preservar formatacao de poemas com quebras de linha

**2. Pagina Objectives (`src/pages/Objectives.tsx`)**
- Trocar a tag `<p>` que renderiza `currentQuestion.statement` (linha 123) por um componente que interpreta Markdown
- Usar `dangerouslySetInnerHTML` com uma funcao simples de conversao Markdown-to-HTML (negrito, italico, citacao, quebra de linha) -- sem necessidade de biblioteca externa
- Ou criar um componente `MarkdownText` reutilizavel com regex para os padroes basicos

**3. Pagina Flashcards (`src/pages/Flashcards.tsx`)**
- Aplicar a mesma renderizacao Markdown no `front` dos flashcards, que pode conter enunciados formatados

### O que NAO muda

- Questoes ja importadas continuarao com texto simples (sem Markdown) -- a formatacao so se aplica a novas importacoes
- As alternativas continuam sendo exibidas como botoes separados, sem Markdown
- A estrutura do banco de dados permanece igual

### Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/parse-exam-pdf/index.ts` | Prompt atualizado para gerar Markdown |
| `src/pages/Objectives.tsx` | Renderizar statement como Markdown |
| `src/pages/Flashcards.tsx` | Renderizar front/back como Markdown |
| `src/components/atlas/MarkdownText.tsx` | **Novo** - componente reutilizavel de Markdown simples |
