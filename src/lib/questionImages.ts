import { supabase } from '@/integrations/supabase/client';

export interface QuestionImage {
  url: string;
  caption?: string;
  order: number;
  local?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateQuestionImageFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Tipo de arquivo não suportado: ${file.type}. Use JPEG, PNG, WebP ou GIF.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 5MB.`);
  }
}

export async function uploadQuestionImage(file: File, userId: string): Promise<string> {
  validateQuestionImageFile(file);

  const ext = file.name.split('.').pop() || 'png';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('question-images')
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(`Erro ao fazer upload: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('question-images')
    .getPublicUrl(path);

  return urlData.publicUrl;
}
