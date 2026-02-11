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
  explanation: string | null;
  tags: string[];
  selected: boolean;
  day: number;
  annulled: boolean;
}

export interface DayUpload {
  examFile: File | null;
  gabaritoFile: File | null;
  gabaritoText: string;
  day: number;
}

// Store original PDF files for upload during save
let pendingPdfFiles: Map<number, File> = new Map();

type Stage = 'upload' | 'preview' | 'confirm';

function cleanPdfText(text: string): string {
  // Remove repeated watermarks like "ENEM2025ENEM2025..."
  let cleaned = text.replace(/(ENEM\d{4}){2,}/g, '');
  // Remove repeated patterns like "2025ENEM" chains
  cleaned = cleaned.replace(/(\d{4}ENEM){2,}/g, '');
  // Remove page markers like "*010175AZ1*"
  cleaned = cleaned.replace(/\*\d+[A-Z]+\d*\*/g, '');
  // Collapse excessive whitespace
  cleaned = cleaned.replace(/\s{3,}/g, ' ');
  // Remove lines that are only whitespace or garbage chars
  cleaned = cleaned.split('\n').filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    // Skip lines that are mostly non-letter characters (watermarks/noise)
    const letterCount = (trimmed.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    return letterCount > trimmed.length * 0.15 || trimmed.length < 10;
  }).join('\n');
  return cleaned.trim();
}

function splitTextIntoChunks(text: string, maxChunkSize = 30000): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';
  for (const line of lines) {
    if (currentChunk.length + line.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk);
  }
  return chunks;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return cleanPdfText(fullText);
}

function parseAnswerKey(text: string): Record<number, string> {
  const map: Record<number, string> = {};
  const cleaned = text
    .replace(/QUEST[ÃA]O|GABARITO|INGL[ÊE]S|ESPANHOL|PORTUGU[ÊE]S|L[ÍI]NGUA/gi, '')
    .trim()
    .toUpperCase();

  // Format: "DACBE..." (sequential letters/annulled markers)
  const compacted = cleaned.replace(/\s/g, '');
  if (/^[A-EX*]+$/.test(compacted)) {
    for (let i = 0; i < compacted.length; i++) {
      const ch = compacted[i];
      map[i + 1] = (ch === 'X' || ch === '*') ? 'ANULADA' : ch;
    }
    return map;
  }

  // Format: "1-D, 2-A, 3-C" or "1D 2A 3C" or tabular PDF (including annulled)
  // First try to capture annulled patterns like "91 ANULADA", "91 X", "91 *"
  const annulledPatterns = cleaned.match(/(\d+)\s*[-.\s]?\s*(ANULAD[AO]|NULA)/g);
  if (annulledPatterns) {
    for (const p of annulledPatterns) {
      const match = p.match(/(\d+)\s*[-.\s]?\s*(ANULAD[AO]|NULA)/);
      if (match) {
        map[parseInt(match[1])] = 'ANULADA';
      }
    }
  }

  const patterns = cleaned.match(/(\d+)\s*[-.\s]?\s*([A-EX*])(?=\d|\s|$)/g);
  if (patterns) {
    for (const p of patterns) {
      const match = p.match(/(\d+)\s*[-.\s]?\s*([A-EX*])/);
      if (match) {
        const num = parseInt(match[1]);
        if (!map[num]) { // don't overwrite ANULADA already set
          const ch = match[2];
          map[num] = (ch === 'X' || ch === '*') ? 'ANULADA' : ch;
        }
      }
    }
  }

  return map;
}

function detectYearFromText(text: string): number | null {
  const match = text.match(/(?:Gabarito|GABARITO|ENEM|enem)\s*(\d{4})/i);
  return match ? parseInt(match[1]) : null;
}

