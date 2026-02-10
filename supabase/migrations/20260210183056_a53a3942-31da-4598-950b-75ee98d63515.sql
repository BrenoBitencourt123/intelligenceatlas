
-- Create bucket for exam PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-pdfs', 'exam-pdfs', true);

-- Allow public read access
CREATE POLICY "Exam PDFs are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'exam-pdfs');

-- Allow authenticated users to upload exam PDFs
CREATE POLICY "Authenticated users can upload exam PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exam-pdfs' AND auth.role() = 'authenticated');

-- Allow authenticated users to overwrite exam PDFs
CREATE POLICY "Authenticated users can update exam PDFs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'exam-pdfs' AND auth.role() = 'authenticated');
