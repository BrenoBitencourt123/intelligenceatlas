

## Análise de Design — Landing Page Fundadores

Analisei toda a página seção por seção. A estrutura geral é sólida: hierarquia clara, snap scrolling, seção dark para contraste, FAQ, e CTA repetido. Mas há oportunidades concretas para elevar a conversão e o polish visual.

---

### 1. Hero — Adicionar badge de urgência/escassez

**Problema:** O contador "X de 20 vagas preenchidas" está discreto demais abaixo do botão, em texto pequeno e cinza. É o maior gatilho de conversão da página mas compete visualmente com "Cancele quando quiser".

**Proposta:** Adicionar um badge/pill animado acima do eyebrow com um ponto pulsante (vermelho ou âmbar) + texto tipo `🔴 3 vagas restantes`. Isso cria urgência imediata antes mesmo de ler o headline.

```text
  ● 3 vagas restantes        ← badge pulsante, pequeno, acima do eyebrow
  
  INTELIGÊNCIA ATLAS
  LANÇAMENTO EXCLUSIVO
  
  Seja um dos 20
  Membros Fundadores
  ...
```

---

### 2. Hero — Separar "vagas preenchidas" de "Cancele quando quiser"

**Problema:** Duas informações com propósitos diferentes (urgência vs. segurança) estão na mesma linha, diluindo ambas.

**Proposta:** Colocar o progresso de vagas como uma mini barra de progresso compacta logo abaixo do botão, e "Cancele quando quiser" como texto separado abaixo. Isso dá peso visual à escassez.

---

### 3. Seção "Como funciona" — Adicionar linha conectora ou numeração mais visível

**Problema:** Os 3 pilares estão visualmente desconectados. No mobile (onde ficam empilhados), os números "01 02 03" são muito discretos e não comunicam progressão.

**Proposta:** No mobile, adicionar uma linha vertical sutil entre os cards (como um stepper) para comunicar que é um fluxo sequencial. No desktop está ok como grid.

---

### 4. Seção Dark "Por que ser fundador" — Destacar o primeiro benefício

**Problema:** Todos os 5 benefícios têm o mesmo peso visual. O primeiro ("50% de desconto — para sempre") é o mais forte e deveria se destacar.

**Proposta:** Renderizar o primeiro benefício com fonte maior e bold, ou como um card/badge separado antes da lista. Os outros 4 ficam como checklist normal.

---

### 5. CTA Final — Muito fraco para fechar a página

**Problema:** A última seção antes do footer tem headline pequena ("Pronto para estudar de forma inteligente?"), texto genérico, e o mesmo botão. Para uma landing de escassez, o fechamento deveria ser mais impactante.

**Proposta:** 
- Headline maior e mais direta: "Últimas vagas com 50% off"
- Re-exibir o badge de vagas restantes com a barra de progresso
- Adicionar um texto de reforço tipo "Depois das 20, o preço volta ao normal"

---

### 6. Footer — Adicionar links de confiança

**Problema:** O footer é só copyright. Para uma página de venda, faltam sinais de confiança.

**Proposta:** Adicionar links discretos: "Termos de uso" e "Política de privacidade" (mesmo que sejam placeholder). Isso aumenta a percepção de legitimidade.

---

### Resumo das mudanças

| # | Onde | O quê | Por quê |
|---|------|--------|---------|
| 1 | Hero topo | Badge pulsante "X vagas restantes" | Urgência imediata |
| 2 | Hero abaixo do CTA | Mini progress bar separada | Destaque à escassez |
| 3 | Como funciona (mobile) | Stepper vertical entre cards | Comunicar fluxo |
| 4 | Seção dark | Primeiro benefício destacado | Hierarquia de valor |
| 5 | CTA final | Headline forte + barra de vagas | Fechamento impactante |
| 6 | Footer | Links termos/privacidade | Confiança |

### Arquivos editados
- `src/pages/Founders.tsx` — todas as mudanças concentradas neste arquivo

