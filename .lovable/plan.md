

## Plano: Redesign Visual da Página de Fundadores

### Objetivo
Melhorar o visual da landing page `/fundadores`, trazendo mais sofisticação e hierarquia visual, começando pelo headline com duas cores.

### Mudanças Propostas

#### 1. Headline com Duas Cores
**Antes:** Texto único monocromático  
**Depois:** 
- "Seja um dos 20" → `#111827` (preto escuro, destaque)
- "membros fundadores" → `#737373` (cinza médio, secundário)

```tsx
<motion.h1 className="text-[1.75rem] sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
  <span style={{ color: '#111827' }}>Seja um dos 20</span>
  <br />
  <span style={{ color: '#737373' }}>membros fundadores</span>
</motion.h1>
```

#### 2. Ajustes Adicionais de Hierarquia (Opcionais)
Posso também aplicar melhorias sutis em outras áreas se desejar:
- Aumentar o contraste do eyebrow badge
- Ajustar espaçamentos para respirar melhor
- Refinar a tipografia do subtítulo "50% de desconto"

### Arquivos a Editar
- `src/pages/Founders.tsx` — headline e possíveis ajustes de estilo

