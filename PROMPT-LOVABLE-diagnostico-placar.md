# Prompt para Lovable — /placar: diagnóstico de 10 questões (a nova porta de entrada)

Cole DEPOIS dos 4 prompts anteriores estarem no ar e funcionando.

Contexto de negócio: a calculadora pergunta "quantos acertos você teria?" —
mas a maioria dos alunos NÃO SABE esse número. O /placar gera o número pra
ele: 10 questões reais da UFU, sem cadastro, e no final "seu placar" com a
zona (abaixo do corte / perigosa / folga) pro curso dele. É o momento-uau
do funil e o nome do produto acontecendo na tela.

## 1. Rota e dados

- Rota nova PÚBLICA (sem login): `/placar`, aceita `?curso=<slug-pseo>`.
- ⚠ A tabela `questions` tem RLS "authenticated only" e NÃO deve ser aberta
  pra anon (exporia o gabarito e o banco inteiro — nosso fosso — a scraping).
  Servir o quiz por **edge function pública**, com o gabarito no servidor:
  - `placar-quiz` (GET, sem auth): client service-role busca as questões do
    kit (`exam='ufu'`, `year=2026`, `number in PLACAR_QUESTOES`) e retorna
    enunciado/alternativas/imagens **SEM correct_answer**. Cache em memória.
  - `placar-grade` (POST, sem auth): recebe `{ respostas: {number: letra} }`,
    compara com o gabarito no servidor e retorna acertos + gabarito por
    questão (aí sim pode revelar, o quiz acabou).
  - Kit fixo em constante da function:
    `const PLACAR_QUESTOES = [3, 8, 14, 22, 30, 38, 45, 52, 58, 63]; // PLACEHOLDER — Cowork cura depois`
- Renderizar com o QuestionContent/renderMath existente (notação matemática
  funciona).
- Curso: se veio `?curso=`, mapear pro CURSOS_UFU (mesma derivação de slug
  do card da calculadora — helper slugCursoUfu já existe). Se não veio,
  primeira tela = select de curso (igual ao da calculadora).

## 2. Fluxo de telas

**Tela 1 — abertura (se sem curso: select primeiro):**
- Título: "Descubra seu placar pra {curso}"
- Sub: "10 questões reais da prova da UFU. 5 minutos. No final: sua zona —
  e a distância real até a vaga."
- Botão: "Começar" → `trackUfu('calc_completed', { evento: 'placar_inicio', curso })`

**Tela 2 — as questões (uma por vez):**
- Progresso "3/10" no topo + cronômetro discreto correndo (não bloqueia).
- Alternativas A-E, avança ao selecionar. Sem feedback por questão
  (mantém ritmo e suspense). Guardar respostas em estado local.

**Tela 3 — resultado (a tela mais importante do produto):**
- "Seu placar: {acertos}/10" grande.
- Projeção honesta: `projecao = Math.round(acertos/10 * 65)` com faixa:
  "Nesse ritmo, algo como {projecao-3}–{projecao+3} acertos na prova de 65."
- Zona vs curso (usar corte AC e meta = ceil(corte*1.22) do CURSOS_UFU):
  três estados visuais iguais aos da calculadora (abaixo / perigosa / folga),
  com o texto da zona perigosa sempre nomeando o vilão: "passaria na 1ª fase
  e provavelmente perderia a vaga".
- Gabarito expandível: lista das 10 com ✓/✗ e a resposta correta (sem
  explicação longa na v1).
- Card compartilhável: reusar o gerador de card da calculadora com
  "Meu placar: X/10 · {curso}" → tracking share já existente.
- `trackUfu('calc_completed', { evento: 'placar_fim', curso, acertos })`

**CTA primário (um só):** "Receber meu plano de saída da zona {zona}" →
`/ufu/lista?curso={slug}&origem=placar`.
**CTA secundário discreto:** "Corrigir minha redação grátis" → `/redacao-ufu`.

## 3. Integrações com o que já existe

- `/ufu/lista`: já aceita `origem` — vai receber `origem=placar`.
- Nas páginas pSEO estáticas o Cowork vai trocar o CTA da mini-calculadora
  por "Descobrir meu placar em 10 questões" (não fazer nada na Lovable).
- Landing: adicionar o /placar como CTA hero no lugar da calculadora
  (calculadora vira link secundário "já sei meus acertos").

## 4. Verificação

1. `/placar?curso=medicina-integral-uberlandia` roda as 10 questões e mostra
   zona correta pra Medicina (corte 57, meta 70).
2. Sem `?curso`: select aparece antes.
3. Notação matemática renderiza nas questões do kit.
4. CTA leva pra lista com `origem=placar`; evento aparece em ufu_events.
5. Mobile: alternativa clicável com dedão, sem zoom horizontal.

## Fora deste prompt (Cowork faz depois)
- Curadoria final das 10 questões (equilíbrio de área e dificuldade).
- Kits por perfil de peso (bio/exatas/humanas) na v2.
- Explicação pedagógica por questão no gabarito (motor generate-pedagogy) na v2.
