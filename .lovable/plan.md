

## Plano: Eyebrow em duas linhas

Alterar o texto do eyebrow de uma linha com separador `·` para duas linhas centralizadas:

```
INTELIGÊNCIA ATLAS
LANÇAMENTO EXCLUSIVO
```

### Mudança em `src/pages/Founders.tsx` (linhas 158-166)

Substituir o conteúdo do `<motion.p>` por duas linhas com `<br />`:

```tsx
<motion.p
  className="text-[0.65rem] sm:text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground leading-relaxed"
  variants={fadeUp}
  initial="hidden"
  animate="visible"
  custom={0}>
  Inteligência Atlas
  <br />
  Lançamento exclusivo
</motion.p>
```

- Adiciona `leading-relaxed` para espaçamento entre as duas linhas.
- Remove o `·` separador.
- `uppercase` já está aplicado, então ambas ficam em maiúsculo automaticamente.

