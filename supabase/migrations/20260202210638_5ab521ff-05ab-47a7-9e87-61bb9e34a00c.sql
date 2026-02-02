-- Create token_usage table for tracking API costs
CREATE TABLE public.token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  operation_type TEXT NOT NULL, -- 'analyze-block' ou 'improve-essay'
  block_type TEXT, -- 'introduction', 'development', 'conclusion' ou null
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost_usd NUMERIC(10, 6) NOT NULL
);

-- Create index for faster queries by date and operation type
CREATE INDEX idx_token_usage_created_at ON public.token_usage(created_at DESC);
CREATE INDEX idx_token_usage_operation_type ON public.token_usage(operation_type);