DROP POLICY IF EXISTS "question_images_authenticated_select" ON storage.objects;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'question_images_admin_select'
  ) THEN
    CREATE POLICY "question_images_admin_select"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;