export function useImportExam() {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>('upload');
  const [questions, setQuestions] = useState<ImportedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectedYear, setDetectedYear] = useState<number | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  async function processUploads(days: DayUpload[]) {
    const activeDays = days.filter(d => d.examFile);
    if (activeDays.length === 0) {
      toast.error('Selecione pelo menos um PDF de prova');
      return;
    }

    setLoading(true);
    setLoadingMessage('Extraindo texto dos PDFs...');
    setProgress(0);

    try {
      const allQuestions: ImportedQuestion[] = [];
      let yearFromPdf: number | null = null;
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-exam-pdf`;
      const session = (await supabase.auth.getSession()).data.session;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };

      // Count total chunks across all days for accurate progress
      const dayChunks: { day: number; chunks: string[]; gabaritoText: string }[] = [];
      
      for (const dayUpload of activeDays) {
        const { examFile, gabaritoFile, gabaritoText, day } = dayUpload;
        if (examFile) pendingPdfFiles.set(day, examFile);

        setLoadingMessage(`Dia ${day}: extraindo texto da prova...`);
        const examText = await extractTextFromPdf(examFile!);
        if (!examText.trim()) {
          toast.error(`Dia ${day}: não foi possível extrair texto do PDF`);
          continue;
        }

        let answerKey = gabaritoText;
        if (gabaritoFile) {
          setLoadingMessage(`Dia ${day}: extraindo gabarito...`);
          const gabText = await extractTextFromPdf(gabaritoFile);
          answerKey = gabText;
          if (!yearFromPdf) yearFromPdf = detectYearFromText(gabText);
        }

        const chunks = splitTextIntoChunks(examText);
        dayChunks.push({ day, chunks, gabaritoText: answerKey });
      }

      const totalChunkCount = dayChunks.reduce((sum, d) => sum + d.chunks.length, 0);
      let completedChunks = 0;

      for (const { day, chunks, gabaritoText: answerKeyText } of dayChunks) {
        setLoadingMessage(`Dia ${day}: IA analisando questões (${chunks.length} partes)...`);

        // Process chunks in parallel batches of 3 to avoid rate limits
        const BATCH = 3;
        const dayQuestionsList: any[] = [];

        for (let b = 0; b < chunks.length; b += BATCH) {
          const batch = chunks.slice(b, b + BATCH);
          const promises = batch.map(async (chunk, bIdx) => {
            const i = b + bIdx;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3 * 60 * 1000);
            try {
              const resp = await fetch(fnUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ chunk, chunkIndex: i, totalChunks: chunks.length, year: yearFromPdf, day }),
                signal: controller.signal,
              });
              clearTimeout(timeoutId);
              if (!resp.ok) {
                console.error(`Chunk ${i + 1} failed:`, await resp.text());
                return { questions: [], detected_year: null };
              }
              return await resp.json();
            } catch (err) {
              clearTimeout(timeoutId);
              console.error(`Chunk ${i + 1} error:`, err);
              return { questions: [], detected_year: null };
            }
          });

          const results = await Promise.all(promises);
          for (const r of results) {
            if (r.detected_year && !yearFromPdf) yearFromPdf = r.detected_year;
            dayQuestionsList.push(...(r.questions || []));
          }
          completedChunks += batch.length;
          setProgress(Math.round((completedChunks / totalChunkCount) * 100));
          setLoadingMessage(`Dia ${day}: ${completedChunks}/${totalChunkCount} partes processadas...`);
        }

        if (dayQuestionsList.length === 0) {
          toast.warning(`Dia ${day}: nenhuma questão encontrada`);
          continue;
        }

        // Deduplicate within day
        const seen = new Set<number>();
        const uniqueDayQuestions = dayQuestionsList.filter((q: any) => {
          if (seen.has(q.number)) return false;
          seen.add(q.number);
          return true;
        });

        const keyMap = answerKeyText.trim() ? parseAnswerKey(answerKeyText) : {};
        const dayQuestions: ImportedQuestion[] = uniqueDayQuestions.map((q: any) => {
          const isAnnulled = keyMap[q.number] === 'ANULADA';
          return {
            ...q,
            day,
            correct_answer: isAnnulled ? null : (keyMap[q.number] || null),
            annulled: isAnnulled,
            explanation: q.explanation || null,
            tags: Array.isArray(q.tags) ? q.tags : [],
            selected: !isAnnulled,
          };
        });

        allQuestions.push(...dayQuestions);
        toast.success(`Dia ${day}: ${dayQuestions.length} questões extraídas`);
      }

      if (allQuestions.length === 0) {
        throw new Error('Nenhuma questão extraída de nenhum dia');
      }

      if (yearFromPdf) setDetectedYear(yearFromPdf);
      setQuestions(allQuestions);
      setStage('preview');
    } catch (err: any) {
      console.error('Extract error:', err);
      toast.error(err.message || 'Erro ao extrair questões');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }

  function removeQuestion(number: number, day: number) {
    setQuestions(prev => prev.map(q =>
      q.number === number && q.day === day ? { ...q, selected: !q.selected } : q
    ));
  }

  function updateArea(number: number, day: number, newArea: string) {
    setQuestions(prev => prev.map(q =>
      q.number === number && q.day === day ? { ...q, area: newArea } : q
    ));
  }

  function updateQuestion(number: number, day: number, updates: Partial<ImportedQuestion>) {
    setQuestions(prev => prev.map(q =>
      q.number === number && q.day === day ? { ...q, ...updates } : q
    ));
  }

  async function saveQuestions(year: number) {
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
      // Upload pending PDF files to storage
      for (const [day, file] of pendingPdfFiles.entries()) {
        const path = `${year}/dia-${day}.pdf`;
        await supabase.storage.from('exam-pdfs').upload(path, file, { upsert: true });
      }

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
          correct_answer: q.annulled ? 'ANULADA' : (q.correct_answer || 'X'),
          year,
          user_id: user.id,
          explanation: q.explanation || null,
          tags: (q.tags && q.tags.length > 0 ? q.tags : []) as any,
        }));

        const { error } = await supabase.from('questions').insert(rows);
        if (error) throw error;

        setProgress(Math.round(((i + 1) / batches.length) * 100));
      }

      toast.success(`${selected.length} questões importadas com sucesso!`);
      setStage('upload');
      setQuestions([]);
      pendingPdfFiles.clear();
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
    setDetectedYear(null);
    pendingPdfFiles.clear();
  }

  return {
    stage,
    questions,
    loading,
    progress,
    detectedYear,
    loadingMessage,
    processUploads,
    removeQuestion,
    updateArea,
    updateQuestion,
    saveQuestions,
    goToConfirm,
    goBack,
    reset,
  };
}
