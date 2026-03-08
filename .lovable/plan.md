

## Redesign da Landing Page /fundadores

A proposta é simplificar radicalmente a landing page, seguindo o layout limpo que você descreveu. A estrutura atual tem Hero + Vídeo + 2 cards separados. A nova versão será uma single-section mais direta e focada em conversão.

### Nova estrutura da página

```text
┌─────────────────────────────────┐
│  header: logo + botão "Entrar"  │
├─────────────────────────────────┤
│                                 │
│  🚀 Vagas limitadas (pill)      │
│                                 │
│  O jeito mais inteligente de    │
│  estudar para o ENEM.           │
│                                 │
│  Texto: Atlas analisa seu       │
│  desempenho... 900+ pontos.     │
│                                 │
│  Texto: Primeiros fundadores    │
│  recebem 50% vitalício.         │
│                                 │
│  [ Começar agora → ]            │
│                                 │
│  ✔ Questões reais do ENEM       │
│  ✔ Plano de estudo inteligente  │
│  ✔ Análise de desempenho        │
│                                 │
│  [imagem/mockup do dashboard]   │
│                                 │
├─────────────────────────────────┤
│  footer                        │
└─────────────────────────────────┘
```

### Mudanças técnicas em `src/pages/Founders.tsx`

1. **Remover** as seções `VideoSection`, `BenefitsSection`, e `FounderPerksSection`
2. **Reescrever o `HeroSection`** como seção única com:
   - Pill de "Vagas limitadas para membros fundadores" (usando o `SlotsCounter` existente ou uma versão simplificada com ícone de foguete)
   - Headline: "O jeito mais inteligente de estudar para o ENEM."
   - Parágrafo descritivo sobre o Atlas + 900+ pontos
   - Destaque do 50% vitalício para fundadores
   - Botão CTA "Começar agora" (abre o modal de lead)
   - 3 checkmarks inline (questões reais, plano inteligente, análise de desempenho)
   - Placeholder de imagem do dashboard (um card escuro com ícone, similar ao vídeo placeholder atual)
3. **Manter** header, footer, LeadModal, SuccessState, e useFounderSlots sem alteração
4. **Limpar** imports e constantes que não forem mais usadas (BENEFITS, FOUNDER_PERKS, etc.)

### Copy exata conforme seu wireframe

- Pill: "🚀 Vagas limitadas para membros fundadores"
- H1: "O jeito mais inteligente de estudar para o ENEM."
- P1: "O Atlas analisa seu desempenho nas próprias questões do ENEM e mostra exatamente o que estudar para alcançar 900+ pontos."
- P2: "Os primeiros membros fundadores recebem 50% de desconto vitalício."
- CTA: "Começar agora"
- Checks: Questões reais do ENEM / Plano de estudo inteligente / Análise de desempenho

