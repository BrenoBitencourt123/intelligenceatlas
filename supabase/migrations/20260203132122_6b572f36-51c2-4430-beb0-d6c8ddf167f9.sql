-- Add DELETE policy for essays table so users can delete their own essays
CREATE POLICY "Users can delete own essays" 
ON public.essays 
FOR DELETE 
USING (auth.uid() = user_id);

-- Drop and recreate the Service role insert policy for daily_themes with a better approach
DROP POLICY IF EXISTS "Service role can insert themes" ON public.daily_themes;

-- Drop and recreate the Service role insert policy for token_usage with a better approach  
DROP POLICY IF EXISTS "Service role can insert token usage" ON public.token_usage;