

## Análise Visual — Página Fundadores

Comparando as duas screenshots (desktop vs mobile), identifico estes pontos de melhoria:

### Problemas no Mobile (image-184)
1. **Espaço excessivo entre header e conteúdo** — o `items-start` com `pt-6` + `min-h-screen` cria um gap enorme no topo, empurrando o conteúdo para baixo
2. **Eyebrow ("INTELIGÊNCIA ATLAS · LANÇAMENTO EXCLUSIVO") sumindo** — não aparece na screenshot mobile, provavelmente cortada pelo espaçamento
3. **Título "Membros Fundadores" quebrando de forma estranha** — "20 Membros" numa linha e "Fundadores" sozinho na outra

### Correções Propostas

**1. Hero section — remover `min-h-screen` no mobile**
- Mobile: usar `min-h-[80vh]` ou simplesmente padding generoso sem forçar viewport inteiro
- Trocar para `min-h-[auto] sm:min-h-screen` com `pt-20 sm:pt-0` (compensar o navbar fixo)
- Voltar `items-center` em todos os tamanhos

**2. Título — melhorar quebra de linha no mobile**
- Usar `text-[1.75rem]` (28px) no mobile em vez de `text-3xl` (30px) para dar mais respiro
- Remover o `<br className="hidden sm:block" />` e deixar o texto fluir naturalmente
- Garantir que "Seja um dos 20 Membros Fundadores" quebre como "Seja um dos 20 / Membros Fundadores"

**3. Espaçamento vertical do hero**
```
className="flex items-center justify-center px-5 pt-20 pb-12 sm:min-h-screen sm:pt-0 sm:pb-0"
```
- No mobile: padding top de 20 (80px, compensa navbar) + padding bottom
- No desktop: mantém centralizado na viewport inteira

**4. Micro-ajustes de polish**
- Reduzir `space-y-6` para `space-y-5` no mobile para compactar
- CTA button: `h-12 px-8 text-base` no mobile (levemente menor)
- Texto "vagas preenchidas": manter `text-sm` mas adicionar `mt-1`

### Resultado Esperado
- Mobile: conteúdo logo abaixo do navbar, centralizado verticalmente no espaço disponível, sem gaps enormes
- Desktop: mantém o layout elegante atual com hero full-screen

