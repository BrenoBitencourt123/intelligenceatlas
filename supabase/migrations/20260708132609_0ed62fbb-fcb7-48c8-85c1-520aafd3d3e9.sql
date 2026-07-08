DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'question_images_anon_select'
  ) THEN
    CREATE POLICY "question_images_anon_select"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id = 'question-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'question_images_anon_insert'
  ) THEN
    CREATE POLICY "question_images_anon_insert"
      ON storage.objects
      FOR INSERT
      TO anon
      WITH CHECK (bucket_id = 'question-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'question_images_anon_update'
  ) THEN
    CREATE POLICY "question_images_anon_update"
      ON storage.objects
      FOR UPDATE
      TO anon
      USING (bucket_id = 'question-images')
      WITH CHECK (bucket_id = 'question-images');
  END IF;
END $$;