

## Plano: Ajustar seção "Como o Atlas funciona" para caber na tela mobile

### Problema
A seção usa `min-h-screen` com `py-20` e os 3 cards empilhados verticalmente no mobile ocupam mais espaço que a viewport, fazendo o conteúdo ultrapassar a tela.

### Mudanças em `src/pages/Founders.tsx`

1. **Reduzir padding vertical no mobile**: `py-20` → `py-10 sm:py-28`
2. **Reduzir margin do título**: `mb-14` → `mb-8 sm:mb-14`
3. **Compactar gap entre cards no mobile**: `gap-8 sm:gap-6` → `gap-5 sm:gap-6`
4. **Reduzir espaçamento interno dos cards**: `space-y-4` → `space-y-2 sm:space-y-4`
5. **Reduzir tamanho do ícone container no mobile**: `w-11 h-11` → `w-9 h-9 sm:w-11 sm:h-11`

Isso compacta o conteúdo o suficiente para caber numa viewport mobile sem scroll dentro da seção.

