import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useExamPdf(year: number | undefined, day?: number) {
  const pdfUrl = useMemo(() => {
    if (!year) return null;
    const path = `${year}/dia-${day ?? 1}.pdf`;
    const { data } = supabase.storage.from('exam-pdfs').getPublicUrl(path);
    return data?.publicUrl ?? null;
  }, [year, day]);

  return pdfUrl;
}
