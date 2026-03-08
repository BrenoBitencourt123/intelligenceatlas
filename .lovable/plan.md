

## Plano: Redesign Premium da Página Home

A home atual tem muitos cards empilhados com bordas visíveis e cores variadas. O redesign vai criar uma experiência mais sofisticada, com hierarquia visual clara e estética monocromática premium.

### Mudanças em `src/pages/Today.tsx`

**1. Header — Saudação personalizada**
- Substituir "Hoje - Segunda-feira" por uma saudação contextual: "Bom dia" / "Boa tarde" / "Boa noite" com tipografia grande e bold
- Dia da semana e área do dia como subtítulo discreto em muted-foreground
- Remover redundância com `schedule.label`

**2. Stats — Barra horizontal inline**
- Substituir os 3 cards separados (Streak, Questões, Acerto) por uma única linha horizontal sem card wrapper
- Formato: `🔥 3 dias · 12 questões · 78%` — separados por `·`, tipografia discreta
- Sem bordas, sem cards, sem ícones grandes — apenas dados em linha

**3. Card principal de estudo (Objetivas)**
- Remover `border-2 border-primary/20` — usar apenas sombra sutil
- Layout mais limpo: área do dia como label discreto, nome da área em tipografia grande
- Botão full-width com estilo clean
- Welcome card (primeira sessão) simplificado sem borda colorida

**4. Card de Redação**
- Integrar tema do dia de forma mais elegante — tipografia com aspas estilizadas
- Progress bar mais fina e discreta
- Remover ícone `PenLine` do header — usar apenas tipografia

**5. Flashcards**
- Transformar de card separado em uma linha simples dentro do fluxo, sem card wrapper
- Formato: texto + botão inline, como um item de lista discreto

**6. Card de diagnóstico**
- Simplificar para uma barra com progress inline, sem card pesado

**7. Geral**
- Mais espaço negativo (padding/gap maiores)
- Bordas removidas ou `border-border/50` (mais sutis)
- Tipografia hierárquica: h1 grande, subtextos em muted
- Cards com `shadow-sm` ao invés de bordas duplas

### Arquivo modificado
- `src/pages/Today.tsx` — redesign completo do layout e estilos, mantendo toda a lógica intacta

