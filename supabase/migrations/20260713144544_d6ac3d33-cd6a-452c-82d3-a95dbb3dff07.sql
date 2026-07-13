
-- 1. profiles.dia_redacao
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dia_redacao smallint NOT NULL DEFAULT 6
  CHECK (dia_redacao BETWEEN 0 AND 6);

-- 2. temas_semana
CREATE TABLE IF NOT EXISTS public.temas_semana (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_iso text NOT NULL UNIQUE,
  proposta_id text NOT NULL,
  titulo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.temas_semana TO authenticated;
GRANT ALL ON public.temas_semana TO service_role;
ALTER TABLE public.temas_semana ENABLE ROW LEVEL SECURITY;

CREATE POLICY "temas_semana readable by authenticated"
  ON public.temas_semana FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "temas_semana admin write"
  ON public.temas_semana FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. reescritas_agendadas
CREATE TABLE IF NOT EXISTS public.reescritas_agendadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  essay_id uuid NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
  criterio_alvo text,
  due_date date NOT NULL,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reescritas_agendadas_user_due_idx
  ON public.reescritas_agendadas(user_id, due_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reescritas_agendadas TO authenticated;
GRANT ALL ON public.reescritas_agendadas TO service_role;
ALTER TABLE public.reescritas_agendadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reescritas own read"
  ON public.reescritas_agendadas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "reescritas own write"
  ON public.reescritas_agendadas FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
