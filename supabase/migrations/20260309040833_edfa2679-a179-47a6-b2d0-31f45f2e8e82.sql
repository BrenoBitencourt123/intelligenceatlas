-- Drop overly permissive policies on question-images
DROP POLICY IF EXISTS "Authenticated can delete question images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update question images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload question images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads to question-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads from question-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update question-images" ON storage.objects;

-- Create scoped policies for question-images (admins only for write operations)
CREATE POLICY "question_images_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'question-images');

CREATE POLICY "question_images_admin_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'question-images' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "question_images_admin_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'question-images' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "question_images_admin_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'question-images' 
  AND public.has_role(auth.uid(), 'admin')
);