-- Normalize question images: copy legacy image_url into the images[] array
-- when images is empty/null. Preserves image_url for backward compatibility.
UPDATE public.questions
SET images = jsonb_build_array(
  jsonb_build_object('url', image_url, 'order', 0)
)
WHERE image_url IS NOT NULL
  AND image_url <> ''
  AND (images IS NULL OR jsonb_array_length(images) = 0);