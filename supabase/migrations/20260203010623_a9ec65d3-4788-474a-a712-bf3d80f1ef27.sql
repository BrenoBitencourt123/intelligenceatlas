-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  plan_type TEXT NOT NULL DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro')),
  plan_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create essays table
CREATE TABLE public.essays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  analysis JSONB,
  total_score INTEGER CHECK (total_score >= 0 AND total_score <= 1000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analyzed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Essays policies
CREATE POLICY "Users can view own essays" 
  ON public.essays FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own essays" 
  ON public.essays FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own essays" 
  ON public.essays FOR UPDATE 
  USING (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan_type)
  VALUES (new.id, new.email, 'basic');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better query performance
CREATE INDEX idx_essays_user_id ON public.essays(user_id);
CREATE INDEX idx_essays_analyzed_at ON public.essays(analyzed_at);