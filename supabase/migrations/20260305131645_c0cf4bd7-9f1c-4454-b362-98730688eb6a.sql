ALTER TABLE questions
ADD CONSTRAINT questions_user_year_number_unique 
UNIQUE (user_id, number, year);