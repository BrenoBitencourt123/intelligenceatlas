
-- 1. Questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  area TEXT NOT NULL,
  number INTEGER NOT NULL,
  statement TEXT NOT NULL,
  alternatives JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  image_url TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own questions" ON public.questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own questions" ON public.questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own questions" ON public.questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own questions" ON public.questions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_questions_user_area ON public.questions (user_id, area);

-- 2. Question attempts table
CREATE TABLE public.question_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  selected_answer TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts" ON public.question_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON public.question_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_attempts_user_date ON public.question_attempts (user_id, session_date);

-- 3. Flashcards table
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_id UUID,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  area TEXT,
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review DATE NOT NULL DEFAULT CURRENT_DATE,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_flashcards_user_review ON public.flashcards (user_id, next_review);

-- 4. Flashcard reviews table
CREATE TABLE public.flashcard_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  rating TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reviews" ON public.flashcard_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews" ON public.flashcard_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Study sessions table
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  area TEXT NOT NULL,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  flashcards_reviewed INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_sessions_user_date ON public.study_sessions (user_id, session_date);
