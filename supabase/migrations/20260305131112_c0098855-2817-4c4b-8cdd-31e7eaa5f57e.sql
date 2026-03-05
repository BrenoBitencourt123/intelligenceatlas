CREATE POLICY "Allow public uploads to question-images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'question-images');

CREATE POLICY "Allow public read from question-images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'question-images');