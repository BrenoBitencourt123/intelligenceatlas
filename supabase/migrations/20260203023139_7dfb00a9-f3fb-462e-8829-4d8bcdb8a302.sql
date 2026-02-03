-- 1. Corrigir política de token_usage: apenas admins podem ler
DROP POLICY IF EXISTS "Allow read access for token usage" ON public.token_usage;

CREATE POLICY "Only admins can view token usage"
ON public.token_usage
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Recriar política de profiles garantindo que é para authenticated
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);