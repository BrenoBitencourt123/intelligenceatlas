

## Plano: Redesign visual da tela de Questões Objetivas

A tela será refinada em todas as suas "views" (idle, active, result) seguindo a estética monocromática premium do projeto.

### Mudanças principais

**1. Tela Idle (Dashboard inicial)**
- Remover os 3 cards de blocos coloridos (Aquecimento/Aprendizado/Consolidação) — informação redundante que polui visualmente. Mover essa info para dentro da sessão ativa.
- Card principal de sessão: bordas mais sutis, sem `border-2`. Layout mais limpo com tipografia hierárquica.
- Stats do dia: redesenhar como uma barra horizontal compacta ao invés de 2 cards separados (ex: "12 questões · 78% acerto" em uma única linha).
- Flashcards: integrar como uma linha discreta abaixo do CTA principal, não como card separado.
- Resultado visual: menos cards empilhados, mais espaço negativo.

**2. Tela Active (Questão ativa)**
- Remover `BLOCK_COLORS` coloridos (azul/âmbar/verde) — usar tons monocromáticos consistentes com o design system.
- Stepper: simplificar para pontos/traços minimalistas ao invés de círculos coloridos numerados.
- Card da questão: remover borda extra, usar sombra sutil. Alternativas com hover mais elegante.
- Letra da alternativa: círculo mais refinado, tipografia menor.
- Botões de ação ("Não sei" / "Próxima"): estilo mais limpo, sem ícones desnecessários.

**3. Tela de Resultado**
- Score central: tipografia bold grande, sem card com borda dupla.
- Blocos de resultado: barras horizontais monocromáticas ao invés de cards coloridos.
- Layout mais centrado e com breathing room.

**4. Transição entre blocos**
- Remover backgrounds coloridos (`BLOCK_BG`). Usar design monocromático com check sutil.

### Arquivo modificado
- `src/pages/Objectives.tsx` — redesign completo do layout e estilos, mantendo toda a lógica intacta.

