-- Add flexible_quota column to profiles
-- When true, user can use all monthly credits without daily limit
ALTER TABLE public.profiles 
ADD COLUMN flexible_quota boolean NOT NULL DEFAULT false;