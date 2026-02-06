
## Alinhar botões dos cards na Home (desktop)

### Problema
Os botões "Escrever redacao" e "Ver historico" nao estao na mesma linha vertical no desktop. O card da esquerda (Progresso Mensal) tem mais conteudo que o da direita (Suas Notas), e apesar do layout flex estar configurado, o `space-y-3` esta interferindo com o `mt-auto`, impedindo o alinhamento correto.

### Solucao
Remover o `space-y-3` do `CardContent` dos dois cards e aplicar `gap-3` no lugar (mais compativel com flexbox). Isso garante que o `mt-auto` funcione corretamente, empurrando os botoes para o fundo dos cards.

### Alteracoes

**1. `src/components/home/ProgressCard.tsx`**
- Trocar `space-y-3` por `gap-3` no CardContent para compatibilidade com flex layout

**2. `src/components/home/StatsCard.tsx`**
- Trocar `space-y-3` por `gap-3` no CardContent para compatibilidade com flex layout

### Detalhes tecnicos
O `space-y-3` do Tailwind usa seletores CSS adjacentes (`> * + *`) para adicionar `margin-top`. Quando combinado com `mt-auto` em um container flex, o margin do space-y pode sobrescrever o `mt-auto`. Usando `gap-3` no flex container, o espacamento e tratado pelo proprio flexbox, permitindo que `mt-auto` funcione sem conflito e empurre os botoes para a base dos cards.
