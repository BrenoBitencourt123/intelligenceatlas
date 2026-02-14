
-- Table to cache AI-generated pedagogical content per question
CREATE TABLE public.question_pedagogy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  pre_concept JSONB, -- {explanation, formula, bullets}
  cognitive_pattern TEXT, -- "O que o ENEM quis cobrar aqui?"
  deep_lesson TEXT, -- "Entenda de vez" mini-aula
  video_suggestions JSONB, -- [{title, query}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT question_pedagogy_question_id_unique UNIQUE (question_id)
);

-- Enable RLS
ALTER TABLE public.question_pedagogy ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read pedagogy (it's shared content)
CREATE POLICY "Authenticated users can read pedagogy"
  ON public.question_pedagogy FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only edge functions (service role) insert pedagogy, so no INSERT policy for users needed
-- But let's allow service role via default; no user INSERT policy.

-- Index for fast lookups
CREATE INDEX idx_question_pedagogy_question_id ON public.question_pedagogy(question_id);
