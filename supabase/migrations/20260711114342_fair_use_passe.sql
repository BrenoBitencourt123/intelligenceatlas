-- Fair-use do Passe UFU: registrar usos via passe sem poluir o saldo de créditos.
ALTER TABLE public.ufu_correcoes_uso
  ADD COLUMN IF NOT EXISTS via_passe boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ufu_uso_user_dia_idx
  ON public.ufu_correcoes_uso (user_id, created_at);

-- Saldo de créditos passa a ignorar usos feitos via passe.
CREATE OR REPLACE FUNCTION public.ufu_correcoes_saldo(p_user UUID)
  RETURNS INTEGER
  LANGUAGE SQL
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT 1
    + COALESCE((SELECT SUM(qtd) FROM public.ufu_creditos WHERE user_id = p_user), 0)::int
    - COALESCE((SELECT COUNT(*) FROM public.ufu_correcoes_uso
                 WHERE user_id = p_user AND NOT via_passe), 0)::int;
$$;
