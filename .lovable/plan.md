

## Landing Page — Inteligência Atlas (Membros Fundadores)

Reescrita completa de `src/pages/Founders.tsx` do zero, sem nenhum viés das versões anteriores. Abordagem: página de lançamento limpa, focada em conversão, que conta uma história — o que é o Atlas, por que ele existe, e por que as 20 primeiras vagas são especiais.

### Estrutura (top → bottom)

1. **Navbar fixa** — Logo "Atlas" à esquerda, botão "Garantir vaga" à direita (sticky, aparece após scroll). Simples, sem menu.

2. **Hero** — Tela cheia (min-h-screen), centrado verticalmente:
   - Headline principal: **"Estude para o ENEM com inteligência"** — direto, sem firula
   - Subheadline: Uma frase curta explicando a proposta (sistema que adapta o estudo às suas fraquezas)
   - Badge discreto: "20 vagas · 50% off vitalício"
   - CTA principal grande
   - Abaixo do CTA: indicador de vagas restantes (texto simples, ex: "7 de 20 vagas preenchidas")

3. **Como funciona** — 3 blocos lado a lado (stack no mobile):
   - Questões Objetivas inteligentes (ícone + título + 1 frase)
   - Redação com IA (ícone + título + 1 frase)
   - Flashcards espaçados (ícone + título + 1 frase)
   - Cada bloco com número (01, 02, 03) para dar ordem visual

4. **Por que ser fundador** — Seção com fundo escuro (foreground/card invertido) para quebrar o ritmo visual:
   - Headline: "Por que ser um dos 20?"
   - Lista de benefícios com checks
   - Barra de progresso de vagas (visual forte aqui)

5. **FAQ** — Accordion limpo, mesmas perguntas

6. **CTA final** — Repetição do CTA com urgência suave

7. **Footer** — Copyright

### Decisões de design
- **Sem ticker animado** — cansa visualmente e parece spam; a urgência vem do contador de vagas integrado no hero e na seção de fundadores
- **Sem amber como cor dominante** — usar a paleta monocromática do projeto (preto/branco) como base; amber apenas como accent pontual (badges, checks, barra de progresso)
- **Animações mínimas** — fade-in suave no scroll (framer-motion `whileInView`), sem breathing/pulsing
- **Tipografia como protagonista** — hierarquia clara com tamanhos grandes no hero, médios nos títulos de seção
- **Seção escura** para criar contraste e dar destaque à proposta de valor dos fundadores
- **Navbar sticky com CTA** — garante que o botão de conversão está sempre acessível

### Arquivo
- `src/pages/Founders.tsx` — reescrita completa

