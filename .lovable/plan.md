# Simulado por ano e dia (Pro)

Implementar a feature de Simulado completo no Atlas: o usuário Pro escolhe um ano e o dia da prova (Dia 1 ou Dia 2) e responde as 90 questões originais na ordem oficial, com pausa/retomada e resultado por área. Para usuários Free, a tela de seleção fica visível mas com botões bloqueados e CTA para upgrade.

O fluxo de estudo diário (20 questões adaptativas) e as sessões extras Pro continuam intactos — o simulado é uma sessão paralela e independente.

## 1. Banco de dados

### Migration: adicionar `day` à tabela `questions`
- `day SMALLINT NULL` (1 ou 2), com CHECK `day IN (1,2)` quando presente.
- Backfill heurístico baseado em `area`:
  - `linguagens`, `humanas` → `day = 1`
  - `natureza`, `matematica` → `day = 2`
- Índice composto `(year, day, number)` para acelerar a query do simulado.
- Nullable (não obrigatório) — questões sem `day` simplesmente não aparecem em simulados.

Hoje só existem questões de 2020 no banco; o backfill cobre todas elas e a feature passa a ficar disponível para esse ano imediatamente.

## 2. Tela de seleção do simulado

Nova rota `/simulado` com:
- Header curto: "Simulado ENEM — escolha ano e dia".
- Grade de cards por ano (descendente). Cada card mostra:
  - Ano em destaque.
  - Dois botões: **Dia 1** (Linguagens + Humanas) e **Dia 2** (Natureza + Matemática).
  - Total de questões disponíveis abaixo de cada botão (ex.: `90/90` ou `54/90`).
  - Botão fica desabilitado se houver menos de 80 questões para aquele `(year, day)` (limiar permite tolerância a faltantes pontuais).
- Para usuários Free: todos os botões aparecem com cadeado, e clique abre o upsell Pro existente (mesmo padrão da sessão extra).

A lista de anos vem de uma única query agregada `SELECT year, day, count(*) FROM questions GROUP BY year, day` — nada hardcoded.

## 3. Pontos de entrada
- **Aba Objetivas**: card "Simulado ENEM" no topo da tela inicial, ao lado/abaixo do CTA diário, navega para `/simulado`.
- **Tela Hoje**: substituir o card atual "Prova Mista" (que aparece aos sábados via `dayPlan.isMista`) por um card "Simulado ENEM" que leva para `/simulado` em vez de `/objetivas`. O agendamento semanal de sábado continua marcando o dia como simulado, mas o usuário escolhe qual prova fazer.

## 4. Sessão de simulado

Fluxo independente do estudo diário e da sessão extra:
- Carrega questões com `WHERE year=? AND day=? ORDER BY number ASC` (até 90).
- Sem fases Aquecimento/Aprendizado/Consolidação, sem blocos, sem transições.
- Header simples: contador `47/90` + botão "Pausar".
- Reaproveita o `EnemQuestionCard` e o componente "Antes de responder, saiba isso" (`PreConceptBlock`) — o diferencial pedagógico continua disponível.
- Persistência local em `localStorage` com chave `atlas_simulado_session` separada (não colide com a sessão diária nem com a extra). Salva: `year`, `day`, `questionIds`, `currentIndex`, `answers`, `startTime`.
- "Pausar" volta para a tela de seleção; ao reabrir o mesmo ano/dia aparece "Continuar simulado" com o progresso salvo, ou "Recomeçar".
- Filtro de língua estrangeira aplicado igual ao restante do app (respeita `user_preferences.foreign_language`).

## 5. Persistência das respostas e métricas
- Cada resposta vai para `question_attempts` com uma nova flag `simulado_session = true` (ou reaproveitando `extra_session = true`, opção a definir abaixo).
- `study_sessions` recebe um registro com `is_extra = true` e `area = 'simulado'` para não poluir as estatísticas diárias / streak.
- Atualiza `user_topic_profile` e `user_mastery` normalmente — o Mapa de Pontos Fracos é alimentado pelo simulado.

> Recomendação: criar coluna dedicada `simulado_session boolean default false` em `question_attempts` (e expor por filtro) para diferenciar simulado de sessão extra na análise futura. Confirmar essa decisão antes de aplicar a migration.

## 6. Tela de resultado
- Exibida ao concluir as 90 questões (ou ao "Encerrar" antecipadamente).
- Resumo:
  - Acertos totais e percentual (ex.: `72/90 — 80%`).
  - Breakdown por área conforme o dia:
    - **Dia 1**: Linguagens (X/45) e Humanas (Y/45).
    - **Dia 2**: Natureza (X/45) e Matemática (Y/45).
  - Tempo total da sessão.
- Ações: "Revisar questões erradas" (lista de questões erradas com gabarito), "Voltar para o simulado" (`/simulado`), "Ir para o Mapa de Pontos Fracos".

## 7. Restrições e gating
- Toda a rota `/simulado` e a sessão são bloqueadas para Free no nível da ação (não apenas visual): clique nos botões abre o modal de upsell.
- O fluxo de estudo diário (20 questões adaptativas) permanece exatamente como está. Sessão extra (Prompt 1) também não é afetada.

## Detalhes técnicos

### Arquivos novos
- `supabase/migrations/<timestamp>_add_day_to_questions.sql` — coluna `day`, CHECK, índice e backfill.
- `src/pages/Simulado.tsx` — tela de seleção (grade ano × dia) + roteamento para a sessão.
- `src/pages/SimuladoSession.tsx` — tela da sessão (90 questões, contador, pause/resume, resultado).
- `src/hooks/useSimuladoSession.ts` — hook dedicado: `start(year, day)`, `resume(year, day)`, `answer`, `next`, `pause`, `finish`, persistência em `atlas_simulado_session`, integração com `question_attempts` / `study_sessions` / `user_topic_profile`.
- `src/hooks/useSimuladoAvailability.ts` — query agregada `(year, day) → count` para popular a grade.

### Arquivos editados
- `src/App.tsx` — registrar rotas `/simulado` e `/simulado/sessao`.
- `src/pages/Today.tsx` — substituir o card "Prova Mista" pelo card "Simulado ENEM" navegando para `/simulado`.
- `src/pages/Objectives.tsx` — adicionar entrada "Simulado ENEM" no topo (visível sempre, com cadeado para Free).
- `src/integrations/supabase/types.ts` — regenerado automaticamente após a migration.

### Pontos não alterados
- `useStudySession.ts`, `useStudyStats.ts`, `useFreemiumUsage.ts` continuam ignorando registros com `is_extra=true` / `simulado_session=true`, então o simulado não interfere em métricas diárias nem na streak.
- Cronograma semanal (`useStudySchedule`) e regras de `mista` permanecem; só o card visível na Hoje muda de destino.

## Riscos e mitigações
- **Backfill heurístico do `day`**: a regra por área cobre 100% do ENEM moderno (a partir de 2009). Para anos atípicos, o admin poderá corrigir manualmente via Admin > Reclassificar.
- **Anos com poucas questões**: gating por contagem mínima (80) evita simulados quebrados.
- **Conflito de localStorage**: chave dedicada (`atlas_simulado_session`) garante isolamento.

Confirme se prefere uma flag dedicada `simulado_session` em `question_attempts` (recomendado) ou reaproveitar `extra_session = true` para o simulado também.
