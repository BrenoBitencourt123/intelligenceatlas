ALTER TABLE public.question_attempts
  ADD COLUMN IF NOT EXISTS extra_session boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS question_attempts_user_session_extra_idx
  ON public.question_attempts (user_id, session_date, extra_session);

ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS is_extra boolean NOT NULL DEFAULT false;