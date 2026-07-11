
-- streak_freezes: um freeze por semana ISO por usuário
CREATE TABLE IF NOT EXISTS public.streak_freezes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_on date NOT NULL,
  iso_week text NOT NULL, -- 'YYYY-WW' pra unicidade fácil
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, iso_week)
);
CREATE INDEX IF NOT EXISTS streak_freezes_user_date_idx ON public.streak_freezes(user_id, used_on);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.streak_freezes TO authenticated;
GRANT ALL ON public.streak_freezes TO service_role;

ALTER TABLE public.streak_freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own freezes"
  ON public.streak_freezes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freezes"
  ON public.streak_freezes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- push_log: registro dos envios (medição)
CREATE TABLE IF NOT EXISTS public.push_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_log_user_sent_idx ON public.push_log(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS push_log_tipo_sent_idx ON public.push_log(tipo, sent_at DESC);

GRANT SELECT ON public.push_log TO authenticated;
GRANT ALL ON public.push_log TO service_role;

ALTER TABLE public.push_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push log"
  ON public.push_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
