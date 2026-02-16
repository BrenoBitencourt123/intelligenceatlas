import { supabase } from '@/integrations/supabase/client';

export const QUESTION_IMAGE_BUCKET = 'question-images';
export const MAX_QUESTION_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export interface QuestionImage {
  url: string;
  caption?: string;
  order?: number;
  local?: boolean;
}

export function validateQuestionImageFile(file: File) {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error('Formato invalido. Use PNG, JPG ou WEBP.');
  }

  if (file.size > MAX_QUESTION_IMAGE_SIZE_BYTES) {
    throw new Error('Imagem maior que 5MB.');
  }
}

function getFileExtension(file: File): string {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function uploadQuestionImage(file: File, questionId: string, imageIndex: number) {
  validateQuestionImageFile(file);

  const extension = getFileExtension(file);
  const path = `${questionId}/${Date.now()}-${imageIndex}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(QUESTION_IMAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from(QUESTION_IMAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}
