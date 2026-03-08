

## Redesign: Página de Membros Fundadores

Recriar `src/pages/Founders.tsx` do zero com foco em elegância e conversão, sem vídeo.

### Estrutura da página (top → bottom)

1. **Urgency bar** — ticker animado simplificado, fundo preto (alinhado à identidade monocromática do projeto), texto branco com o número de vagas restantes.

2. **Hero section** — centrado, limpo:
   - Badge discreto no topo: "Membros Fundadores · Oferta limitada"
   - Headline grande e direto: "50% de desconto. Para sempre." — o "50%" em destaque com cor amber e marker highlight
   - Subheadline: uma linha explicando a proposta
   - CTA button pill com animação breathe (framer-motion scale) + texto secundário abaixo

3. **Social proof bar** — barra de progresso mostrando vagas preenchidas (X de 20), estilo minimalista

4. **O que está incluso** — lista vertical com checks (ícone ✓ amber), sem cards pesados — apenas texto limpo com boa tipografia

5. **Features** — 3 cards com ícone, título e descrição (mantém os atuais)

6. **FAQ** — accordion existente, sem mudança funcional

7. **CTA final** — repetição do botão antes do footer

8. **Footer** — copyright simples

### Decisões de design
- Remove toda a lógica de vídeo (states, refs, progress, handlePlay)
- Remove `REVEAL_AT_PERCENT`, `VIDEO_DURATION`, `intervalRef`, `handleRevealManual`
- Ticker com fundo `foreground` (preto) em vez de amber — mais premium
- Marker highlight usa `AMBER_BG` com opacidade suficiente (já em 0.35)
- Espaçamento generoso, max-w-2xl para texto, max-w-3xl para cards
- Animações sutis fade-in com stagger via framer-motion

### Arquivo alterado
- `src/pages/Founders.tsx` — reescrita completa

