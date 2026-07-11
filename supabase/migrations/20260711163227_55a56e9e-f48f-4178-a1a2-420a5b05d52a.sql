ALTER TABLE public.trilha_nos ADD COLUMN IF NOT EXISTS ordem int NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS trilha_nos_disciplina_ordem_idx ON public.trilha_nos (disciplina, ordem);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diagnostico_feito_at timestamptz;
UPDATE public.trilha_nos SET ordem = 0 WHERE id = 'red-generos-zeros' AND ordem = 0;