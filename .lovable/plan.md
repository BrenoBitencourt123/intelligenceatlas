
# Trilha unificada — "um botão, o dia inteiro"

## O problema hoje

Em `/hoje` a decisão do que estudar ainda vaza pro aluno: card de missão (fase da trilha), card do tema da semana (redação), card de flashcards vencidos, botão de revisar, etc. Isso viola a Lei Zero (§0 da ESPEC): decisões entre abrir o app e o 1º exercício devem ser **1** — apertar Começar. Hoje são 3–4.

O que o aluno quer: abrir o app, apertar **um botão**, e o sistema decidir a ordem — matéria do dia, degrau de redação, revisão SRS — como um jogo. Ele não escolhe o quê; escolhe só o quanto (meta já definida no onboarding).

## A ideia central

A "Trilha do dia" deixa de ser uma lista de fases separadas e vira **uma fila única de itens**, composta no momento em que o aluno aperta Começar. A fila mistura, na ordem certa, tudo que hoje aparece em cards separados:

1. **Aquecimento (60–90s)** — 2–3 flashcards vencidos do SRS (teto 5, resto o SRS reagenda em silêncio). Vitória rápida antes de qualquer coisa difícil.
2. **Núcleo (8–12 min)** — itens da matéria do dia (`useStudySchedule` já decide qual: mat/ling/nat/hum ou mista) intercalados com degraus da fase de redação da semana. Regras:
   - Se hoje é **dia de redação do aluno** (`profiles.dia_redacao`): a fila é dominada pelos degraus de redação e termina no "chefe" (proposta da semana). O núcleo de matéria fica curto (2–3 itens só, pra não atropelar o chefe).
   - Nos outros dias: alterna ~4 itens de matéria + ~2 degraus de redação da semana (critério mais fraco primeiro, usando o último `analyze-essay-ufu`).
   - Reescrita agendada (`reescritas_agendadas` vencendo hoje) entra como 1 item obrigatório antes do fecho.
3. **Fecho (1 item + celebração)** — 1 desafio final (o item mais difícil da matéria do dia OU o cume da fase de redação se for dia de redação) → tela de resultado unificada (a que a cascata pós-sessão já mostra: acertos, degraus, tempo, streak, semana).

Um botão só na home: **"Começar o dia · ~15 min"**. Nada mais é acionável na tela principal.

## O que muda na tela `/hoje`

Fica uma tela quase vazia, no espírito Duolingo:

```text
┌─────────────────────────────────┐
│  Placar compacto  ·  🔥 streak  │  ← já existe
├─────────────────────────────────┤
│                                 │
│    Missão de hoje · ~15 min     │
│                                 │
│      [ COMEÇAR O DIA ]          │  ← ÚNICO botão
│                                 │
│    "hoje: matemática + tema     │
│     da semana + 3 revisões"     │  ← 1 linha de preview honesto
│                                 │
├─────────────────────────────────┤
│  Trilha (mapa vertical)         │  ← visual, informativo, não é CTA
│  ● fase dourada                 │
│  ◉ fase atual (pulsa)           │
│  ○ próxima                      │
└─────────────────────────────────┘
```

Some da tela: card separado de "Tema da semana", card separado de flashcards, botões de revisar, "abrir redação" etc. Tudo isso continua existindo por trás — só deixa de ser decisão do aluno. Rotas antigas (`/flashcards`, `/redacao-ufu`, `/objetivas`) continuam acessíveis via Perfil > "mais ferramentas" pra quem quer o modo livre.

## O compositor da fila (o coração do plano)

Nova função pura em `src/lib/ufu/composerDia.ts`:

```ts
composeDailySession({
  user, hoje, dia_redacao, schedule, srsDue, temaSemana,
  fasesRedacao, ultimaCorrecao, reescritasVencidas
}) → Item[]
```

Regras de composição (v0, sem edge function nova):

