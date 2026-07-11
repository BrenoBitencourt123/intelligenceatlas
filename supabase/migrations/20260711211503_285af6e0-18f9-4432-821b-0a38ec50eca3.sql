
-- 1) Coluna user_id opcional
ALTER TABLE public.ufu_events
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ufu_events_user_id_idx ON public.ufu_events (user_id);

-- 2) RLS: aceitar todos os eventos previstos; se logado, user_id precisa bater
DROP POLICY IF EXISTS "ufu_events_insert_anon" ON public.ufu_events;
CREATE POLICY "ufu_events_insert_anon"
  ON public.ufu_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event = ANY (ARRAY[
      'calc_completed','card_generated','card_shared','card_downloaded',
      'trilha_sessao_inicio','trilha_sessao_fim','trilha_sessao_abandono',
      'celebracao_vista','celebracao_pulada','combo_atingido',
      'placar_atualizado','push_click'
    ])
    AND (session_id IS NULL OR length(session_id) <= 128)
    AND (
      auth.uid() IS NULL
      OR user_id IS NULL
      OR user_id = auth.uid()
    )
  );

-- 3) Views usando coalesce(user_id::text, session_id) como identidade
CREATE OR REPLACE VIEW public.ufu_retencao_d1
  WITH (security_invoker = on) AS
WITH fins AS (
  SELECT DISTINCT coalesce(user_id::text, session_id) AS ident,
         (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia
  FROM public.ufu_events
  WHERE event = 'trilha_sessao_fim' AND coalesce(user_id::text, session_id) IS NOT NULL
),
qualquer AS (
  SELECT DISTINCT coalesce(user_id::text, session_id) AS ident,
         (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia
  FROM public.ufu_events
  WHERE coalesce(user_id::text, session_id) IS NOT NULL
)
SELECT
  f.dia,
  COUNT(DISTINCT f.ident)::int AS usuarios,
  COUNT(DISTINCT q.ident)::int AS retornaram,
  CASE WHEN COUNT(DISTINCT f.ident) > 0
       THEN ROUND(100.0 * COUNT(DISTINCT q.ident) / COUNT(DISTINCT f.ident), 1)
       ELSE 0 END AS pct
FROM fins f
LEFT JOIN qualquer q ON q.ident = f.ident AND q.dia = f.dia + 1
GROUP BY f.dia
ORDER BY f.dia DESC;

CREATE OR REPLACE VIEW public.ufu_retencao_d7
  WITH (security_invoker = on) AS
WITH fins AS (
  SELECT DISTINCT coalesce(user_id::text, session_id) AS ident,
         (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia
  FROM public.ufu_events
  WHERE event = 'trilha_sessao_fim' AND coalesce(user_id::text, session_id) IS NOT NULL
),
qualquer AS (
  SELECT DISTINCT coalesce(user_id::text, session_id) AS ident,
         (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia
  FROM public.ufu_events
  WHERE coalesce(user_id::text, session_id) IS NOT NULL
)
SELECT
  f.dia,
  COUNT(DISTINCT f.ident)::int AS usuarios,
  COUNT(DISTINCT q.ident)::int AS retornaram,
  CASE WHEN COUNT(DISTINCT f.ident) > 0
       THEN ROUND(100.0 * COUNT(DISTINCT q.ident) / COUNT(DISTINCT f.ident), 1)
       ELSE 0 END AS pct
FROM fins f
LEFT JOIN qualquer q ON q.ident = f.ident AND q.dia BETWEEN f.dia + 1 AND f.dia + 7
GROUP BY f.dia
ORDER BY f.dia DESC;

CREATE OR REPLACE VIEW public.ufu_push_eficacia
  WITH (security_invoker = on) AS
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
         ARRAY_AGG(DISTINCT coalesce(user_id::text, session_id)) AS idents
  FROM public.ufu_events
  WHERE event = 'trilha_sessao_inicio' AND coalesce(user_id::text, session_id) IS NOT NULL
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

-- 4) Agendar streak-risk-push (19h America/Sao_Paulo = 22h UTC)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Segredos no vault (idempotente). O anon key é público — usado só pra bater
-- na edge function; a function em si usa SERVICE_ROLE_KEY internamente.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'ufu_project_url') THEN
    PERFORM vault.create_secret('https://elqbgbcoyocxgtcswyyh.supabase.co', 'ufu_project_url');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'ufu_anon_key') THEN
    PERFORM vault.create_secret(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscWJnYmNveW9jeGd0Y3N3eXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTM3ODIsImV4cCI6MjA4NTYyOTc4Mn0.NlnJz9XSJOEb-x0W_-xE9miYVP1AESktO3A0K1pGctY',
      'ufu_anon_key'
    );
  END IF;
END $$;

-- Remove agendamento antigo se existir e recria
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'streak-risk-push-diario';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

SELECT cron.schedule(
  'streak-risk-push-diario',
  '0 22 * * *',
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ufu_project_url')
           || '/functions/v1/streak-risk-push',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ufu_anon_key')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
