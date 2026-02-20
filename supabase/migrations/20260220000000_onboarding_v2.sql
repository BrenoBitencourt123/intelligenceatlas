-- Onboarding v2: campos de perfil para onboarding multi-step + schedule semanal

-- profiles: marcar conclusão do onboarding e data-alvo do ENEM
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enem_target_date DATE;

-- user_preferences: áreas de foco, meta de questões e cronograma semanal
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS focus_areas TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS daily_questions_target INT DEFAULT 20,
  ADD COLUMN IF NOT EXISTS day_schedule JSONB DEFAULT '{}';
  -- day_schedule exemplo: {"monday":["matematica"],"tuesday":["humanas","natureza"],...}

-- Usuários existentes: marcar onboarding como concluído para não redirecionar
UPDATE profiles SET onboarding_completed = true WHERE onboarding_completed = false;
