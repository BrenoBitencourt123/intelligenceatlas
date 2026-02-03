-- Create daily_themes table
CREATE TABLE public.daily_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  motivating_text TEXT NOT NULL,
  context TEXT NOT NULL,
  guiding_questions JSONB NOT NULL DEFAULT '[]',
  structure_guide JSONB NOT NULL DEFAULT '[]',
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.daily_themes ENABLE ROW LEVEL SECURITY;

-- Anyone can read themes (public access)
CREATE POLICY "Anyone can read themes" 
ON public.daily_themes 
FOR SELECT 
USING (true);

-- Only service_role can insert (for edge functions)
CREATE POLICY "Service role can insert themes" 
ON public.daily_themes 
FOR INSERT 
WITH CHECK (true);

-- Create index for date lookups
CREATE INDEX idx_daily_themes_date ON public.daily_themes(date);