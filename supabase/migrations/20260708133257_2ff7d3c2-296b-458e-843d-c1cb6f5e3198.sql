DROP POLICY IF EXISTS "question_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "question_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "question_images_admin_delete" ON storage.objects;

CREATE POLICY "question_images_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "question_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "question_images_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'admin'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'question_images_authenticated_select'
  ) THEN
    CREATE POLICY "question_images_authenticated_select"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'question-images');
  END IF;
END $$;