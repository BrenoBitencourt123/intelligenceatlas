
## Correção de Cores da Página /fundadores

### Problema
O hero está com fundo escuro (`bg-[#0a0a0a]`), mas a referência visual mostra fundo claro off-white.

### Alterações no Hero (linhas 151-257)

| Elemento | Atual | Correção |
|----------|-------|----------|
| Background | `bg-[#0a0a0a]` | `bg-[#faf9f6]` (off-white) |
| Headline | `text-white` | `text-foreground` |
| "50% de desconto" | gradient amber/yellow | `text-amber-600` (sólido) |
| Descrição | `text-gray-400` | `text-muted-foreground` |
| Texto "vagas preenchidas" | `text-foreground` | mantém (funciona em light) |
| "Arraste para baixo" | já usa `text-muted-foreground` | ok |

### Código a alterar

**Linha 154** - Background:
```tsx
className="... bg-[#faf9f6]"
```

**Linha 170** - Headline:
```tsx
className="... text-foreground"  // remove text-white
```

**Linhas 182-183** - Desconto (remover gradient):
```tsx
className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600"
```

**Linha 194** - Descrição:
```tsx
className="... text-muted-foreground ..."  // troca text-gray-400
```

O gradiente arco-íris do eyebrow (linha 159) permanece intacto.
