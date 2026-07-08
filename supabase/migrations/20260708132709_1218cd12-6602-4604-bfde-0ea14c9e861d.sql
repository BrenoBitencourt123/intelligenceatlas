DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'question_images_authenticated_insert'
  ) THEN
    CREATE POLICY "question_images_authenticated_insert"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'question-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'question_images_authenticated_update'
  ) THEN
    CREATE POLICY "question_images_authenticated_update"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'question-images')
      WITH CHECK (bucket_id = 'question-images');
  END IF;
END $$;