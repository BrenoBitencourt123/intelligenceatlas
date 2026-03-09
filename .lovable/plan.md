

## Plano: Unificar em um único header-banner forte

### O que muda

Remover o navbar translúcido (linhas 137-164 — logo Atlas + botão "Garantir vaga") e manter **apenas o banner preto**, mas mais alto e com mais conteúdo:

```tsx
<div className="bg-foreground text-background">
  <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-14 gap-4">
    {/* Logo à esquerda */}
    <div className="flex items-center gap-2">
      <img src="/icon-192.png" alt="Atlas" className="h-5 w-5 brightness-0 invert" />
      <span className="text-sm font-bold tracking-tight">Atlas</span>
    </div>

    {/* Urgência centralizada */}
    <div className="flex items-center gap-2">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
      </span>
      <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">
        🔥 Apenas {vagasRestantes} vagas restantes — 50% off para sempre
      </span>
    </div>

    {/* CTA à direita (aparece no scroll) */}
    <motion.div ...>
      <Button size="sm" className="rounded-full bg-background text-foreground hover:bg-background/90 ...">
        Garantir vaga
      </Button>
    </motion.div>
  </div>
</div>
```

- **Um único header preto** (`h-14`), logo à esquerda, urgência no centro, CTA à direita
- Sem segundo navbar translúcido
- Ajustar `pt` do hero para compensar a altura menor do header único (~3.5rem vs ~5.5rem anterior)

### Arquivo editado
- `src/pages/Founders.tsx`

