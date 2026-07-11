
-- 1) Coluna pra guardar respostas do diagnóstico daqui pra frente
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS diagnostico_niveis jsonb;

-- 2) Backfill: usuários que fizeram o diagnóstico antes do placar vivo
--    contam nós dourados na trilha e recebem um placar estimado por bucket.
WITH dourados AS (
  SELECT user_id, COUNT(*)::int AS n
  FROM public.trilha_progresso
  WHERE dourado = true
  GROUP BY user_id
),
alvo AS (
  SELECT p.id,
         COALESCE(d.n, 0) AS dourados,
         CASE
           WHEN COALESCE(d.n, 0) = 0 THEN 8
           WHEN COALESCE(d.n, 0) BETWEEN 1 AND 2 THEN 18
           ELSE 30
         END AS estimado
  FROM public.profiles p
  LEFT JOIN dourados d ON d.user_id = p.id
  WHERE p.diagnostico_feito_at IS NOT NULL
    AND p.placar_estimado IS NULL
)
UPDATE public.profiles p
SET placar_estimado = a.estimado,
    placar_fonte    = 'autoavaliacao'
FROM alvo a
WHERE p.id = a.id;
