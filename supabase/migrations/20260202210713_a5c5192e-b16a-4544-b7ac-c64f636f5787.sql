-- Enable RLS on token_usage
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to insert (using service role)
CREATE POLICY "Service role can insert token usage"
ON public.token_usage
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow reading for now (will be restricted to admin later)
CREATE POLICY "Allow read access for token usage"
ON public.token_usage
FOR SELECT
USING (true);