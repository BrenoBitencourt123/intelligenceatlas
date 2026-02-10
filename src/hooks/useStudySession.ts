import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Question {
  id: string;
  number: number;
  area: string;
  statement: string;
  alternatives: { letter: string; text: string }[];
  correct_answer: string;
  explanation: string | null;
  tags: string[];
  image_url: string | null;
  year: number;
}

interface SessionResult {
  total: number;
  correct: number;
  blocks: { correct: number; total: number }[];
  flashcardsGenerated: number;
  durationMinutes: number;
}

interface PersistedSession {
  questions: Question[];
  currentIndex: number;
  answers: Record<number, { selected: string | null; correct: boolean }>;
  startTime: number;
  flashcardsGenerated: number;
  area: string | null;
}

type SessionState = 'idle' | 'loading' | 'active' | 'result';

const STORAGE_KEY = 'atlas_study_session';

function saveToStorage(data: PersistedSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function loadFromStorage(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useStudySession() {
  const { user } = useAuth();
  const [state, setState] = useState<SessionState>('idle');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selected: string | null; correct: boolean }>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [flashcardsGenerated, setFlashcardsGenerated] = useState(0);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved && saved.questions.length > 0) {
      setQuestions(saved.questions);
      setCurrentIndex(saved.currentIndex);
      setAnswers(saved.answers);
      setStartTime(saved.startTime);
      setFlashcardsGenerated(saved.flashcardsGenerated);
      setState('active');
    }
  }, []);

  // Persist session state whenever it changes
  useEffect(() => {
    if (state === 'active' && questions.length > 0) {
      saveToStorage({
        questions,
        currentIndex,
        answers,
        startTime,
        flashcardsGenerated,
        area: questions[0]?.area ?? null,
      });
    }
  }, [state, questions, currentIndex, answers, startTime, flashcardsGenerated]);

  const currentQuestion = questions[currentIndex] ?? null;
  const currentBlock = Math.floor(currentIndex / 15);
  const blockLabels = ['Aquecimento', 'Aprendizado', 'Consolidação'];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? Math.round(((currentIndex + (showFeedback ? 1 : 0)) / totalQuestions) * 100) : 0;

  const startSession = useCallback(async (area: string | null, questionLimit?: number) => {
    if (!user) return;
    setState('loading');

    try {
      let query = supabase.from('questions').select('*');

      if (area && area !== 'mista') {
        query = query.eq('area', area);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('Nenhuma questão disponível para esta área');
        setState('idle');
        return;
      }

      const limit = questionLimit ?? 45;
      const shuffled = data.sort(() => Math.random() - 0.5).slice(0, limit);

      setQuestions(shuffled.map(q => ({
        id: q.id,
        number: q.number,
        area: q.area,
        statement: q.statement,
        alternatives: q.alternatives as any,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        tags: Array.isArray(q.tags) ? q.tags as string[] : [],
        image_url: q.image_url,
        year: q.year,
      })));
      setCurrentIndex(0);
      setAnswers({});
      setShowFeedback(false);
      setResult(null);
      setFlashcardsGenerated(0);
      setStartTime(Date.now());
      setState('active');
    } catch (err: any) {
      console.error('Error starting session:', err);
      toast.error('Erro ao iniciar sessão');
      setState('idle');
    }
  }, [user]);

  const generateFlashcard = useCallback(async (question: Question) => {
    if (!user) return;
    try {
      const correctAlt = question.alternatives.find(
        (a: any) => a.letter === question.correct_answer
      );
      const front = question.statement.length > 200
        ? question.statement.substring(0, 200) + '...'
        : question.statement;
      const back = `Resposta: ${question.correct_answer}${correctAlt ? ` - ${correctAlt.text}` : ''}${question.explanation ? `\n\n${question.explanation}` : ''}`;

      await supabase.from('flashcards').insert({
        user_id: user.id,
        front,
        back,
        source_type: 'question',
        source_id: question.id,
        area: question.area,
        next_review: new Date().toISOString().split('T')[0],
      });
      setFlashcardsGenerated(prev => prev + 1);
    } catch (err) {
      console.error('Error generating flashcard:', err);
    }
  }, [user]);

  const answerQuestion = useCallback(async (selectedLetter: string | null, autoFlashcard = true) => {
    if (!currentQuestion || showFeedback) return;

    const isCorrect = selectedLetter === currentQuestion.correct_answer;
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: { selected: selectedLetter, correct: isCorrect },
    }));
    setShowFeedback(true);

    // Record attempt
    if (user) {
      supabase.from('question_attempts').insert({
        user_id: user.id,
        question_id: currentQuestion.id,
        selected_answer: selectedLetter,
        is_correct: isCorrect,
        session_date: new Date().toISOString().split('T')[0],
      }).then(() => {});
    }

    // Auto-generate flashcard on wrong answer (only if plan allows)
    if (!isCorrect && autoFlashcard) {
      await generateFlashcard(currentQuestion);
    }
  }, [currentQuestion, currentIndex, showFeedback, user, generateFlashcard]);

  const nextQuestion = useCallback(async () => {
    if (currentIndex + 1 >= totalQuestions) {
      // Session complete
      const durationMinutes = Math.round((Date.now() - startTime) / 60000);
      const totalCorrect = Object.values(answers).filter(a => a.correct).length;

      // Calculate per-block results
      const blocks = [];
      const blockSize = 15;
      for (let b = 0; b < Math.ceil(totalQuestions / blockSize); b++) {
        const blockAnswers = Object.entries(answers)
          .filter(([idx]) => {
            const i = parseInt(idx);
            return i >= b * blockSize && i < (b + 1) * blockSize;
          })
          .map(([, a]) => a);
        blocks.push({
          correct: blockAnswers.filter(a => a.correct).length,
          total: blockAnswers.length,
        });
      }

      const sessionResult: SessionResult = {
        total: totalQuestions,
        correct: totalCorrect,
        blocks,
        flashcardsGenerated,
        durationMinutes: Math.max(1, durationMinutes),
      };

      setResult(sessionResult);
      setState('result');
      clearStorage();

      // Save study session
      if (user && currentQuestion) {
        supabase.from('study_sessions').insert({
          user_id: user.id,
          area: currentQuestion.area,
          questions_answered: totalQuestions,
          correct_answers: totalCorrect,
          flashcards_reviewed: 0,
          duration_minutes: Math.max(1, durationMinutes),
          session_date: new Date().toISOString().split('T')[0],
        }).then(() => {});
      }
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowFeedback(false);
    }
  }, [currentIndex, totalQuestions, answers, startTime, flashcardsGenerated, user, currentQuestion, showFeedback]);

  const resetSession = useCallback(() => {
    setState('idle');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setShowFeedback(false);
    setResult(null);
    setFlashcardsGenerated(0);
    clearStorage();
  }, []);

  return {
    state,
    currentQuestion,
    currentIndex,
    totalQuestions,
    currentBlock,
    blockLabels,
    progress,
    showFeedback,
    answers,
    result,
    startSession,
    answerQuestion,
    nextQuestion,
    resetSession,
  };
}
