ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS exam text NOT NULL DEFAULT 'enem';
CREATE INDEX IF NOT EXISTS idx_questions_exam_area ON public.questions (exam, area);