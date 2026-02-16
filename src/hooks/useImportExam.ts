import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { QuestionImage, uploadQuestionImage, validateQuestionImageFile } from '@/lib/questionImages';

export interface ImportedQuestion {
  number: number;
  area: string;
  topic?: string;
  subtopic?: string;
  difficulty?: 1 | 2 | 3;
  skills?: string[];
  statement: string;
  alternatives: { letter: string; text: string; image_url?: string | null }[];
  correct_answer: string | null;
  explanation: string | null;
  tags: string[];
  images: QuestionImage[];
  requires_image?: boolean;
  image_reason?: string | null;
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
let pendingQuestionImageFiles: Map<string, { file: File; previewUrl: string }[]> = new Map();
let pendingAlternativeImageFiles: Map<string, { letter: string; file: File; previewUrl: string }[]> = new Map();

type Stage = 'upload' | 'preview' | 'confirm';
const EXTRACTION_PROGRESS_WEIGHT = 30;
const AI_PROGRESS_WEIGHT = 70;
const REQUEST_TIMEOUT_MS = 4 * 60 * 1000;
const CHUNK_BATCH_SIZE = 2;
const CHUNK_RETRIES = 2;

function getQuestionKey(day: number, number: number) {
  return `${day}-${number}`;
}

function getAlternativeKey(day: number, number: number) {
  return `${day}-${number}`;
}

function normalizeArea(area: string): string {
  if (!area) return 'linguagens';

  const lower = area.toLowerCase();
  if (lower.includes('human')) return 'humanas';
  if (lower.includes('natureza')) return 'natureza';
  if (lower.includes('matemat')) return 'matematica';
  if (['linguagens', 'humanas', 'natureza', 'matematica'].includes(lower)) return lower;
  return 'linguagens';
}

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
    const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    return letterCount > trimmed.length * 0.15 || trimmed.length < 10;
  }).join('\n');
  return cleaned.trim();
}

