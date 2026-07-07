
-- 1. questions: remove anon write/read policies
DROP POLICY IF EXISTS "allow insert questions" ON public.questions;
DROP POLICY IF EXISTS "allow select questions" ON public.questions;
DROP POLICY IF EXISTS "anon update questions" ON public.questions;

-- 2. daily_themes: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can read themes" ON public.daily_themes;
CREATE POLICY "Authenticated can read themes"
  ON public.daily_themes FOR SELECT
  TO authenticated
  USING (true);

-- 3. storage: drop broad SELECT policies (public URL still works for public buckets)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Exam PDFs are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Question images are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "question_images_public_read" ON storage.objects;

-- 4. vip_leads: replace WITH CHECK (true) with basic sanity constraints
DROP POLICY IF EXISTS "Public can insert leads" ON public.vip_leads;
CREATE POLICY "Public can insert leads"
  ON public.vip_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND length(btrim(name)) BETWEEN 2 AND 120
    AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 254
    AND whatsapp IS NOT NULL AND length(whatsapp) BETWEEN 8 AND 30
  );

-- 4b. ufu_events: replace WITH CHECK (true) with basic sanity constraint
DROP POLICY IF EXISTS "ufu_events_insert_anon" ON public.ufu_events;
CREATE POLICY "ufu_events_insert_anon"
  ON public.ufu_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event IN ('calc_completed', 'card_generated', 'card_shared', 'card_downloaded')
    AND (session_id IS NULL OR length(session_id) <= 128)
  );

-- 5. ufu_share_rate view: recreate as SECURITY INVOKER using real columns
DROP VIEW IF EXISTS public.ufu_share_rate;
CREATE VIEW public.ufu_share_rate
  WITH (security_invoker = on) AS
  SELECT
    count(*) FILTER (WHERE event = 'card_shared')::bigint    AS card_shares,
    count(*) FILTER (WHERE event = 'card_generated')::bigint AS card_generated,
    CASE
      WHEN count(*) FILTER (WHERE event = 'card_generated') > 0 THEN
        round(
          (count(*) FILTER (WHERE event = 'card_shared')::numeric
           / count(*) FILTER (WHERE event = 'card_generated')::numeric) * 100,
          2
        )
      ELSE 0
    END AS share_rate_pct
  FROM public.ufu_events;
GRANT SELECT ON public.ufu_share_rate TO authenticated;

-- 6. Revoke public EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
