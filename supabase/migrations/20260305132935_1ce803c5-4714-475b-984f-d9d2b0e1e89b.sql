-- Drop the expression-based index
DROP INDEX IF EXISTS questions_user_year_number_lang_unique;

-- Set default to empty string instead of NULL
ALTER TABLE questions ALTER COLUMN foreign_language SET DEFAULT '';

-- Create proper UNIQUE constraint on real columns
ALTER TABLE questions ADD CONSTRAINT questions_user_year_number_lang_unique
UNIQUE (user_id, number, year, foreign_language);