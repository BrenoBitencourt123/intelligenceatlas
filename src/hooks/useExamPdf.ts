import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useExamPdf(year: number | undefined, day?: number) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!year) {
      setPdfUrl(null);
      return;
    }

    let cancelled = false;
    const path = `${year}/dia-${day ?? 1}.pdf`;

    (async () => {
      // Check if file exists by getting signed URL
      const { data, error } = await supabase.storage
        .from('exam-pdfs')
        .createSignedUrl(path, 3600);

      if (!cancelled) {
        if (error || !data?.signedUrl) {
          setPdfUrl(null);
        } else {
          // Store the signed URL internally - we'll download on demand
          setPdfUrl(data.signedUrl);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [year, day]);

  const openPdf = async () => {
    if (!pdfUrl) return;
    setLoading(true);
    try {
      // Fetch as blob to bypass ad blockers
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      // Revoke after a delay to allow the tab to load
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      // Fallback: try direct URL
      window.open(pdfUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return { available: !!pdfUrl, openPdf, loading };
}
