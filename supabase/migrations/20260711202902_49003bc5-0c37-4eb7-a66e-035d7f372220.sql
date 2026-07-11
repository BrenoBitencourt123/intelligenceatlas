
-- 1) Expandir eventos aceitos
ALTER TABLE public.ufu_events DROP CONSTRAINT IF EXISTS ufu_events_event_check;
ALTER TABLE public.ufu_events ADD CONSTRAINT ufu_events_event_check CHECK (event = ANY (ARRAY[
  'calc_completed','card_generated','card_shared','card_downloaded',
  'trilha_sessao_inicio','trilha_sessao_fim','trilha_sessao_abandono',
  'celebracao_vista','celebracao_pulada','combo_atingido',
  'placar_atualizado','push_click'
]));

-- 2) Views de retenção
CREATE OR REPLACE VIEW public.ufu_retencao_d1 AS
WITH fins AS (
  SELECT DISTINCT session_id, (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia
  FROM public.ufu_events
  WHERE event = 'trilha_sessao_fim' AND session_id IS NOT NULL
),
qualquer AS (
  SELECT DISTINCT session_id, (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia
  FROM public.ufu_events
  WHERE session_id IS NOT NULL
)
SELECT
  f.dia,
  COUNT(DISTINCT f.session_id)::int AS usuarios,
  COUNT(DISTINCT q.session_id)::int AS retornaram,
  CASE WHEN COUNT(DISTINCT f.session_id) > 0
       THEN ROUND(100.0 * COUNT(DISTINCT q.session_id) / COUNT(DISTINCT f.session_id), 1)
       ELSE 0 END AS pct
FROM fins f
LEFT JOIN qualquer q ON q.session_id = f.session_id AND q.dia = f.dia + 1
GROUP BY f.dia
ORDER BY f.dia DESC;

CREATE OR REPLACE VIEW public.ufu_retencao_d7 AS
WITH fins AS (
  SELECT DISTINCT session_id, (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia
  FROM public.ufu_events
  WHERE event = 'trilha_sessao_fim' AND session_id IS NOT NULL
),
qualquer AS (
  SELECT DISTINCT session_id, (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia
  FROM public.ufu_events
  WHERE session_id IS NOT NULL
)
SELECT
  f.dia,
  COUNT(DISTINCT f.session_id)::int AS usuarios,
  COUNT(DISTINCT q.session_id)::int AS retornaram,
  CASE WHEN COUNT(DISTINCT f.session_id) > 0
       THEN ROUND(100.0 * COUNT(DISTINCT q.session_id) / COUNT(DISTINCT f.session_id), 1)
       ELSE 0 END AS pct
FROM fins f
LEFT JOIN qualquer q ON q.session_id = f.session_id AND q.dia BETWEEN f.dia + 1 AND f.dia + 7
GROUP BY f.dia
ORDER BY f.dia DESC;

CREATE OR REPLACE VIEW public.ufu_funil_sessao AS
SELECT
  (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
  COUNT(*) FILTER (WHERE event = 'trilha_sessao_inicio')::int AS inicios,
  COUNT(*) FILTER (WHERE event = 'trilha_sessao_fim')::int AS fins,
  COUNT(*) FILTER (WHERE event = 'trilha_sessao_abandono')::int AS abandonos,
  CASE WHEN COUNT(*) FILTER (WHERE event = 'trilha_sessao_inicio') > 0
       THEN ROUND(100.0 * COUNT(*) FILTER (WHERE event = 'trilha_sessao_fim')
                  / COUNT(*) FILTER (WHERE event = 'trilha_sessao_inicio'), 1)
       ELSE 0 END AS pct_conclusao,
  ROUND(AVG( (payload->>'pct_primeira')::numeric )
        FILTER (WHERE event = 'trilha_sessao_fim' AND payload ? 'pct_primeira'), 1)
        AS media_pct_primeira
FROM public.ufu_events
WHERE event IN ('trilha_sessao_inicio','trilha_sessao_fim','trilha_sessao_abandono')
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW public.ufu_celebracao AS
SELECT
  COALESCE(payload->>'tela', 'desconhecida') AS tela,
  COUNT(*) FILTER (WHERE event = 'celebracao_vista')::int AS vistas,
  COUNT(*) FILTER (WHERE event = 'celebracao_pulada')::int AS puladas,
  CASE WHEN COUNT(*) FILTER (WHERE event IN ('celebracao_vista','celebracao_pulada')) > 0
       THEN ROUND(100.0 * COUNT(*) FILTER (WHERE event = 'celebracao_pulada')
                  / COUNT(*) FILTER (WHERE event IN ('celebracao_vista','celebracao_pulada')), 1)
       ELSE 0 END AS pct_pulo
FROM public.ufu_events
WHERE event IN ('celebracao_vista','celebracao_pulada')
GROUP BY 1
ORDER BY vistas DESC;

CREATE OR REPLACE VIEW public.ufu_push_eficacia AS
WITH enviados AS (
  SELECT tipo, (sent_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
         COUNT(*)::int AS enviados, ARRAY_AGG(DISTINCT user_id) AS user_ids
  FROM public.push_log
  GROUP BY 1, 2
),
cliques AS (
  SELECT payload->>'tipo' AS tipo,
         (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
         COUNT(*)::int AS cliques
  FROM public.ufu_events
  WHERE event = 'push_click'
  GROUP BY 1, 2
),
sessoes AS (
  SELECT (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
         ARRAY_AGG(DISTINCT session_id) AS session_ids
  FROM public.ufu_events
  WHERE event = 'trilha_sessao_inicio' AND session_id IS NOT NULL
  GROUP BY 1
)
SELECT
  e.tipo,
  e.dia,
  e.enviados,
  COALESCE(c.cliques, 0) AS cliques,
  COALESCE(array_length(e.user_ids, 1), 0) AS destinatarios
FROM enviados e
LEFT JOIN cliques c ON c.tipo = e.tipo AND c.dia = e.dia
LEFT JOIN sessoes s ON s.dia = e.dia
ORDER BY e.dia DESC, e.tipo;

GRANT SELECT ON public.ufu_retencao_d1 TO authenticated, service_role;
GRANT SELECT ON public.ufu_retencao_d7 TO authenticated, service_role;
GRANT SELECT ON public.ufu_funil_sessao TO authenticated, service_role;
GRANT SELECT ON public.ufu_celebracao TO authenticated, service_role;
GRANT SELECT ON public.ufu_push_eficacia TO authenticated, service_role;
