
-- 1) ufu_diagnostico_questoes
CREATE TABLE public.ufu_diagnostico_questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano int,
  prova text,
  area text NOT NULL CHECK (area IN ('humanas','natureza','linguagens','matematica')),
  statement text NOT NULL,
  alternativas jsonb NOT NULL,
  correta text NOT NULL,
  gabarito_comentado text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ufu_diagnostico_questoes TO anon, authenticated;
GRANT ALL ON public.ufu_diagnostico_questoes TO service_role;
ALTER TABLE public.ufu_diagnostico_questoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ufu_diag_read_all" ON public.ufu_diagnostico_questoes
  FOR SELECT TO anon, authenticated USING (ativo = true);
CREATE POLICY "ufu_diag_admin_write" ON public.ufu_diagnostico_questoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) ufu_config (kv)
CREATE TABLE public.ufu_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ufu_config TO anon, authenticated;
GRANT ALL ON public.ufu_config TO service_role;
ALTER TABLE public.ufu_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ufu_config_read_all" ON public.ufu_config
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ufu_config_admin_write" ON public.ufu_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.ufu_config (key, value) VALUES
  ('passe_disponivel', 'false'::jsonb),
  ('data_prova_ufu', '"2026-11-08"'::jsonb),
  ('diagnostico_ativo', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3) profiles: campos do passe
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ufu_passe_ativo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ufu_passe_expira_em date;

-- 4) leads: indice de origem para separar diagnostico da lista pSEO
CREATE INDEX IF NOT EXISTS ufu_leads_origem_idx ON public.ufu_leads (origem);
