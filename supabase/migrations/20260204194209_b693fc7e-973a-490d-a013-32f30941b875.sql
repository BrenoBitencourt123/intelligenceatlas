-- Add sources column to daily_themes table for premium feature
ALTER TABLE daily_themes 
ADD COLUMN sources jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN daily_themes.sources IS 'Array of sources: [{title, url, excerpt, type}]';