
CREATE OR REPLACE FUNCTION public.auto_set_question_day()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.area IN ('linguagens', 'humanas') THEN
    NEW.day := 1;
  ELSIF NEW.area IN ('natureza', 'matematica') THEN
    NEW.day := 2;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_set_question_day
BEFORE INSERT OR UPDATE OF area ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_question_day();
