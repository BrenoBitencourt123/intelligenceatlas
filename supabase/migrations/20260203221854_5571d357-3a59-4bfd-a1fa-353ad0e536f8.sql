-- Remove old constraint that only allows 'basic' and 'pro'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_plan_type_check;

-- Create new constraint including 'free'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_plan_type_check 
CHECK (plan_type IN ('free', 'basic', 'pro'));