# Plano do pivô: Atlas (ENEM) → produto UFU

> Estratégia: substituição por fases, não big-bang. Cada fase deixa o app
> funcionando e testável. ENEM não ganha feature nova a partir de agora;
> código ENEM só é apagado quando o equivalente UFU estiver no lugar.
> Estado atual: /ufu (calculadora) e /redacao-ufu (corretor) prontos, mas
> fora da navegação — ilhas de propósito. Este plano as torna o centro.

## Fase 1 — Trocar a casca (o app "vira" UFU por fora)

Objetivo: usuário que entra no app só vê UFU. 1-2 sessões de trabalho.

1. **Landing nova** (`/`): headline UFU, calculadora como isca principal
   (link ou embed), CTA de cadastro. Landing ENEM atual morre.
2. **Navegação** (BottomNav/TopNav): Hoje · Questões · Redação (→ RedacaoUfu)
   · Perfil. Tirar da nav o que é ENEM-only (simulado 90 questões, tema do
   dia ENEM). `/redacao` (ENEM) → redirect pra `/redacao-ufu`.
3. **Onboarding**: substituir metas ENEM por UMA pergunta central — curso-alvo
   UFU (+ cota). Migration: `profiles.curso_ufu text`, `profiles.cota_ufu text`.
   Esse dado alimenta pesos, trilha e copy do app inteiro.
4. **Textos/branding**: varrer "ENEM" da UI logada. Nome segue provisório
   ("Placar UFU") até decisão de domínio.

Critério de pronto: fluxo cadastro → onboarding → hoje sem nenhuma menção a ENEM.

## Fase 2 — Trocar o miolo de dados (o fosso)

Objetivo: questões, taxonomia e conteúdo pedagógico UFU. É a fase mais longa.

1. **Coluna `exam` na tabela questions** (`default 'enem'`) — permite ingerir
   UFU sem apagar ENEM ainda; todo hook de estudo filtra `exam='ufu'`.
2. **Taxonomia UFU**: escrever a partir do Conteúdo Programático oficial da
   DIRPS (PDF já mapeado no portal). Substituir `src/taxonomy/taxonomy.ts`
   e o espelho embutido em `classify-question`.
3. **Teste de extração** (valida a última premissa do briefing): 1 prova
   antiga da DIRPS no `/importar` → conferir fidelidade → ingerir 2 provas
   completas com gabarito.
4. **Etiquetagem**: `pre-classify-batch` + revisão manual das primeiras 200.
   Nasce a view `frequencia_topicos` ("X% da prova é tal tópico" — insumo
   de conteúdo/Reels).
5. **Motor pedagógico**: prompt do `generate-pedagogy` reescrito pra banca
   DIRPS (cache continua igual).

Critério de pronto: responder 10 questões UFU no app com primer + explicação.

## Fase 3 — Trilha por curso (o produto do passe)

1. `useDayBlocks`/priorização considerando **pesos do curso** do perfil
   (Mecatrônica → Matemática peso 3 puxa mais blocos) × frequência do tópico
   × domínio do aluno (motor bayesiano existente permanece).
2. "Simulado" vira **prova completa UFU**: 65 questões, distribuição oficial
   (10 Port, 10 Mat, 5 das demais), 5h30 de timer.
3. Resultado do simulado alimenta a calculadora/card automaticamente
   (acertos por disciplina já saem prontos → share).
4. Breno estudando na trilha diariamente = QA + teste de retenção (3 semanas).

## Fase 4 — Limpeza e modelo de negócio

1. Apagar: `import-enem-api`, `daily_themes`/`generate-theme` (modelo ENEM),
   `Essay.tsx` e `analyze-essay`/`improve-essay` ENEM, flashcards se não
   entrarem na espinha, dados ENEM do banco (backup antes).
2. Quotas: redesenhar pra modelo UFU — grátis (1 correção de boas-vindas?),
   avulso, passe. Stripe: trocar assinatura por **pagamento único "passe até
   a prova"** (a pré-venda fundadora pode rodar 100% no Pix antes disso).
3. pSEO: páginas de corte por curso (dados já em `vestibular.ts`) + provas
   resolvidas. Deadline do briefing: indexando até set-out/2026.

## Regras durante o pivô

- O código ENEM que ainda funciona não é tocado até a fase que o substitui.
- Toda fase termina com o app utilizável (dogfood do Breno).
- Dados novos sempre com fonte oficial citada no código.
- Decisões de negócio pendentes que NÃO bloqueiam fases 1-3: nome/domínio,
  preço final, landing copy definitiva.
