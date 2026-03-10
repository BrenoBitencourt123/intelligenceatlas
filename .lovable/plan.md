

## Plano: Corrigir texto cortado no header mobile da página Fundadores

### Problema
Na navbar sticky da página `/fundadores` (linha 138-139 de `Founders.tsx`), o texto de urgência "🔥 Apenas X vagas restantes — 50% off para sempre" é longo demais para telas pequenas e fica cortado pela classe `truncate`.

### Solução
Quebrar o texto em duas linhas no mobile ou usar uma versão mais curta:

**Em `src/pages/Founders.tsx`** (linhas 132-142):
- Remover a classe `truncate` do span de urgência
- Usar `text-[10px] sm:text-sm` para reduzir o tamanho no mobile
- Permitir que o texto quebre em duas linhas com `whitespace-normal` no mobile, mantendo `sm:whitespace-nowrap` no desktop
- Alternativamente, encurtar o texto no mobile para "🔥 {X} vagas · 50% off sempre" usando classes `hidden`/`sm:inline`

### Impacto
Apenas visual, somente mobile. Nenhuma outra página é afetada.

