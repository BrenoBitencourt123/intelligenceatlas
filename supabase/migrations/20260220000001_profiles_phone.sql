-- Add phone field to profiles for lead contact
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;
