import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { uploadQuestionImage, QuestionImage } from '@/lib/questionImages';

export interface QuestionNeedingImage {
  id: string;
  number: number;
  year: number | null;
  area: string;
  topic: string;
  subtopic: string | null;
  statement: string;
  image_reason: string | null;
  images: QuestionImage[];
}

export function useQuestionImageManager() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionNeedingImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const PAGE_SIZE = 20;

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('questions')
        .select('id, number, year, area, topic, subtopic, statement, image_reason, images', { count: 'exact' })
        .eq('requires_image', true)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order('year', { ascending: false })
        .order('number', { ascending: true });

      if (yearFilter) query = query.eq('year', yearFilter);
      if (areaFilter) query = query.eq('area', areaFilter);

      const { data, error, count } = await query;
      if (error) throw error;

      // Filter client-side: only questions without images
      const withoutImages = (data ?? []).filter(
        (q) => !q.images || (q.images as QuestionImage[]).length === 0
      );

      setQuestions(withoutImages as QuestionNeedingImage[]);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error('Erro ao buscar questões sem imagens:', err);
    } finally {
      setLoading(false);
    }
  }, [page, yearFilter, areaFilter]);

  const uploadAndSaveImages = useCallback(
    async (questionId: string, files: File[], captions: string[] = []) => {
      if (!user) return;
      setUploading((prev) => ({ ...prev, [questionId]: true }));
      try {
        const uploaded: QuestionImage[] = [];
        for (let i = 0; i < files.length; i++) {
          const url = await uploadQuestionImage(files[i], user.id, i);
          uploaded.push({ url, order: i, caption: captions[i] || undefined });
        }

        const { error } = await supabase
          .from('questions')
          .update({ images: uploaded })
          .eq('id', questionId);

        if (error) throw error;

        // Remove from local list since it now has images
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      } catch (err: any) {
        console.error('Erro ao fazer upload:', err);
        throw err;
      } finally {
        setUploading((prev) => ({ ...prev, [questionId]: false }));
      }
    },
    [user]
  );

  return {
    questions,
    loading,
    uploading,
    yearFilter,
    setYearFilter,
    areaFilter,
    setAreaFilter,
    page,
    setPage,
    totalCount,
    PAGE_SIZE,
    fetchQuestions,
    uploadAndSaveImages,
  };
}
