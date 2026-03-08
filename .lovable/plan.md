
## Ajuste de hierarquia no Hero — Founders.tsx

### O problema
O hero atual prioriza o produto ("Estude para o ENEM com inteligência") e relega o conceito de membros fundadores a um badge pequeno em texto muted. Quem chega na página sem contexto não entende imediatamente que está diante de uma oportunidade exclusiva com 20 vagas.

### A correção (só o hero, sem redesign completo)

Inverter a hierarquia de informação:

**Antes:**
- Badge: "20 vagas · 50% off vitalício" (pequeno, muted)
- H1: "Estude para o ENEM com inteligência" (protagonista)
- Sub: explicação do produto

**Depois:**
- Eyebrow label: "Inteligência Atlas · Lançamento exclusivo" (contexto, sem badge arredondado — texto simples com letra pequena e espaçamento)
- H1: **"Seja um dos 20 Membros Fundadores"** — esse passa a ser o protagonista
- Sub imediato (grande, bold, destaque): "50% de desconto — para sempre." — a oferta em evidência
- Parágrafo explicativo: "Um sistema que adapta o estudo às suas fraquezas — questões, redação e revisão, tudo com IA."
- CTA + contador de vagas (sem mudança)

### Por que funciona melhor
- Em 2 segundos o visitante entende: "há 20 vagas exclusivas" e "50% para sempre" — os dois ganchos mais fortes
- O produto entra como razão de querer a vaga, não como elemento principal
- Eyebrow como texto simples (sem borda/card) é mais limpo e premium que um badge

### Arquivo
- `src/pages/Founders.tsx` — apenas a seção hero (linhas ~150–218), resto permanece igual
