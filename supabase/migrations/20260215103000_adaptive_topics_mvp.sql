-- Adaptive study MVP: question taxonomy + user topic profiling
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS subtopic TEXT,
  ADD COLUMN IF NOT EXISTS difficulty SMALLINT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';

-- Backfill for compatibility with old rows
UPDATE public.questions
SET
  topic = COALESCE(NULLIF(TRIM(topic), ''), 'Geral'),
  subtopic = COALESCE(NULLIF(TRIM(subtopic), ''), ''),
  difficulty = CASE
    WHEN difficulty IS NULL OR difficulty < 1 THEN 2
    WHEN difficulty > 3 THEN 3
    ELSE difficulty
  END
WHERE topic IS NULL
   OR TRIM(topic) = ''
   OR subtopic IS NULL
   OR difficulty IS NULL
   OR difficulty < 1
   OR difficulty > 3;

ALTER TABLE public.questions
  ALTER COLUMN topic SET DEFAULT 'Geral',
  ALTER COLUMN topic SET NOT NULL,
  ALTER COLUMN subtopic SET DEFAULT '',
  ALTER COLUMN subtopic SET NOT NULL;

-- Statement may be empty only when at least one image exists
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_statement_or_images_check;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_statement_or_images_check
  CHECK (
    LENGTH(TRIM(COALESCE(statement, ''))) > 0
    OR jsonb_array_length(COALESCE(images, '[]'::jsonb)) > 0
  );

ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_difficulty_check;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_difficulty_check
  CHECK (difficulty BETWEEN 1 AND 3);

CREATE INDEX IF NOT EXISTS idx_questions_area_topic_subtopic
  ON public.questions (area, topic, subtopic);

CREATE INDEX IF NOT EXISTS idx_questions_area_difficulty
  ON public.questions (area, difficulty);

-- User preferences from onboarding
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_language TEXT,
  daily_minutes_target INTEGER NOT NULL DEFAULT 60,
  difficulty_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  topic_self_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_preferences_user_unique UNIQUE (user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences"
ON public.user_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
ON public.user_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
ON public.user_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Per-topic user profile for adaptive selection
CREATE TABLE IF NOT EXISTS public.user_topic_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT NOT NULL DEFAULT '',
  level SMALLINT NOT NULL DEFAULT 1,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  dont_know INTEGER NOT NULL DEFAULT 0,
  correct_streak INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  priority_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_topic_profile_level_check CHECK (level BETWEEN 0 AND 3),
  CONSTRAINT user_topic_profile_unique UNIQUE (user_id, area, topic, subtopic)
);

CREATE INDEX IF NOT EXISTS idx_user_topic_profile_user_priority
  ON public.user_topic_profile (user_id, priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_user_topic_profile_user_review
  ON public.user_topic_profile (user_id, next_review_at);

ALTER TABLE public.user_topic_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own topic profile" ON public.user_topic_profile;
CREATE POLICY "Users can view own topic profile"
ON public.user_topic_profile FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own topic profile" ON public.user_topic_profile;
CREATE POLICY "Users can insert own topic profile"
ON public.user_topic_profile FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own topic profile" ON public.user_topic_profile;
CREATE POLICY "Users can update own topic profile"
ON public.user_topic_profile FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Granular history by question with dont_know support
CREATE TABLE IF NOT EXISTS public.user_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_spent_sec INTEGER,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_question_history_user_time
  ON public.user_question_history (user_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_question_history_user_question
  ON public.user_question_history (user_id, question_id);

ALTER TABLE public.user_question_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own question history" ON public.user_question_history;
CREATE POLICY "Users can view own question history"
ON public.user_question_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own question history" ON public.user_question_history;
CREATE POLICY "Users can insert own question history"
ON public.user_question_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
