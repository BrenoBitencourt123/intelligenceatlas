import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useExamPdf(year: number | undefined, day?: number) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!year) {
      setPdfUrl(null);
      return;
    }

    let cancelled = false;
    const path = `${year}/dia-${day ?? 1}.pdf`;

    (async () => {
      // Try signed URL first (works for private buckets)
      const { data, error } = await supabase.storage
        .from('exam-pdfs')
        .createSignedUrl(path, 3600); // 1 hour

      if (!cancelled) {
        if (error || !data?.signedUrl) {
          setPdfUrl(null);
        } else {
          setPdfUrl(data.signedUrl);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [year, day]);

  return pdfUrl;
}
