## Hierarquia tipográfica em `EnemQuestionCard.tsx`

Objetivo: deixar claro para o aluno o que é **contexto** (enunciado) e o que é **pergunta** (comando), sem mexer em nenhuma lógica do componente.

### Diagnóstico do estado atual

No arquivo `src/components/study/EnemQuestionCard.tsx`:

- **Enunciado** (blocos em `question.content` do tipo `text`) é renderizado por `ContentText` com:
  - `text-foreground text-sm` no caso padrão
  - `text-muted-foreground text-xs` apenas quando `format.color === 'muted'`
  - `font-semibold` quando o bloco vem com `format.bold = true` (vários blocos do banco vêm assim, o que dá a sensação de "tudo em negrito")

- **Comando** (`question.command`) é renderizado por um `<p>` separado com:
  - `text-sm font-semibold text-foreground`

Como ambos usam praticamente o mesmo estilo (`text-sm` + cor padrão + semibold em vários casos), a hierarquia some.

### Mudanças propostas (apenas estilo)

1. **`ContentText`** — suavizar o enunciado padrão:
   - Trocar a cor padrão de `text-foreground` para `text-muted-foreground` (cor de texto secundário do design system)
   - Manter `text-sm`, leading e whitespace
   - **Ignorar `format.bold`** na renderização (forçar peso normal nos blocos de contexto, para não competir com o comando). O `format.bold` continua existindo no tipo, só não é mais aplicado visualmente — isso é o que evita o "tudo em negrito".
   - Manter o caso `format.color === 'muted'` como está (já é mais suave ainda)
   - Alinhamento (`align`) continua respeitado

2. **Bloco do `command`** — reforçar a pergunta:
   - Trocar `font-semibold` por `font-bold`
   - Trocar `text-foreground` por `text-foreground` explicitamente preto via classe utilitária do design system: usar `text-foreground` mantido, mas com `font-bold` + `text-base` (sobe meio nível em relação ao enunciado em `text-sm`) para reforçar hierarquia por peso **e** tamanho.
   - Manter `leading-relaxed`

Resultado visual:
```text
[contexto em cinza/muted, peso normal, text-sm]
[contexto em cinza/muted, peso normal, text-sm]

[COMANDO em preto, bold, text-base]   ← olho do aluno vai direto aqui

A) ...
B) ...
```

### Garantias

- Nenhuma alteração em props, tipos, estado (`internalAnswer`), handlers (`handleSelect`), `Alternative`, `ContentImage`, header com `Badge`, ou na estrutura do componente.
- Apenas classes Tailwind nos elementos de texto do enunciado e do comando são ajustadas.
- Imagens, legendas e alternativas permanecem idênticas.

### Arquivos afetados

- `src/components/study/EnemQuestionCard.tsx` (apenas classes nos componentes `ContentText` e no parágrafo do `command`)