function splitTextIntoChunks(text: string, maxChunkSize = 12000): string[] {
  // Split on question boundaries (QUESTAO XX) to never cut a question in half
  const questionPattern = /(?=QUEST[AO]\s+\d+)/gi;
  const questionBlocks = text.split(questionPattern).filter(b => b.trim());

  // If no question markers found, fall back to line-based splitting
  if (questionBlocks.length <= 1) {
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
    if (currentChunk.trim()) chunks.push(currentChunk);
    return chunks;
  }

  // Group question blocks into chunks that fit within maxChunkSize
  const chunks: string[] = [];
  let currentChunk = '';
  for (const block of questionBlocks) {
    if (currentChunk.length + block.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += block;
  }
  if (currentChunk.trim()) chunks.push(currentChunk);
  return chunks;
}

function normalizeImages(images: unknown): QuestionImage[] {
  if (!Array.isArray(images)) return [];

  return images
    .map((img, index) => {
      if (typeof img === 'string') {
        return { url: img, order: index };
      }

      if (!img || typeof img !== 'object') return null;

      const value = img as Record<string, unknown>;
      if (typeof value.url !== 'string' || !value.url.trim()) return null;

      return {
        url: value.url.trim(),
        caption: typeof value.caption === 'string' ? value.caption : undefined,
        order: typeof value.order === 'number' ? value.order : index,
      };
    })
    .filter((img): img is NonNullable<typeof img> => img !== null) as QuestionImage[];
}

function inferImageRequirement(
  statement: string,
  alternatives: { letter: string; text: string; image_url?: string | null }[],
  aiRequiresImage?: boolean,
  aiReason?: string | null
) {
  if (aiRequiresImage) {
    return {
      requiresImage: true,
      imageReason: aiReason || 'IA indicou que a questao depende de elemento visual.',
    };
  }

  const text = `${statement}\n${alternatives.map((a) => a.text).join('\n')}`.toLowerCase();
  const imageHints = [
    'figura',
    'grafico',
    'gráfico',
    'tabela',
    'mapa',
    'esquema',
    'imagem',
    'ilustracao',
    'ilustração',
    'observe',
    'com base na figura',
    'de acordo com o grafico',
    'de acordo com o gráfico',
  ];

  const matched = imageHints.find((hint) => text.includes(hint));
  if (matched) {
    return {
      requiresImage: true,
      imageReason: `Detectado indicio textual ("${matched}") de dependencia visual.`,
    };
  }

  const hasAlternativeImage = alternatives.some((alt) => Boolean(alt.image_url));
  if (hasAlternativeImage) {
    return {
      requiresImage: true,
      imageReason: 'Alternativa com imagem anexada.',
    };
  }

  return { requiresImage: false, imageReason: null };
}

function parseImportedJson(jsonText: string): { year: number | null; questions: ImportedQuestion[] } {
  const parsed = JSON.parse(jsonText);
  const payload = Array.isArray(parsed) ? { questions: parsed, detected_year: null } : parsed;
  const inputQuestions = Array.isArray(payload?.questions) ? payload.questions : [];
  const detectedYear = typeof payload?.detected_year === 'number'
    ? payload.detected_year
    : (typeof payload?.year === 'number' ? payload.year : null);

  if (inputQuestions.length === 0) {
    throw new Error('JSON sem questions validas.');
  }

  const questions: ImportedQuestion[] = inputQuestions
    .map((item: any, index: number) => {
      const alternatives = Array.isArray(item.alternatives) ? item.alternatives : [];
      const safeAlternatives = alternatives
        .filter((alt: any) => alt && typeof alt.letter === 'string' && typeof alt.text === 'string')
        .map((alt: any) => ({
          letter: alt.letter.toUpperCase(),
          text: alt.text,
          image_url: typeof alt.image_url === 'string' ? alt.image_url : null,
        }));
      const statement = typeof item.statement === 'string' ? item.statement : '';
      const inferred = inferImageRequirement(
        statement,
        safeAlternatives,
        Boolean(item.requires_image),
        typeof item.image_reason === 'string' ? item.image_reason : null
      );

      const parsedNumber = Number(item.number);
      const number = Number.isFinite(parsedNumber) ? parsedNumber : index + 1;
      const correct = typeof item.correct_answer === 'string' ? item.correct_answer.toUpperCase() : null;
      const annulled = correct === 'ANULADA';

      return {
        number,
        day: typeof item.day === 'number' ? item.day : 1,
        area: normalizeArea(String(item.area || 'linguagens')),
        topic: typeof item.topic === 'string' && item.topic.trim() ? item.topic.trim() : 'Geral',
        subtopic: typeof item.subtopic === 'string' ? item.subtopic.trim() : '',
        difficulty: [1, 2, 3].includes(Number(item.difficulty)) ? Number(item.difficulty) as 1 | 2 | 3 : 2,
        skills: Array.isArray(item.skills) ? item.skills.filter((s: unknown) => typeof s === 'string') : [],
        statement,
        alternatives: safeAlternatives,
        correct_answer: annulled ? null : correct,
        explanation: typeof item.explanation === 'string' ? item.explanation : null,
        tags: Array.isArray(item.tags) ? item.tags.filter((t: unknown) => typeof t === 'string') : [],
        images: normalizeImages(item.images),
        requires_image: inferred.requiresImage,
        image_reason: inferred.imageReason,
        selected: true,
        annulled,
      } satisfies ImportedQuestion;
    });

  return { year: detectedYear, questions };
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
    .replace(/QUEST[AO]|GABARITO|INGLES|ESPANHOL|PORTUGUES|LINGUA/gi, '')
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

  // First capture explicit annulled patterns
  const annulledPatterns = cleaned.match(/(\d+)\s*[-.\s]?\s*(ANULAD[AO]|NULA)/g);
  if (annulledPatterns) {
    for (const p of annulledPatterns) {
      const match = p.match(/(\d+)\s*[-.\s]?\s*(ANULAD[AO]|NULA)/);
      if (match) {
        map[parseInt(match[1], 10)] = 'ANULADA';
      }
    }
  }

  const patterns = cleaned.match(/(\d+)\s*[-.\s]?\s*([A-EX*])(?=\d|\s|$)/g);
  if (patterns) {
    for (const p of patterns) {
      const match = p.match(/(\d+)\s*[-.\s]?\s*([A-EX*])/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!map[num]) {
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
  return match ? parseInt(match[1], 10) : null;
}

function buildChunkPayload(
  chunk: string,
  chunkIndex: number,
  totalChunks: number,
  year: number | null,
  day: number
) {
  return { chunk, chunkIndex, totalChunks, year, day };
}

async function requestChunk(
  fnUrl: string,
  headers: Record<string, string>,
  payload: ReturnType<typeof buildChunkPayload>
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const resp = await fetch(fnUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const bodyText = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${bodyText}`);
    }

    return await resp.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestChunkWithRetry(
  fnUrl: string,
  headers: Record<string, string>,
  payload: ReturnType<typeof buildChunkPayload>
) {
  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= CHUNK_RETRIES; attempt += 1) {
    try {
      return await requestChunk(fnUrl, headers, payload);
    } catch (err) {
      lastErr = err;
      if (attempt < CHUNK_RETRIES) {
        // Short backoff helps during transient gateway/AI spikes.
        await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
      }
    }
  }

  throw lastErr;
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

      // Count extraction steps (exam + optional answer key) for progress.
      const extractionSteps = activeDays.reduce((sum, dayUpload) => {
        return sum + 1 + (dayUpload.gabaritoFile ? 1 : 0);
      }, 0);
      let completedExtractionSteps = 0;

      // Count total chunks across all days for accurate progress
      const dayChunks: { day: number; chunks: string[]; gabaritoText: string }[] = [];

      for (const dayUpload of activeDays) {
        const { examFile, gabaritoFile, gabaritoText, day } = dayUpload;
        if (examFile) pendingPdfFiles.set(day, examFile);

        setLoadingMessage(`Dia ${day}: extraindo texto da prova...`);
        const examText = await extractTextFromPdf(examFile!);
        completedExtractionSteps += 1;
        setProgress(Math.round((completedExtractionSteps / extractionSteps) * EXTRACTION_PROGRESS_WEIGHT));
        if (!examText.trim()) {
          toast.error(`Dia ${day}: nao foi possivel extrair texto do PDF`);
          continue;
        }

        let answerKey = gabaritoText;
        if (gabaritoFile) {
          setLoadingMessage(`Dia ${day}: extraindo gabarito...`);
          const gabText = await extractTextFromPdf(gabaritoFile);
          completedExtractionSteps += 1;
          setProgress(Math.round((completedExtractionSteps / extractionSteps) * EXTRACTION_PROGRESS_WEIGHT));
          answerKey = gabText;
          if (!yearFromPdf) yearFromPdf = detectYearFromText(gabText);
        }

        const chunks = splitTextIntoChunks(examText);
        dayChunks.push({ day, chunks, gabaritoText: answerKey });
      }

      const totalChunkCount = dayChunks.reduce((sum, d) => sum + d.chunks.length, 0);
      let completedChunks = 0;

      for (const { day, chunks, gabaritoText: answerKeyText } of dayChunks) {
        setLoadingMessage(`Dia ${day}: IA analisando questoes (${chunks.length} partes)...`);

        // Process chunks in smaller batches to reduce gateway timeouts.
        const BATCH = CHUNK_BATCH_SIZE;
        const dayQuestionsList: any[] = [];

        for (let b = 0; b < chunks.length; b += BATCH) {
          const batch = chunks.slice(b, b + BATCH);
          const promises = batch.map(async (chunk, bIdx) => {
            const i = b + bIdx;
            try {
              return await requestChunkWithRetry(
                fnUrl,
                headers,
                buildChunkPayload(chunk, i, chunks.length, yearFromPdf, day)
              );
            } catch (err) {
              console.error(`Chunk ${i + 1} error:`, err);

              // Last-resort fallback: split chunk once and retry in 2 smaller calls.
              if (chunk.length > 4500) {
                const half = Math.floor(chunk.length / 2);
                const left = chunk.slice(0, half);
                const right = chunk.slice(half);
                try {
                  const [leftData, rightData] = await Promise.all([
                    requestChunkWithRetry(
                      fnUrl,
                      headers,
                      buildChunkPayload(left, i, chunks.length * 2, yearFromPdf, day)
                    ),
                    requestChunkWithRetry(
                      fnUrl,
                      headers,
                      buildChunkPayload(right, i + 1, chunks.length * 2, yearFromPdf, day)
                    ),
                  ]);

                  return {
                    questions: [...(leftData.questions || []), ...(rightData.questions || [])],
                    detected_year: leftData.detected_year || rightData.detected_year || null,
                  };
                } catch (fallbackErr) {
                  console.error(`Chunk ${i + 1} fallback failed:`, fallbackErr);
                }
              }

              return { questions: [], detected_year: null, error: String(err) };
            }
          });

          const results = await Promise.all(promises);
          for (const r of results) {
            if (r.detected_year && !yearFromPdf) yearFromPdf = r.detected_year;
            dayQuestionsList.push(...(r.questions || []));
          }
          completedChunks += batch.length;
          const extractionPart = EXTRACTION_PROGRESS_WEIGHT;
          const aiPart = Math.round((completedChunks / totalChunkCount) * AI_PROGRESS_WEIGHT);
          setProgress(Math.min(99, extractionPart + aiPart));
          setLoadingMessage(`Dia ${day}: ${completedChunks}/${totalChunkCount} partes processadas...`);
        }

        if (dayQuestionsList.length === 0) {
          toast.warning(`Dia ${day}: nenhuma questao encontrada`);
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
          const statement = typeof q.statement === 'string' ? q.statement : '';
          const alternatives = Array.isArray(q.alternatives) ? q.alternatives : [];
          const normalizedAlternatives = alternatives.map((alt: any) => ({
            letter: String(alt.letter || '').toUpperCase(),
            text: String(alt.text || ''),
            image_url: typeof alt.image_url === 'string' ? alt.image_url : null,
          }));
          const inferred = inferImageRequirement(
            statement,
            normalizedAlternatives,
            Boolean(q.requires_image),
            typeof q.image_reason === 'string' ? q.image_reason : null
          );

          return {
            number: q.number,
            area: normalizeArea(String(q.area || 'linguagens')),
            statement,
            alternatives: normalizedAlternatives,
            day,
            correct_answer: isAnnulled ? null : (keyMap[q.number] || null),
            annulled: isAnnulled,
            explanation: q.explanation || null,
            tags: Array.isArray(q.tags) ? q.tags : [],
            images: normalizeImages(q.images),
            requires_image: inferred.requiresImage,
            image_reason: inferred.imageReason,
            selected: !isAnnulled,
          };
        });

        allQuestions.push(...dayQuestions);
        toast.success(`Dia ${day}: ${dayQuestions.length} questoes extraidas`);
      }

      if (allQuestions.length === 0) {
        throw new Error('Nenhuma questao extraida de nenhum dia');
      }

      if (yearFromPdf) setDetectedYear(yearFromPdf);
      setQuestions(allQuestions);
      setStage('preview');
      setProgress(100);
    } catch (err: any) {
      console.error('Extract error:', err);
      toast.error(err.message || 'Erro ao extrair questoes');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }

  function processJsonImport(jsonText: string) {
    try {
      const { year, questions: parsedQuestions } = parseImportedJson(jsonText);
      setQuestions(parsedQuestions);
      setDetectedYear(year);
      setStage('preview');
      toast.success(`${parsedQuestions.length} questoes carregadas do JSON`);
    } catch (err: any) {
      toast.error(err.message || 'JSON invalido');
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

  function addQuestionImages(number: number, day: number, files: File[]) {
    if (files.length === 0) return;

    const key = getQuestionKey(day, number);
    const currentPending = pendingQuestionImageFiles.get(key) || [];
    const nextPending = [...currentPending];
    const previewImages: QuestionImage[] = [];

    for (const file of files) {
      try {
        validateQuestionImageFile(file);
      } catch (err: any) {
        toast.error(`Q${number}: ${err.message}`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      nextPending.push({ file, previewUrl });
      previewImages.push({ url: previewUrl, local: true, order: nextPending.length - 1 });
    }

    if (previewImages.length === 0) return;

    pendingQuestionImageFiles.set(key, nextPending);

    setQuestions(prev => prev.map(q => {
      if (q.number !== number || q.day !== day) return q;
      return {
        ...q,
        images: [...q.images, ...previewImages],
      };
    }));
  }

  function removeQuestionImage(number: number, day: number, imageIndex: number) {
    const question = questions.find(q => q.number === number && q.day === day);
    if (!question) return;

    const imageToRemove = question.images[imageIndex];
    if (!imageToRemove) return;

    updateQuestion(number, day, {
      images: question.images.filter((_, idx) => idx !== imageIndex),
    });

    if (!imageToRemove.local) return;

    const key = getQuestionKey(day, number);
    const pending = pendingQuestionImageFiles.get(key) || [];
    const pendingIndex = pending.findIndex((item) => item.previewUrl === imageToRemove.url);
    if (pendingIndex < 0) return;

    URL.revokeObjectURL(pending[pendingIndex].previewUrl);
    const nextPending = pending.filter((_, idx) => idx !== pendingIndex);

    if (nextPending.length === 0) pendingQuestionImageFiles.delete(key);
    else pendingQuestionImageFiles.set(key, nextPending);
  }

  function addAlternativeImage(number: number, day: number, letter: string, file: File) {
    try {
      validateQuestionImageFile(file);
    } catch (err: any) {
      toast.error(`Q${number}${letter}: ${err.message}`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const key = getAlternativeKey(day, number);
    const pending = pendingAlternativeImageFiles.get(key) || [];
    const filtered = pending.filter((item) => item.letter !== letter);
    pendingAlternativeImageFiles.set(key, [...filtered, { letter, file, previewUrl }]);

    setQuestions((prev) => prev.map((q) => {
      if (q.number !== number || q.day !== day) return q;
      return {
        ...q,
        alternatives: q.alternatives.map((alt) => (
          alt.letter === letter ? { ...alt, image_url: previewUrl } : alt
        )),
      };
    }));
  }

  function removeAlternativeImage(number: number, day: number, letter: string) {
    const key = getAlternativeKey(day, number);
    const pending = pendingAlternativeImageFiles.get(key) || [];
    const target = pending.find((item) => item.letter === letter);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
      const nextPending = pending.filter((item) => item.letter !== letter);
      if (nextPending.length === 0) pendingAlternativeImageFiles.delete(key);
      else pendingAlternativeImageFiles.set(key, nextPending);
    }

    setQuestions((prev) => prev.map((q) => {
      if (q.number !== number || q.day !== day) return q;
      return {
        ...q,
        alternatives: q.alternatives.map((alt) => (
          alt.letter === letter ? { ...alt, image_url: null } : alt
        )),
      };
    }));
  }

  async function saveQuestions(year: number) {
    if (!user) {
      toast.error('Faca login para importar questoes');
      return;
    }

    const selected = questions.filter(q => q.selected);
    if (selected.length === 0) {
      toast.error('Nenhuma questao selecionada');
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
        const rows = await Promise.all(batch.map(async (q) => {
          const questionId = crypto.randomUUID();
          const key = getQuestionKey(q.day, q.number);
          const pending = pendingQuestionImageFiles.get(key) || [];
          const pendingAlternative = pendingAlternativeImageFiles.get(getAlternativeKey(q.day, q.number)) || [];
          const uploadedUrls: string[] = [];

          for (let imageIndex = 0; imageIndex < pending.length; imageIndex += 1) {
            const publicUrl = await uploadQuestionImage(pending[imageIndex].file, questionId, imageIndex);
            uploadedUrls.push(publicUrl);
          }

          const persistedImages = (q.images || [])
            .filter((img) => img && !img.local && typeof img.url === 'string' && img.url.trim().length > 0)
            .map((img, index) => ({
              url: img.url,
              caption: img.caption,
              order: typeof img.order === 'number' ? img.order : index,
            }));

          const allImages = [
            ...persistedImages,
            ...uploadedUrls.map((url, index) => ({
              url,
              order: persistedImages.length + index,
            })),
          ];

          const uploadedAlternativeUrls = new Map<string, string>();
          for (let altIndex = 0; altIndex < pendingAlternative.length; altIndex += 1) {
            const alt = pendingAlternative[altIndex];
            const altUrl = await uploadQuestionImage(alt.file, `${questionId}-alt-${alt.letter}`, altIndex);
            uploadedAlternativeUrls.set(alt.letter, altUrl);
          }

          const normalizedAlternatives = q.alternatives.map((alt) => {
            const uploadedAltUrl = uploadedAlternativeUrls.get(alt.letter);
            const persistedAltUrl = typeof alt.image_url === 'string' && !alt.image_url.startsWith('blob:')
              ? alt.image_url
              : null;

            return {
              letter: alt.letter,
              text: alt.text,
              image_url: uploadedAltUrl || persistedAltUrl || null,
            };
          });

          if (!q.statement?.trim() && allImages.length === 0) {
            throw new Error(`Q${q.number} precisa de enunciado ou imagem.`);
          }

          return {
            id: questionId,
            number: q.number,
            area: q.area,
            topic: q.topic || 'Geral',
            subtopic: q.subtopic || '',
            difficulty: q.difficulty || 2,
            skills: (q.skills && q.skills.length > 0 ? q.skills : []),
            statement: q.statement || '',
            alternatives: normalizedAlternatives as any,
            correct_answer: q.annulled ? 'ANULADA' : (q.correct_answer || 'X'),
            year,
            user_id: user.id,
            explanation: q.explanation || null,
            tags: (q.tags && q.tags.length > 0 ? q.tags : []) as any,
            images: allImages as any,
          };
        }));

        const { error } = await supabase.from('questions').insert(rows);
        if (error) throw error;

        setProgress(Math.round(((i + 1) / batches.length) * 100));
      }

      toast.success(`${selected.length} questoes importadas com sucesso!`);
      setStage('upload');
      setQuestions([]);
      pendingPdfFiles.clear();

      for (const files of pendingQuestionImageFiles.values()) {
        for (const file of files) {
          URL.revokeObjectURL(file.previewUrl);
        }
      }
      pendingQuestionImageFiles.clear();
      for (const files of pendingAlternativeImageFiles.values()) {
        for (const file of files) {
          URL.revokeObjectURL(file.previewUrl);
        }
      }
      pendingAlternativeImageFiles.clear();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Erro ao salvar questoes');
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

    for (const files of pendingQuestionImageFiles.values()) {
      for (const file of files) {
        URL.revokeObjectURL(file.previewUrl);
      }
    }
    pendingQuestionImageFiles.clear();
    for (const files of pendingAlternativeImageFiles.values()) {
      for (const file of files) {
        URL.revokeObjectURL(file.previewUrl);
      }
    }
    pendingAlternativeImageFiles.clear();
  }

  return {
    stage,
    questions,
    loading,
    progress,
    detectedYear,
    loadingMessage,
    processUploads,
    processJsonImport,
    removeQuestion,
    updateArea,
    updateQuestion,
    addQuestionImages,
    removeQuestionImage,
    addAlternativeImage,
    removeAlternativeImage,
    saveQuestions,
    goToConfirm,
    goBack,
    reset,
  };
}
