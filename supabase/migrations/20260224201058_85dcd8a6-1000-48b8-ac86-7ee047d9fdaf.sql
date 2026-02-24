
-- Add foreign_language column to questions table
-- null = not a foreign language question (Q6+), 'ingles' or 'espanhol' for Q1-5
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS foreign_language text;

-- Add foreign_language preference to user_preferences
-- null or 'ingles' or 'espanhol'
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS foreign_language text DEFAULT 'ingles';
