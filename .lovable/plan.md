# Plano — Sessões extras de estudo (Pro)

## Comportamento

Após o aluno **Pro** terminar a sessão diária (tela de resultado em `Objectives`), aparece o botão **"Continuar estudando"**. Ao clicar, ele vê um seletor simples:

- **Geral** (todas as áreas)
- **Linguagens** · **Humanas** · **Natureza** · **Matemática**

Após escolher, entra em uma sessão extra:
- **Sem limite de questões** (fluxo sequencial infinito, carrega em batches)
- **Sem fases** (nenhum "Aquecimento/Aprendizado/Consolidação", sem stepper)
- Header simples: `12 · Sessão extra` (apenas o número da questão atual)
- "Antes de responder, saiba isso" (PreConcept) **continua disponível**, igual à sessão normal
- Justificativa, flashcards automáticos no erro e cápsulas pós-resposta funcionam igual
- Botão para **encerrar** a qualquer momento → mostra mini-resumo (questões respondidas, % acerto) e volta para `/objetivas`

Para **Free**, o card aparece **bloqueado** com cadeado e CTA "Plano PRO".

## Regra-chave: não contaminar métricas diárias

Sessão extra **não** afeta:
- Streak diária
- Contador "Hoje: X questões" / progresso do dia (`Progresso do dia`)
- Cota freemium (`questionsUsedToday`)
- `study_sessions` agregadas (ou marcamos como sessão extra)

Mas **continua afetando**:
- `user_topic_profile` / `user_mastery` (o aluno está estudando de verdade — adaptive precisa aprender)
- `user_question_history` (evita repetir questões já vistas)
- Geração de flashcards no erro
- Stats globais de longo prazo (ex.: total de questões resolvidas no histórico)

Para isso usamos um **flag `extra_session`** ao gravar `question_attempts`, e os hooks que contam questões do dia/cota passam a filtrar por `extra_session = false`.

## Mudanças técnicas

### Backend (migration)

Adicionar coluna em `question_attempts`:

```sql
ALTER TABLE public.question_attempts
  ADD COLUMN extra_session boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS question_attempts_user_session_extra_idx
  ON public.question_attempts (user_id, session_date, extra_session);
```

Adicionar coluna em `study_sessions` para distinguir sessões extras dos agregados normais:

```sql
ALTER TABLE public.study_sessions
  ADD COLUMN is_extra boolean NOT NULL DEFAULT false;
```

### Hook `useStudySession.ts`

- Novo modo `extraSession: boolean` no estado da sessão.
- Nova função pública `startExtraSession(area: string | null)`:
  - Busca lote inicial (~20 questões), filtrando questões já respondidas pelo usuário (`user_question_history`) para evitar repetição.
  - Marca `state = "active"` com `extraSession = true`, **sem** salvar `daily_plan` e usando uma chave de storage separada (`atlas_extra_session`) para não colidir com a sessão diária persistida.
- Nova função `loadMoreExtra()`: ao chegar na penúltima questão, pré-carrega mais 10–20 questões do mesmo escopo, filtrando duplicatas.
- `submitAnswer` passa a aceitar e propagar `extra_session: true` para o insert em `question_attempts`.
- `nextQuestion` em modo extra **não** finaliza por contagem (não há limite); a finalização acontece via novo `endExtraSession()` chamado pelo botão "Encerrar".
- Ao encerrar, gravar `study_sessions` com `is_extra = true`.
- `syncTopicProfile` continua sendo chamado normalmente (queremos aprendizado adaptativo).

### Hooks de métricas — filtrar `extra_session = false`

- `useStudyStats`: `question_attempts` query → `.eq('extra_session', false)`. Streak via `study_sessions` → `.eq('is_extra', false)`.
- `useFreemiumUsage`: `question_attempts` count → `.eq('extra_session', false)`.

### UI — `src/pages/Objectives.tsx`

**1. Tela de resultado (`state === 'result'`)** — adicionar abaixo do botão "Voltar ao Início":

- Se `isPro`: botão **"Continuar estudando"** que muda uma flag local `pickerOpen = true`.
- Se `isFree`: card pequeno bloqueado "Continuar estudando é um recurso PRO" com CTA "Ver plano".

**2. Tela de seleção de modo (novo state local `extraPickerOpen`)** — substitui temporariamente a tela de resultado:

```text
Continuar estudando
Escolha o modo da próxima sessão.

[ Geral · todas as áreas        > ]
[ Linguagens                    > ]
[ Humanas                       > ]
[ Natureza                      > ]
[ Matemática                    > ]

Voltar
```

Cada item chama `startExtraSession(area)`.

**3. Tela ativa em modo extra**: condicional sobre `extraSession`:

- Header: `{currentIndex + 1} · Sessão extra` (sem `/total`, sem dots, sem progress bar de bloco).
- Sem `blockTransition`.
- Botão "Encerrar sessão extra" no canto (no lugar do X) → chama `endExtraSession()` e mostra resumo simples.
- "Próxima" sempre disponível enquanto houver questões; ao se aproximar do fim do batch, chama `loadMoreExtra()`.

**4. Tela de resumo da sessão extra**: card minimalista (questões respondidas, % acerto, duração) + botões "Continuar estudando" (volta ao picker) e "Voltar".

## Arquivos afetados

- `supabase/migrations/<timestamp>_extra_study_sessions.sql` (novo)
- `src/hooks/useStudySession.ts` (novo state + funções `startExtraSession`, `loadMoreExtra`, `endExtraSession`; flag em inserts)
- `src/hooks/useStudyStats.ts` (filtros `extra_session=false` / `is_extra=false`)
- `src/hooks/useFreemiumUsage.ts` (filtro `extra_session=false`)
- `src/pages/Objectives.tsx` (CTA na tela de resultado, picker, render condicional para sessão extra, resumo)

Nenhum arquivo de tipos é editado manualmente — `types.ts` é regenerado após a migration.

## O que **não** muda

- Tela inicial de `/objetivas` (idle dashboard) e o fluxo da sessão diária seguem idênticos.
- Lógica de fases/blocos da sessão diária intacta.
- RLS permanece a mesma (ambas colunas têm default e usam as policies já existentes em `question_attempts` / `study_sessions`).
