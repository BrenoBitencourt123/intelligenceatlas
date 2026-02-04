-- Create table for storing WebAuthn passkey credentials
CREATE TABLE public.passkey_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;

-- Users can view their own passkeys
CREATE POLICY "Users can view own passkeys"
ON public.passkey_credentials
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own passkeys
CREATE POLICY "Users can insert own passkeys"
ON public.passkey_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own passkeys
CREATE POLICY "Users can delete own passkeys"
ON public.passkey_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own passkeys (for counter updates)
CREATE POLICY "Users can update own passkeys"
ON public.passkey_credentials
FOR UPDATE
USING (auth.uid() = user_id);