-- Créditos de correção UFU (comprados/concedidos). Só service_role escreve.
CREATE TABLE IF NOT EXISTS public.ufu_creditos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qtd INTEGER NOT NULL,
  motivo TEXT DEFAULT 'pix',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ufu_creditos TO authenticated;
GRANT ALL ON public.ufu_creditos TO service_role;

ALTER TABLE public.ufu_creditos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ufu_creditos_select_own"
  ON public.ufu_creditos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Registro server-side de usos de correção UFU. Só service_role insere.
CREATE TABLE IF NOT EXISTS public.ufu_correcoes_uso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ufu_correcoes_uso TO authenticated;
GRANT ALL ON public.ufu_correcoes_uso TO service_role;

ALTER TABLE public.ufu_correcoes_uso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ufu_uso_select_own"
  ON public.ufu_correcoes_uso
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Saldo = 1 grátis + créditos - usos.
CREATE OR REPLACE FUNCTION public.ufu_correcoes_saldo(p_user UUID)
  RETURNS INTEGER
  LANGUAGE SQL
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT 1
    + COALESCE((SELECT SUM(qtd) FROM public.ufu_creditos WHERE user_id = p_user), 0)::int
    - COALESCE((SELECT COUNT(*) FROM public.ufu_correcoes_uso WHERE user_id = p_user), 0)::int;
$$;

GRANT EXECUTE ON FUNCTION public.ufu_correcoes_saldo(UUID) TO authenticated;