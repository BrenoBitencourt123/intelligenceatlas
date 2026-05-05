
-- Normalize areas for 2024 questions
UPDATE public.questions SET area = 'linguagens' WHERE year = 2024 AND area = 'Linguagens, Códigos e suas Tecnologias';
UPDATE public.questions SET area = 'humanas' WHERE year = 2024 AND area = 'Ciências Humanas e suas Tecnologias';
UPDATE public.questions SET area = 'natureza' WHERE year = 2024 AND area = 'Ciências da Natureza e suas Tecnologias';
UPDATE public.questions SET area = 'matematica' WHERE year = 2024 AND area = 'Matemática e suas Tecnologias';

-- Set day for 2024 questions: Dia 1 = linguagens + humanas, Dia 2 = natureza + matematica
UPDATE public.questions SET day = 1 WHERE year = 2024 AND area IN ('linguagens', 'humanas');
UPDATE public.questions SET day = 2 WHERE year = 2024 AND area IN ('natureza', 'matematica');
