

# Landing Page — Redesign Completo (Fundadores)

Redesign da página `/fundadores` seguindo o layout das imagens de referência, com foco nas 20 vagas limitadas e reveal progressivo.

## Estrutura

### 1. Hero (sempre visível)
- **Header**: Logo Atlas (ícone + nome) à esquerda, badge "🔥 20 vagas restantes" à direita (estilo amber/orange pill)
- **Badge animado**: "Apenas 20 vagas para membros fundadores" centralizado com ícone de fogo, fundo amber claro
- **Headline**: "Restam **20 vagas** para os primeiros membros fundadores do Atlas" — número em laranja/amber, centralizado, fonte grande
- **Sub-headline**: "Estude para o ENEM de forma inteligente com IA — e garanta **50% de desconto vitalício**"
- **Barra de urgência**: "Vagas preenchidas" à esquerda, "X/20 restantes" à direita em amber, com progress bar
- **Vídeo placeholder**: mantém mecânica atual (play → timer → reveal)

### 2. Seções Reveladas (após ~75% do vídeo OU botão "Saiba mais sobre o Atlas")
- **3 Feature cards**: Questões Objetivas, Redação com IA, Flashcards SRS — ícones + descrição curta
- **Seção de oferta fundador**: Card com borda amber, contador "X/20 vagas", preço R$49,90 → R$24,95/mês, lista de benefícios
- **CTA**: "Garantir minha vaga →" botão amber/laranja → navega para `/fundadores/cadastro`
- **Link secundário**: "Saiba mais sobre o Atlas ↓" (scroll ou reveal trigger alternativo)
- **FAQ**: Accordion com perguntas frequentes

### 3. Footer
- Copyright Intelligence Atlas

## Alterações técnicas

- **Constante estática**: `const VAGAS_RESTANTES = 20` — substitui chamada ao edge function `founders-slots` por agora (fácil trocar depois)
- **Cores**: Trocar verde `hsl(142,71%,45%)` para amber/laranja `hsl(25,95%,53%)` seguindo as imagens de referência
- **Componentes**: Tudo em `src/pages/Founders.tsx` por enquanto (página única, componentes inline). Podemos extrair para `src/components/landing/` depois se necessário
- **Reveal**: Mantém mecânica atual (timer de vídeo a 75%) + adiciona botão "Saiba mais" como trigger alternativo
- **Responsivo**: Mobile-first com Tailwind, layout centralizado `max-w-3xl`
- **Sem imagens externas**: Screenshots do app não serão embedadas (usar placeholders ou cards descritivos)

## Arquivo editado
- `src/pages/Founders.tsx` — reescrita completa

