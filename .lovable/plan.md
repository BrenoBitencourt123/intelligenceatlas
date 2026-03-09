

## Plano: Header como banner de urgência + corrigir hero cortado

### Problemas identificados
1. **Header sem destaque** — o "20 vagas restantes" está discreto, em texto pequeno cinza ao lado do logo. Não comunica urgência.
2. **Hero cortado** — no notebook a seção hero não cabe na viewport, cortando conteúdo embaixo.

### Solução

#### 1. Transformar o header num banner de escassez (full-width, com cor de fundo)

Substituir o navbar atual por um **banner compacto de urgência** com fundo escuro (foreground) e texto claro, full-width, estilo top-bar:

```tsx
<motion.nav className="fixed top-0 left-0 right-0 z-50">
  {/* Banner de urgência — fundo escuro, full-width */}
  <div className="bg-foreground text-background">
    <div className="max-w-5xl mx-auto flex items-center justify-center px-5 h-10 gap-2">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute ... bg-red-400 opacity-75" />
        <span className="relative ... bg-red-400" />
      </span>
      <span className="text-xs sm:text-sm font-semibold tracking-wide">
        🔥 Apenas {vagasRestantes} vagas restantes — 50% off para sempre
      </span>
    </div>
  </div>
  {/* Navbar normal abaixo */}
  <div className="backdrop-blur-xl bg-background/80 border-b border-border/50">
    <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-12">
      <div className="flex items-center gap-2">
        <img ... /> <span>Atlas</span>
      </div>
      {/* Botão CTA aparece ao scrollar */}
      ...
    </div>
  </div>
</motion.nav>
```

Isso cria um **banner preto no topo** com a mensagem de escassez centralizada, impossível de ignorar. Abaixo dele, o navbar normal com logo + botão CTA no scroll.

#### 2. Ajustar padding do hero para não cortar

O hero tem `pt-28` no mobile mas o header agora é mais alto (~h-10 + h-12 = ~5.5rem). Ajustar para `pt-24 sm:pt-0` e usar `min-h-[calc(100vh-5.5rem)]` ou simplesmente `min-h-screen` com o conteúdo tendo `space-y-4 sm:space-y-8` (reduzir gaps no mobile/laptop).

### Arquivo editado
- `src/pages/Founders.tsx`

