-- Alterar default da coluna profiles.plan_type para 'free'
ALTER TABLE public.profiles 
ALTER COLUMN plan_type SET DEFAULT 'free';

-- Atualizar trigger para criar usuários como Free
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan_type)
  VALUES (new.id, new.email, 'free');
  RETURN new;
END;
$$;