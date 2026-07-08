GRANT INSERT ON public.ufu_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ufu_leads TO authenticated;
GRANT ALL ON public.ufu_leads TO service_role;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.ufu_leads'::regclass AND conname = 'ufu_leads_email_key'
  ) THEN
    ALTER TABLE public.ufu_leads ADD CONSTRAINT ufu_leads_email_key UNIQUE (email);
  END IF;
END $$;