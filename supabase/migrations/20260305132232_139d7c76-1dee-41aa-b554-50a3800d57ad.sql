CREATE POLICY "Allow anon update question-images"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'question-images')
WITH CHECK (bucket_id = 'question-images');