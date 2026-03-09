

## Plano: Corrigir logo e espaçamento do hero

### 1. Logo sem símbolo visível
O `favicon.ico` com `brightness-0 invert` renderiza como um círculo sólido. Solução: remover `brightness-0 invert` e usar apenas `invert` (ou `filter: invert(1)`) para manter o símbolo visível. Se o ícone original for escuro sobre transparente, `invert` sozinho deve funcionar. Se não resolver, alternativa é usar o texto "Atlas" sozinho sem o ícone, ou usar um PNG dedicado para fundo escuro.

**Linha 127** — trocar:
```tsx
className="h-5 w-5 rounded brightness-0 invert"
```
por:
```tsx
className="h-5 w-5 rounded invert"
```

### 2. Header cortando conteúdo
Aumentar `pt-35` para `pt-40` no hero (linha 168) para dar mais folga ao conteúdo abaixo do header fixo.

### Arquivo
- `src/pages/Founders.tsx` — linhas 127 e 168

