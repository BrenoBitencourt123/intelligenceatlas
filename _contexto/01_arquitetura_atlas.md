# Arquitetura do Atlas

## Stack
- **Frontend**: Vite + TypeScript + React 18 + shadcn/ui + Tailwind + react-router-dom v6
- **Backend**: Supabase (Postgres + Edge Functions em Deno) + RLS
- **Pagamento**: Stripe (`create-checkout`, `customer-portal`, `check-subscription`, `founders-slots`)
- **IA**: OpenAI GPT-4.1-mini (analise/improve redacao, generate-theme), Gemini 2.5 Flash (parse-exam-pdf, classify-question)
- **PWA**: vite-plugin-pwa + push notifications (VAPID, send-push)
- **Auth**: Supabase Auth + WebAuthn passkeys (`webauthn-authenticate`, `webauthn-register`, `passkey_credentials`)
- **Dev**: Lovable.dev (gera codigo a partir de prompts, commita auto). README ainda tem placeholders `REPLACE_WITH_PROJECT_ID`.

## Rotas (`src/App.tsx`)
- `/` -> Landing (publica) ou redirect `/hoje` se logado
- `/hoje` (`Today.tsx`) - dashboard diario do aluno
- `/redacao` (`Essay.tsx`) - editor + analise de redacao
- `/objetivas` (`Objectives.tsx`) - sessao de questoes
- `/simulado`, `/simulado/sessao` - simulado completo (90q ordem oficial)
- `/flashcards` - revisao espacada
- `/historico` - historico do aluno
- `/diagnostico` - diagnostico inicial
- `/errors` - erros por topico
- `/plano` - upgrade Pro
- `/fundadores`, `/fundadores/cadastro` - programa Fundadores
- `/admin` - painel admin (com gating via `has_role`)
- `/onboarding`, `/bem-vindo` - novo usuario
- `/perfil`, `/login`, `/cadastro`, `/reset-password`, `/termos`, `/privacidade`

## Hooks principais (`src/hooks/`)
- `useEssayState` - estado do editor de redacao (blocos, analises, melhoria)
- `useDailyTheme` - puxa tema do dia da `daily_themes`
- `usePlanFeatures` - **fonte unica de verdade** sobre o que cada plano libera (ver tabela abaixo)
- `useQuotaCheck`, `useFreemiumUsage`, `useFreeAreaQuota` - 3 hooks (!) cuidando de cota
- `useStudySchedule`, `useStudySession`, `useStudyStats` - sessao de objetivas
- `useDayBlocks` - "foco do dia" com blocos curados por topico
- `useFlashcardReview` - SRS
- `useUserMastery` - mastery por dimensao
- `useQuestionPedagogy` - cap. de conhecimento (Pro)
- `useImportExam`, `useExamPdf`, `useQuestionImageManager` - import e visualizacao de PDFs

## Plan gating (`usePlanFeatures`)
| Feature                          | Free                  | Pro                |
|----------------------------------|-----------------------|--------------------|
| Tema do dia (`hasThemeAccess`)   | so se tem cota semanal| sim                |
| Pedagogico (`hasPedagogical`)    | so se tem cota        | sim                |
| Versao melhorada                 | so se tem cota        | sim                |
| Fontes citadas (`hasSources`)    | NAO                   | sim                |
| Redacao limite                   | 1/sem (2 na 1a sem)   | 60/mes + 2/dia     |
| Questoes/dia                     | 10                    | ilimitado          |
| Sessao completa (20q)            | NAO                   | sim                |
| Flashcards auto ao errar         | NAO                   | sim                |
| Capsulas de conhecimento         | NAO                   | sim                |

## Schema Supabase - tabelas principais

### `questions`
```
id, user_id, year, number, day, area, statement, alternatives (JSONB),
correct_answer, explanation, image_url, images, tags (JSONB), topic, subtopic,
difficulty (1-3), skills (JSONB), foreign_language, content (JSONB), command,
-- taxonomy_v2:
disciplina, topics (TEXT[]), cognitive_level, confidence (0-1),
needs_review, classifier_version, classified_at, created_at
```
Indices: `disciplina`, `needs_review` (partial), `classified_at`, GIN em `topics`.

