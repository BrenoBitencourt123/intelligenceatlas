
-- Table to track individual question attempts with detailed data
CREATE TABLE public.user_question_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_spent_sec INTEGER,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_question_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own question history"
  ON public.user_question_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question history"
  ON public.user_question_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_uqh_user_question ON public.user_question_history(user_id, question_id);

-- Table to track user proficiency per topic
CREATE TABLE public.user_topic_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  area TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT NOT NULL DEFAULT '',
  level INTEGER NOT NULL DEFAULT 1,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  dont_know INTEGER NOT NULL DEFAULT 0,
  correct_streak INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  next_review_at TIMESTAMP WITH TIME ZONE,
  priority_score NUMERIC NOT NULL DEFAULT 0.5,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, area, topic, subtopic)
);

ALTER TABLE public.user_topic_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topic profile"
  ON public.user_topic_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic profile"
  ON public.user_topic_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic profile"
  ON public.user_topic_profile FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_utp_user_area ON public.user_topic_profile(user_id, area);
