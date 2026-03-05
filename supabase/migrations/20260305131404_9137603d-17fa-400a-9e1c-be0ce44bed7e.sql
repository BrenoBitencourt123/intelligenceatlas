-- Drop potentially conflicting policies first, then recreate
DROP POLICY IF EXISTS "Allow public uploads to question-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from question-images" ON storage.objects;
DROP POLICY IF EXISTS "anon upload question-images" ON storage.objects;
DROP POLICY IF EXISTS "anon read question-images" ON storage.objects;

-- Recreate with permissive policies (not restrictive)
CREATE POLICY "Allow all uploads to question-images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'question-images');

CREATE POLICY "Allow all reads from question-images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'question-images');