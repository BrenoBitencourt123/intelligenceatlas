
-- Remove anon INSERT/UPDATE on question-images (admin policies already exist)
DROP POLICY IF EXISTS question_images_anon_insert ON storage.objects;
DROP POLICY IF EXISTS question_images_anon_update ON storage.objects;

-- Restrict exam-pdfs uploads/updates to admin only
DROP POLICY IF EXISTS "Authenticated users can upload exam PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update exam PDFs" ON storage.objects;

CREATE POLICY "Admins can upload exam PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exam-pdfs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update exam PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'exam-pdfs' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'exam-pdfs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete exam PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'exam-pdfs' AND public.has_role(auth.uid(), 'admin'));
