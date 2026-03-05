CREATE POLICY "anon update questions"
ON questions FOR UPDATE TO anon
USING (true)
WITH CHECK (true);