-- Add `day` column to questions table for ENEM Day 1 / Day 2 separation
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS day SMALLINT NULL;

-- Constraint: day must be 1 or 2 when present
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_day_check;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_day_check
  CHECK (day IS NULL OR day IN (1, 2));

-- Backfill heuristic based on area
-- Day 1: linguagens + humanas
-- Day 2: natureza + matematica
UPDATE public.questions
SET day = 1
WHERE day IS NULL
  AND area IN ('linguagens', 'humanas');

UPDATE public.questions
SET day = 2
WHERE day IS NULL
  AND area IN ('natureza', 'matematica');

-- Add separate flag for simulado attempts (kept distinct from extra_session)
ALTER TABLE public.question_attempts
  ADD COLUMN IF NOT EXISTS simulado_session BOOLEAN NOT NULL DEFAULT false;

-- Composite index for fast simulado queries (year, day, number ordering)
CREATE INDEX IF NOT EXISTS questions_year_day_number_idx
  ON public.questions (year, day, number);

-- Index for filtering simulado attempts
CREATE INDEX IF NOT EXISTS question_attempts_simulado_idx
  ON public.question_attempts (user_id, simulado_session);