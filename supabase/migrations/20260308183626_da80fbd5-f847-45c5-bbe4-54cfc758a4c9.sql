
CREATE TABLE public.vip_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vip_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form, no auth required)
CREATE POLICY "Public can insert leads" ON public.vip_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read leads
CREATE POLICY "Admins can read leads" ON public.vip_leads
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
