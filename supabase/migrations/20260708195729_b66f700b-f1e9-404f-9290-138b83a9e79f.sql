DROP INDEX IF EXISTS public.ufu_leads_email_idx;

ALTER TABLE public.ufu_leads
  ADD CONSTRAINT ufu_leads_email_key UNIQUE (email);