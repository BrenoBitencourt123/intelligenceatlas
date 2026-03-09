

## Plano: Estreitar o parágrafo descritivo no mobile

O parágrafo "Um sistema que adapta o estudo às suas fraquezas..." já tem `max-w-md` (~28rem), mas no mobile isso não limita nada porque a tela já é menor.

### Mudança em `src/pages/Founders.tsx` (linha 194)

Adicionar `max-w-[16rem] sm:max-w-md` para forçar o texto a ocupar menos largura no mobile, quebrando em mais linhas e preenchendo melhor a altura da tela:

```tsx
className="text-base sm:text-lg text-muted-foreground max-w-[16rem] sm:max-w-md mx-auto leading-relaxed"
```

Isso faz o parágrafo ficar visivelmente mais estreito que a linha "50% de desconto — para sempre." no mobile, replicando a proporção do desktop.

