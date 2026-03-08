

## Plano: Dar destaque ao header e melhorar headline

### O que muda

**1. Header/ticker maior e mais impactante**
- Aumentar o padding vertical do ticker de `py-3` para `py-4`
- Aumentar o tamanho do texto de `text-sm` para `text-base`
- Adicionar um label fixo "VAGAS RESTANTES" no canto esquerdo com fundo escuro (como na referência)

**2. Headline com destaque visual nas vagas**
- Adicionar um fundo highlight (âmbar com opacidade) atrás do número de vagas, tipo marcador de texto, para dar destaque visual como na imagem de referência
- Ajustar o padding do hero de `py-10` para `py-12` e reduzir o `space-y-8` para `space-y-6` para encaixar melhor na tela

### Arquivo editado
- `src/pages/Founders.tsx` — apenas ajustes de classes CSS e um wrapper `<span>` com estilo de highlight

