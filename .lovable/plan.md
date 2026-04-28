## Objetivo

Renderizar trechos marcados com `[CITE]...[/CITE]` no `statement` das questões como citações discretas (cinza, itálico, pequeno, alinhadas à direita), separando-as visualmente do conteúdo principal.

## Arquivo afetado

- `src/components/study/InlineStatementRenderer.tsx`

## Mudanças

### 1. Helper de renderização de texto com suporte a [CITE]

Criar uma função interna `renderTextSegment(part: string, idx: number | string)` que:
- Faz split do segmento por blocos `[CITE]...[/CITE]` usando regex `/(\[CITE\][\s\S]*?\[\/CITE\])/g`
- Para cada subparte:
  - Se casar `^\s*\[CITE\]([\s\S]*?)\[\/CITE\]\s*$`, retorna:
    ```tsx
    <p key={...} className="text-xs text-muted-foreground italic text-right mt-1 leading-relaxed">
      {citeMatch[1].trim()}
    </p>
    ```
  - Caso contrário (e se não vazio), retorna `<MarkdownText content={subpart} className="text-sm leading-relaxed" />`

Esse helper centraliza a lógica para que tanto o caminho do split por imagens quanto o fallback usem o mesmo tratamento.

### 2. Caminho com placeholders de imagem (linhas 82–86)

Substituir o ramo "Text segment" do map para chamar `renderTextSegment(part, idx)` em vez de renderizar `<MarkdownText>` diretamente.

### 3. Caminho de fallback (linhas 47–53)

No fallback (sem placeholders ou não resolvíveis), substituir o `<MarkdownText content={statement} ... />` por `renderTextSegment(statement, 'fallback')` envolvido apropriadamente, mantendo o fallback "Esta questão usa imagem como enunciado principal." quando `statement` estiver vazio.

## Notas

- Estilo das citações: `text-xs text-muted-foreground italic text-right mt-1 leading-relaxed` (conforme especificado).
- Não altera nenhum outro componente nem o pipeline de formatação automática do `MarkdownText`.
- Marcadores `[CITE]` são tratados em nível de segmento de texto, antes de chegarem ao Markdown — então o auto-format de referências do `MarkdownText` não interfere.
