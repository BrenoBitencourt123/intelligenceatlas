ALTER TABLE questions DROP CONSTRAINT questions_user_year_number_unique;

-- Criar nova constraint que inclui foreign_language para suportar bilíngue
CREATE UNIQUE INDEX questions_user_year_number_lang_unique 
ON questions (user_id, number, year, COALESCE(foreign_language, ''));