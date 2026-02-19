-- ============================================================
-- Taxonomia v2: classificação automática de questões + mastery
-- Migração aditiva: não altera nem remove colunas existentes.
-- ============================================================

-- 1. Novas colunas na tabela questions
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS disciplina TEXT,
  ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cognitive_level TEXT
    CHECK (cognitive_level IN ('recordacao', 'compreensao', 'aplicacao', 'analise')),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS classifier_version TEXT,
  ADD COLUMN IF NOT EXISTS classified_at TIMESTAMPTZ;

-- Índices para filtros de admin e analytics
CREATE INDEX IF NOT EXISTS idx_questions_disciplina
  ON questions(disciplina);

CREATE INDEX IF NOT EXISTS idx_questions_needs_review
  ON questions(needs_review)
  WHERE needs_review = true;

CREATE INDEX IF NOT EXISTS idx_questions_classified_at
  ON questions(classified_at);

-- Índice GIN para busca dentro do array topics
CREATE INDEX IF NOT EXISTS idx_questions_topics_gin
  ON questions USING GIN (topics);

-- 2. Nova tabela user_mastery
-- Rastreia proficiência do aluno por dimensão (tópico, habilidade, combo)
-- com smoothing Bayesiano: mastery_score = (correct + 1) / (attempts + 2)
CREATE TABLE IF NOT EXISTS user_mastery (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dimension_type TEXT       NOT NULL CHECK (dimension_type IN ('topic', 'skill', 'topic_skill')),
  dimension_id  TEXT        NOT NULL,
  mastery_score NUMERIC(4,3) NOT NULL DEFAULT 0.500,
  attempts      INT         NOT NULL DEFAULT 0,
  correct       INT         NOT NULL DEFAULT 0,
  avg_time_sec  INT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dimension_type, dimension_id)
);

CREATE INDEX IF NOT EXISTS idx_user_mastery_user_type
  ON user_mastery(user_id, dimension_type);

CREATE INDEX IF NOT EXISTS idx_user_mastery_user_score
  ON user_mastery(user_id, mastery_score);

-- RLS: cada aluno vê e edita apenas os próprios registros
ALTER TABLE user_mastery ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_mastery' AND policyname = 'users_own_mastery'
  ) THEN
    CREATE POLICY "users_own_mastery"
      ON user_mastery
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;
