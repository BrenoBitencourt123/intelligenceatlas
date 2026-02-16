-- Flashcards inteligentes (SRS + metadados de aprendizado)

ALTER TABLE public.flashcards
  ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT 'Geral',
  ADD COLUMN IF NOT EXISTS subtopic TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS example_context TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS level SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wrong_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dont_know_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.flashcards
  DROP CONSTRAINT IF EXISTS flashcards_level_check;

ALTER TABLE public.flashcards
  ADD CONSTRAINT flashcards_level_check CHECK (level BETWEEN 0 AND 3);

-- Compatibilidade com coluna legada (DATE)
UPDATE public.flashcards
SET next_review_at = COALESCE(next_review_at, (next_review::text || 'T00:00:00Z')::timestamptz);

-- Backfill taxonomy/contexto quando card foi gerado de questao
UPDATE public.flashcards f
SET
  topic = COALESCE(NULLIF(TRIM(q.topic), ''), f.topic),
  subtopic = COALESCE(NULLIF(TRIM(q.subtopic), ''), f.subtopic),
  skills = CASE
    WHEN q.skills IS NULL THEN f.skills
    ELSE q.skills
  END,
  example_context = COALESCE(f.example_context, LEFT(q.statement, 280)),
  image_url = COALESCE(f.image_url, q.image_url)
FROM public.questions q
WHERE f.source_id = q.id;

CREATE INDEX IF NOT EXISTS idx_flashcards_user_next_review_at
  ON public.flashcards (user_id, next_review_at);

CREATE INDEX IF NOT EXISTS idx_flashcards_user_topic
  ON public.flashcards (user_id, topic, subtopic);

CREATE UNIQUE INDEX IF NOT EXISTS idx_flashcards_user_source_unique
  ON public.flashcards (user_id, source_type, source_id)
  WHERE source_id IS NOT NULL;

ALTER TABLE public.flashcard_reviews
  ADD COLUMN IF NOT EXISTS response_time_sec INTEGER,
  ADD COLUMN IF NOT EXISTS previous_level SMALLINT,
  ADD COLUMN IF NOT EXISTS new_level SMALLINT,
  ADD COLUMN IF NOT EXISTS previous_interval_days INTEGER,
  ADD COLUMN IF NOT EXISTS new_interval_days INTEGER;

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_reviewed_at
  ON public.flashcard_reviews (user_id, reviewed_at DESC);
