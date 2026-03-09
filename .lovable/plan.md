

## Plano: Mover urgência do badge pill para o header

Concordo — o badge pill vermelho no hero compete com o visual clean e o header já está "vazio" na maioria do tempo. Melhor usar esse espaço.

### Mudanças em `src/pages/Founders.tsx`

**1. Remover o badge pill do hero (linhas 155-175)**
Deletar todo o `motion.div` com o badge de urgência pulsante.

**2. Adicionar indicador de vagas no header (linhas 122-146)**
No navbar, ao lado do logo (lado esquerdo), adicionar um texto compacto com o ponto pulsante:

```tsx
<div className="flex items-center gap-2">
  <img src="/icon-192.png" alt="Atlas" className="h-6 w-6" />
  <span className="text-base font-bold tracking-tight text-foreground">Atlas</span>
  <span className="mx-1.5 h-4 w-px bg-border" /> {/* separador */}
  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
    </span>
    {vagasRestantes} vagas restantes
  </span>
</div>
```

Isso mantém a urgência sempre visível (sticky header), é discreto e elegante, e libera espaço no hero para o conteúdo respirar.

### Arquivo editado
- `src/pages/Founders.tsx`

