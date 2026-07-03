# Sistemas core - como funcionam hoje

## Sistema de objetivas

### Fluxo do aluno
1. **`/hoje`** mostra "Foco do dia" com 3 blocos (`useDayBlocks`) - cada bloco tem um topico curado e contagem de questoes. **Nao eh aleatorio.**
2. Sabado eh "Simulado" - 90 questoes na ordem oficial do ENEM.
3. Aluno clica "Comecar" -> `/objetivas`.
4. `useStudySession` carrega questoes baseado em `useStudySchedule` (que respeita o foco do dia).
5. Aluno responde, recebe feedback. Se `hasKnowledgeCapsules` (Pro), carrega `useQuestionPedagogy` com explicacao pedagogica.
6. Erros geram flashcard automatico se `hasAutoFlashcards` (Pro) - feature de retencao real.
7. Tentativas vao para `question_attempts`. `user_mastery` eh atualizado com smoothing bayesiano.
8. Sessao extra disponivel pra Pro (sem limite, nao conta meta diaria).

### Diagnostico
- Sistema entra em **modo diagnostico** ate o aluno atingir `diagnosticThreshold` de tentativas em uma area.
- Constroi `user_topic_profile` antes de personalizar plano.

### Cota free
- 10 questoes/dia (hardcoded em `useFreemiumUsage.FREE_DAILY_QUESTIONS`).
- Aluno free com area travada por cota ve modal `isAreaLocked`.

### Pipeline de classificacao
1. Questao entra (via `import-enem-api` ou `parse-exam-pdf` ou `/importar` manual).
2. `classify-question` (edge function) processa: define `disciplina`, `topics[]`, `skills[]`, `difficulty`, `cognitive_level`, `confidence`, `needs_review`, `classifier_version`, `classified_at`.
3. `pre-classify-batch` para batches grandes.
4. Admin pode usar `reclassify-questions` se precisar redefinir.

## Sistema de redacao

### Fluxo do aluno
1. **`/hoje`** mostra card de Redacao com tema (so para `hasThemeAccess` = Pro OU Free com cota disponivel).
2. Aluno clica "Escrever/Praticar Redacao" -> `/redacao`.
3. `Essay.tsx`:
   - `PedagogicalSection` mostra contexto, perguntas guia, fontes (se Pro), gate por plano (`LockedPedagogicalCard`).
   - **Tema sempre vazio no carregamento** (decisao explicita no codigo: "previne auto-fill confusao para usuarios fazendo multiplas redacoes"). Aluno digita manualmente.
   - 4 blocos default: introducao, dev1, dev2, conclusao (`BlockCard`).
   - Aluno pode adicionar/remover desenvolvimentos, colar texto e dividir automaticamente (`PasteDivideModal`).
4. Clica "Analisar redacao":
   - Se nao tem tema digitado, avisa e pede confirmacao.
   - Chama `analyze-essay` (edge function).
   - `analyze-essay` valida quota antes de chamar OpenAI.
   - GPT-4.1-mini avalia cada bloco + 5 competencias ENEM (notas em multiplos de 40, 0-200).
   - Resposta volta com `blockAnalyses` (summary, whyItMatters, checklist, textEvidence, howToImprove, strengths, cohesionTip, tags) e `competencies[]` + `totalScore` + `overallFeedback`.
   - Resultado eh **salvo na tabela `essays`** com `analyzed_at = now()`.
5. Apos analise, aluno pode gerar "Versao melhorada":
   - `improve-essay` recebe blocos + analises e reescreve.
   - Prompt instrui: corrigir problemas listados, manter ideias originais, mesmo numero de paragrafos.
   - Garantia explicita: proposta de intervencao tem 5 elementos (agente, acao, meio, finalidade, detalhamento).
6. `ResultPanel` (desktop) e `MobileResultsBar` (mobile) mostram pontuacao + analises.

### Tema diario
- `daily_themes` tem UNIQUE em `date` - so um tema por dia.
- `generate-theme`:
  - **APENAS admin pode chamar** (`has_role('admin')`).
  - Se ja existe tema pra data, retorna o existente.
  - Se nao, chama GPT-4.1-mini temperature 0.8.
  - Gera: title, motivating_text, context, guiding_questions (5), sources (3-5 com URL real, tipo: artigo/estatistica/legislacao/noticia).
  - Salva e retorna.
- `useDailyTheme` no front busca o tema da data atual.

### Cota redacao
- **Free**: 1/semana (rolling 7 dias). Primeira semana (criou conta < 7 dias atras) tem bonus de 2/semana.
- **Pro**: 60/mes (calendar month) + 2/dia (a menos que `flexible_quota = true`).
- Validacao acontece **no backend** em `analyze-essay`, antes de chamar a OpenAI.
- Banner de "Proxima correcao em 7 dias" / "Bonus de boas-vindas" aparece pos-analise para Free.

## Observacoes importantes

### Sobre objetivas
- O sistema **ja eh bem mais sofisticado do que parece** olhando so a UI:
  - Mastery bayesiano com smoothing
  - Plano diario adaptativo via `useDayBlocks`
  - Modo diagnostico antes de personalizar
  - SRS para flashcards
  - Capsulas pedagogicas como gating Pro
- A taxonomia canonica em codigo eh forte: 150 topicos com IDs estaveis, validacao centralizada.
- Existem **3 caminhos** de import (api enem.dev, parse-exam-pdf, manual via /importar). O workflow Python local de extracao manual eh quase totalmente redundante com isso.

### Sobre redacao
- Sistema bem desenhado mas com 2 escolhas suspeitas:
  1. **Tema sempre vazio no carregamento** - aluno tem que digitar manualmente. Justificativa no codigo eh evitar confusao, mas isso obriga o aluno a ter o tema do dia em outro lugar e copiar - friction alta. Tema do dia poderia auto-popular com botao "Mudar".
  2. **Cota free de 1 redacao por semana** - extremamente restritiva. Pra um sistema cuja proposta eh aluno treinar pra ENEM, 1 redacao/semana corrigida nao gera habito.
- Falta no fluxo atual:
  - **Aluno criar seu proprio tema** - nao existe interface pra isso. Tema vem de `daily_themes` (admin-only) ou aluno digita manualmente como string sem texto motivador/fontes/perguntas guia.
  - **Versao tema-livre** - usar `analyze-essay` com tema custom funciona, mas perde tudo que `PedagogicalSection` traz (contexto, perguntas guia, fontes).
- `generate-theme` so pode ser chamado por admin - aluno NUNCA gera tema novo, so consome o do dia.

### Gaps perceptiveis sem mudar codigo
- Free cota agressiva pode estar matando conversao por falta de habito (aluno some na 2a semana).
- Tema vazio por padrao no editor de redacao adiciona friction.
- Sem fluxo de "aluno cria tema proprio" - o pedido do Breno **nao tem suporte no Atlas hoje**.
- `analyze-essay` so funciona com 4 blocos predeterminados (intro + dev_1 + dev_2 + conclusion). Nao da pra analisar uma redacao de 3 paragrafos ou 5.
