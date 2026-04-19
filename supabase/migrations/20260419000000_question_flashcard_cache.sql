
-- Cache for AI-generated flashcard content per question
-- Same pattern as question_pedagogy: generated once, reused by all users
CREATE TABLE public.question_flashcard_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT question_flashcard_cache_question_id_unique UNIQUE (question_id)
);

-- Enable RLS
ALTER TABLE public.question_flashcard_cache ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read (it's shared content, not personal)
CREATE POLICY "Authenticated users can read flashcard cache"
  ON public.question_flashcard_cache FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only service role (edge functions) can insert/update
-- No user INSERT policy needed

-- Index for fast lookups
CREATE INDEX idx_question_flashcard_cache_question_id ON public.question_flashcard_cache(question_id);
