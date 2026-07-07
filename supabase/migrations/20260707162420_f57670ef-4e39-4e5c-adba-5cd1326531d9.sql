UPDATE public.questions SET area = CASE
  WHEN area ILIKE 'Matemática%' THEN 'matematica'
  WHEN area ILIKE 'Linguagens%' THEN 'linguagens'
  WHEN area ILIKE 'Ciências da Natureza%' THEN 'natureza'
  WHEN area ILIKE 'Ciências Humanas%' THEN 'humanas'
  ELSE area
END
WHERE exam = 'ufu' AND area NOT IN ('matematica','linguagens','natureza','humanas');