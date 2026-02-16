-- Add support for multiple question images.
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Bucket for question images (idempotent).
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policy.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Question images are publicly viewable'
  ) THEN
    CREATE POLICY "Question images are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'question-images');
  END IF;
END $$;

-- Authenticated users can upload/update/delete question images.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated can upload question images'
  ) THEN
    CREATE POLICY "Authenticated can upload question images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'question-images' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated can update question images'
  ) THEN
    CREATE POLICY "Authenticated can update question images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'question-images' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated can delete question images'
  ) THEN
    CREATE POLICY "Authenticated can delete question images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'question-images' AND auth.role() = 'authenticated');
  END IF;
END $$;