Trigger `trg_auto_set_question_day`: define `day` automaticamente a partir de `area` (linguagens+humanas=1, natureza+matematica=2).

### `essays`
```
id, user_id (FK profiles), theme, blocks (JSONB), analysis (JSONB),
total_score (0-1000), created_at, analyzed_at
```

### `daily_themes`
```
id, date (UNIQUE), title, motivating_text, context,
guiding_questions (JSONB), structure_guide (JSONB),
sources (JSONB - adicionado depois), is_ai_generated, created_at
```

### `profiles`
```
id (FK auth.users), email, name, plan_type ('basic'|'pro' - 'basic' tratado como legacy de 'pro'),
plan_started_at, flexible_quota (?), phone (onboarding_v2), created_at
```

### `user_mastery`
Tracking de proficiencia por dimensao (topic/skill/topic_skill).
Smoothing bayesiano: `mastery_score = (correct + 1) / (attempts + 2)`.

### Outras
- `question_attempts`, `question_pedagogy`, `question_flashcard_cache`
- `flashcards`, `flashcard_reviews`, `study_sessions`
- `user_question_history`, `user_topic_profile`, `user_preferences`
- `token_usage` (metricas de custo de IA)
- `vip_leads` (programa Fundadores)
- `push_subscriptions`, `passkey_credentials`, `user_roles`

## Edge Functions (`supabase/functions/`)

### Questoes
- `import-enem-api` - puxa de api.enem.dev (questoes ja parseadas + imagens + gabarito + idiomas ingles/espanhol)
- `parse-exam-pdf` - extrai questoes de imagens base64 do PDF via Gemini 2.5 Flash Vision
- `classify-question` - classifica disciplina/topics/skills/cognitive_level/difficulty
- `reclassify-questions`, `pre-classify-batch` - batch ops
- `reformat-statements` - normaliza markdown

### Redacao
- `analyze-essay` - GPT-4.1-mini, avalia 5 competencias + analise por bloco. Quota gate aqui.
- `improve-essay` - GPT-4.1-mini, reescreve mantendo ideias do aluno
- `generate-theme` - GPT-4.1-mini, gera tema + 3-5 fontes (APENAS ADMIN)

### Outros
- `flashcards-smart`, `generate-flashcard`, `clean-flashcards`
- `generate-pedagogy` - capsulas pedagogicas
- `create-checkout`, `customer-portal`, `check-subscription` - Stripe
- `founders-slots` - vagas do programa Fundadores
- `send-push`, `get-vapid-key` - push notif
- `webauthn-authenticate`, `webauthn-register` - passkeys
- `admin-maintenance`, `clear-storage-bucket`

## Taxonomia canonica (`src/taxonomy/taxonomy.ts`)

- **4 areas**: humanas, natureza, linguagens, matematica
- **~15 disciplinas** (historia, geografia, quimica, fisica, biologia, ...)
- **~150 topicos** com IDs estaveis `{disciplina}__{topico}` (ex: `historia__brasil_colonia`)
- **22 skills universais** (ex: `interpretacao_grafico`, `relacao_causa_consequencia`)
- **Helpers**: `validateTopicIds`, `filterValidTopicIds`, `getTopicsForArea`, etc.
- **Output do classifier**: `{ disciplina, topics[], skills[], difficulty(1-3), cognitive_level, confidence, rationale, needs_review }`

## Schema de import de questoes (de `README.md`)

```json
{
  "detected_year": 2025,
  "questions": [{
    "number": 1, "day": 1, "area": "linguagens",
    "topic": "Interpretacao", "subtopic": "Inferencia",
    "difficulty": 2, "skills": ["Leitura"],
    "statement": "markdown com {{IMG_0}} placeholder",
    "alternatives": [{"letter": "A", "text": "..."}],
    "correct_answer": "A",
    "explanation": "opcional",
    "tags": ["opcional"],
    "requires_image": false,
    "image_reason": null,
    "images": [{"url": "https://...", "caption": "opcional", "order": 0}]
  }]
}
```

Endpoint: `/importar` (`Import.tsx`). Aceita objeto com `questions` ou array direto.
