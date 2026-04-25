## Suporte a tabelas em questões ENEM

### Arquivos afetados

- `src/types/enemQuestion.ts` — estender `EnemContentBlock` e adicionar `EnemTableBlock`
- `src/components/study/EnemQuestionCard.tsx` — adicionar `ContentTable` e renderizar quando `block.type === 'table'`

### Mudança no tipo

Em `src/types/enemQuestion.ts`:

- Adicionar campos opcionais `headers?: string[]` e `rows?: string[][]` em `EnemContentBlock`.
- Estender o union de `type`: `'text' | 'image' | 'table'`.
- (Opcional, sem impacto): manter os campos existentes intactos para não quebrar `text`/`image`.

```ts
export interface EnemContentBlock {
  type: 'text' | 'image' | 'table';
  value?: string;
  data?: string;
  caption?: string;
  format?: EnemContentFormat;
  headers?: string[];
  rows?: string[][];
}
```

### Renderização

Novo subcomponente `ContentTable` em `EnemQuestionCard.tsx`:

- Wrapper `<figure>` com scroll horizontal (`overflow-x-auto`) + borda arredondada para mobile.
- `<table>` com `w-full text-sm border-collapse`.
- `<thead>`: fundo `bg-muted/40`, células com `px-3 py-2 text-left font-semibold text-foreground border-b border-border`.
- `<tbody>`: linhas com `border-b border-border last:border-0`, hover sutil `hover:bg-muted/30`.
- Células de corpo `px-3 py-2 text-foreground align-top`.
- Cada célula passa por `mathHtml` para suportar fórmulas/química como nos outros blocos.
- Suporte a `caption` opcional renderizado abaixo da tabela como `<figcaption>` (mesmo padrão de `ContentImage`).
- Guarda defensiva: se `headers` ou `rows` estiverem ausentes, não renderiza nada.

### Wiring no map de blocos

Adicionar mais um `React.Fragment`:

```tsx
{block.type === 'table' && <ContentTable block={block} />}
```

`text` e `image` permanecem inalterados.

### Garantias

- Tipos existentes (`text`, `image`) sem alteração de comportamento.
- Nenhum dado existente é tocado (campos novos são opcionais).
- Estilo segue tokens do design system (`border`, `muted`, `foreground`, `card`) — sem cores hardcoded.
- Responsivo via `overflow-x-auto` no container.
