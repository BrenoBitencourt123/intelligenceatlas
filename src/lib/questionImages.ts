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

export async function uploadQuestionImage(file: File, userId: string, _index?: number): Promise<string> {
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

/**
 * Fonte de verdade única para normalizar imagens de uma questão.
 *
 * Prioriza o array `images` (formato canônico). Quando ele está vazio
 * ou ausente, usa o campo legado `imageUrl` como fallback, transformando
 * em `[{ url, order: 0 }]`.
 *
 * Aceita também o formato antigo onde `images` continha strings cruas
 * (ex.: `["https://..."]`), convertendo para objetos.
 */
export function normalizeQuestionImages(
  images: unknown,
  imageUrl?: string | null,
): QuestionImage[] {
  if (Array.isArray(images)) {
    const parsed = images
      .map((img, index) => {
        if (typeof img === 'string' && img.trim()) {
          return { url: img.trim(), order: index } as QuestionImage;
        }
        if (!img || typeof img !== 'object') return null;
        const value = img as Record<string, unknown>;
        if (typeof value.url !== 'string' || !value.url.trim()) return null;
        return {
          url: value.url.trim(),
          caption: typeof value.caption === 'string' ? value.caption : undefined,
          order: typeof value.order === 'number' ? value.order : index,
          local: typeof value.local === 'boolean' ? value.local : undefined,
        } as QuestionImage;
      })
      .filter(Boolean) as QuestionImage[];

    if (parsed.length > 0) return parsed;
  }

  if (imageUrl && imageUrl.trim()) {
    return [{ url: imageUrl.trim(), order: 0 }];
  }

  return [];
}