- **Aquecimento:** pega até 3 flashcards de `flashcards` com `next_review_at <= now()` do usuário (usa `useFlashcardReview` já existente). Se não há → pula direto pro núcleo.
- **Núcleo (dia comum):** 4 itens de `questions` filtradas pela `area` do dia (`useStudySchedule`), priorizando tópicos com `priority_score` alto em `user_topic_profile` (adaptiveStudy já calcula). Intercala 2 degraus da **fase de redação da semana ativa** (nó atual em `trilha_nos` do aluno), rankeados pelo `criterio` mais fraco na `ultimaCorrecao` (nota/max mais baixa).
- **Núcleo (dia de redação):** só 2 itens de matéria (leves) + todos os degraus não-completos da fase da semana + o chefe (proposta da `temas_semana`).
- **Reescrita vencendo:** se `reescritas_agendadas` tem linha com `data_agendada <= hoje` e `status='pendente'`, injeta como item obrigatório imediatamente antes do fecho.
- **Fecho:** 1 item — o mais difícil da matéria (`difficulty=3` ou maior `priority_score`) OU o chefe da redação se for dia de redação.
- **Teto de tempo:** compositor para de adicionar quando estimativa ≥ `daily_minutes_target` (30s/flashcard, 90s/questão, 60s/degrau). Meta do onboarding manda.

Fila retornada é a mesma estrutura `Item[]` que `TrilhaNo.tsx` já consome — reaproveita 100% o player, o wrap, a coroação e a StreakScreen da cascata que já foi construída.

## O player unificado

`/trilha/dia` (rota nova) — usa exatamente o motor de `TrilhaNo.tsx`, mas recebendo a fila do compositor em vez de itens de um único nó. Diferenças mínimas:

- Header troca "Os 7 gêneros zero" pelo rótulo curto do dia: "Matemática · Redação · Revisão".
- Ao terminar, dispara os efeitos que hoje moram no fim do nó: registra `trilha_respostas`, atualiza `user_topic_profile`/SRS, e — se a fila incluía degraus de uma fase — atualiza `trilha_progresso` da fase quando ela fecha. A cerimônia de coroação só dispara se a fase de fato dourou nesta sessão (regra que já existe).
- Cascata final: wrap → (coroação se dourou) → resultado → streak/semana → volta pra `/hoje`.

## Mapa de arquivos

**Novos:**
- `src/lib/ufu/composerDia.ts` — a função pura descrita acima + testes unitários (`__tests__/composerDia.test.ts` cobrindo dia comum, dia de redação, reescrita vencida, meta curta/longa).
- `src/pages/TrilhaDia.tsx` — rota `/trilha/dia`. Busca dependências em paralelo, chama o compositor, renderiza o player.
- `src/components/ufu/DailyMissionCard.tsx` — o card único de "Começar o dia" com a 1 linha de preview.

**Editados:**
- `src/pages/Today.tsx` — remove os cards separados (tema da semana, flashcards vencidos, missão de fase). Fica: placar + `DailyMissionCard` + trilha visual. Botão do card leva a `/trilha/dia`.
- `src/App.tsx` — registra `/trilha/dia`.
- `src/pages/TrilhaNo.tsx` — extrai o motor do player pra um componente reutilizável `PlayerFila` (`src/components/ufu/PlayerFila.tsx`) que ambas as rotas consomem, sem mudar a experiência da fase.

**Sem migração de banco** neste passo — tudo compõe a partir de tabelas que já existem (`questions`, `flashcards`, `trilha_nos`, `trilha_progresso`, `temas_semana`, `reescritas_agendadas`, `user_topic_profile`, `essays`, `profiles.dia_redacao`, `user_preferences.daily_*`).

## O que fica pra depois (não neste plano)

- Ajuste fino do compositor por dados reais (ratio matéria/redação, teto de flashcards).
- "Modo livre" via Perfil > mais ferramentas (as rotas já existem, só falta o menu).
- Push de "sua trilha do dia te espera" apontando pra `/trilha/dia`.
- Instrumentação: registrar em `ufu_events` a composição da fila (`trilha_dia_start` com breakdown) pra medir mix real vs. desejado.

## Verificação antes de dar por pronto

1. Terça-feira, aluno com `dia_redacao=6` (sábado): abrir `/hoje`, apertar Começar → fila = 2 flashcards + 4 mat + 2 degraus redação + 1 desafio de mat. Preview honesto ("hoje: matemática + tema da semana + 2 revisões").
2. Sábado, mesmo aluno: fila = 2 flashcards + 2 mat + todos os degraus da fase da semana + chefe. Ao terminar o chefe, dourar a fase → coroação dispara.
3. Aluno com `reescritas_agendadas` vencendo hoje: item de reescrita aparece exatamente antes do fecho, não pode ser pulado.
4. `/hoje` tem 0 outros botões acionáveis além do "Começar o dia" e do menu inferior.
