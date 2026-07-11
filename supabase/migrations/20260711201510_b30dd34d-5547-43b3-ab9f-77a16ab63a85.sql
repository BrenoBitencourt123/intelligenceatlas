ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS placar_estimado int,
  ADD COLUMN IF NOT EXISTS placar_fonte text CHECK (placar_fonte IN ('quiz','autoavaliacao','trilha','simulado'));