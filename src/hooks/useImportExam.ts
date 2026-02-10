import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ImportedQuestion {
  number: number;
  area: string;
  statement: string;
  alternatives: { letter: string; text: string }[];
  correct_answer: string | null;
  selected: boolean;
}

type Stage = 'upload' | 'preview' | 'confirm';

export function useImportExam() {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>('upload');
  const [questions, setQuestions] = useState<ImportedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [day, setDay] = useState<number>(1);

  function parseAnswerKey(text: string): Record<number, string> {
    const map: Record<number, string> = {};
    const cleaned = text.trim().toUpperCase();

    // Format: "DACBE..." (sequential letters)
    if (/^[A-E]+$/.test(cleaned.replace(/\s/g, ''))) {
      const letters = cleaned.replace(/\s/g, '');
      for (let i = 0; i < letters.length; i++) {
        map[i + 1] = letters[i];
      }
      return map;
    }

    // Format: "1-D, 2-A, 3-C" or "1D 2A 3C" or "1-D 2-A" or "1.D, 2.A"
    const patterns = cleaned.match(/(\d+)\s*[-.\s]?\s*([A-E])/g);
    if (patterns) {
      for (const p of patterns) {
        const match = p.match(/(\d+)\s*[-.\s]?\s*([A-E])/);
        if (match) {
          map[parseInt(match[1])] = match[2];
        }
      }
    }

    return map;
  }

  function applyAnswerKey(qs: ImportedQuestion[], answerKeyText: string): ImportedQuestion[] {
    const keyMap = parseAnswerKey(answerKeyText);
    return qs.map(q => ({
      ...q,
      correct_answer: keyMap[q.number] || null,
    }));
  }

  async function extractFromPdf(file: File, examYear: number, examDay: number, answerKeyText: string) {
    setLoading(true);
    try {
      // Extract text from PDF using pdfjs-dist
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      if (!fullText.trim()) {
        throw new Error('Não foi possível extrair texto do PDF. Verifique se o arquivo não é uma imagem escaneada.');
      }

      toast.info(`Texto extraído (${Math.round(fullText.length / 1024)}KB). Enviando para IA...`);

      // Send to edge function
      const { data, error } = await supabase.functions.invoke('parse-exam-pdf', {
        body: { pdfText: fullText, year: examYear, day: examDay },
      });

      if (error) throw new Error(error.message || 'Erro ao processar PDF');

      if (!data?.questions || data.questions.length === 0) {
        throw new Error('Nenhuma questão encontrada no PDF.');
      }

      let importedQuestions: ImportedQuestion[] = data.questions.map((q: any) => ({
        ...q,
        correct_answer: null,
        selected: true,
      }));

      // Apply answer key if provided
      if (answerKeyText.trim()) {
        importedQuestions = applyAnswerKey(importedQuestions, answerKeyText);
      }

      setQuestions(importedQuestions);
      setYear(examYear);
      setDay(examDay);
      setStage('preview');
      toast.success(`${importedQuestions.length} questões extraídas!`);
    } catch (err: any) {
      console.error('Extract error:', err);
      toast.error(err.message || 'Erro ao extrair questões do PDF');
    } finally {
      setLoading(false);
    }
  }

  function removeQuestion(number: number) {
    setQuestions(prev => prev.map(q => 
      q.number === number ? { ...q, selected: !q.selected } : q
    ));
  }

  function updateArea(number: number, newArea: string) {
    setQuestions(prev => prev.map(q =>
      q.number === number ? { ...q, area: newArea } : q
    ));
  }

  async function saveQuestions() {
    if (!user) {
      toast.error('Faça login para importar questões');
      return;
    }

    const selected = questions.filter(q => q.selected);
    if (selected.length === 0) {
      toast.error('Nenhuma questão selecionada');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const batchSize = 20;
      const batches = [];
      for (let i = 0; i < selected.length; i += batchSize) {
        batches.push(selected.slice(i, i + batchSize));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const rows = batch.map(q => ({
          number: q.number,
          area: q.area,
          statement: q.statement,
          alternatives: q.alternatives as any,
          correct_answer: q.correct_answer || 'X',
          year: year,
          user_id: user.id,
          tags: [] as any,
        }));

        const { error } = await supabase.from('questions').insert(rows);
        if (error) throw error;

        setProgress(Math.round(((i + 1) / batches.length) * 100));
      }

      toast.success(`${selected.length} questões importadas com sucesso!`);
      setStage('upload');
      setQuestions([]);
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Erro ao salvar questões');
    } finally {
      setLoading(false);
    }
  }

  function goToConfirm() {
    setStage('confirm');
  }

  function goBack() {
    if (stage === 'confirm') setStage('preview');
    else if (stage === 'preview') setStage('upload');
  }

  function reset() {
    setStage('upload');
    setQuestions([]);
    setProgress(0);
  }

  return {
    stage,
    questions,
    loading,
    progress,
    year,
    day,
    extractFromPdf,
    removeQuestion,
    updateArea,
    saveQuestions,
    goToConfirm,
    goBack,
    reset,
    parseAnswerKey,
  };
}
