import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { QuestionImage, normalizeQuestionImages } from "@/lib/questionImages";

export interface SimuladoQuestion {
  id: string;
  number: number;
  area: string;
  topic: string;
  subtopic: string;
  statement: string;
  alternatives: { letter: string; text: string; image_url?: string | null }[];
  correct_answer: string;
  explanation: string | null;
  tags: string[];
  image_url: string | null;
  images: QuestionImage[];
  year: number;
  day: number;
}

export interface SimuladoAnswer {
  selected: string | null;
  correct: boolean;
  area: string;
}

export interface SimuladoResult {
  total: number;
  correct: number;
  durationMinutes: number;
  byArea: Record<string, { correct: number; total: number }>;
  year: number;
  day: number;
}

interface PersistedSimulado {
  year: number;
  day: number;
  questions: SimuladoQuestion[];
  currentIndex: number;
  answers: Record<number, SimuladoAnswer>;
  startTime: number;
}

export type SimuladoState = "idle" | "loading" | "active" | "result";

const STORAGE_KEY = "atlas_simulado_session";

function loadSavedSimulado(): PersistedSimulado | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSimulado;
  } catch {
    return null;
  }
}

function saveSimulado(data: PersistedSimulado) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function clearSavedSimulado() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function mapQuestion(raw: any): SimuladoQuestion {
  return {
    id: raw.id,
    number: raw.number,
    area: raw.area,
    topic: raw.topic ?? "Geral",
    subtopic: raw.subtopic ?? "",
    statement: raw.statement,
    alternatives: raw.alternatives as any,
    correct_answer: raw.correct_answer,
    explanation: raw.explanation,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    image_url: raw.image_url,
    images: normalizeQuestionImages(raw.images, raw.image_url),
    year: raw.year,
    day: raw.day,
  };
}

export function useSimuladoSession() {
  const { user } = useAuth();
  const [state, setState] = useState<SimuladoState>("idle");
  const [questions, setQuestions] = useState<SimuladoQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, SimuladoAnswer>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [meta, setMeta] = useState<{ year: number; day: number } | null>(null);
  const [result, setResult] = useState<SimuladoResult | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [savedMeta, setSavedMeta] = useState<{ year: number; day: number; currentIndex: number; total: number } | null>(null);

  // Detect saved simulado on mount
  useEffect(() => {
    const saved = loadSavedSimulado();
    if (saved && saved.questions?.length > 0) {
      setHasSaved(true);
      setSavedMeta({
        year: saved.year,
        day: saved.day,
        currentIndex: saved.currentIndex,
        total: saved.questions.length,
      });
    }
  }, []);

  const persist = useCallback(
    (override?: Partial<PersistedSimulado>) => {
      if (!meta) return;
      saveSimulado({
        year: meta.year,
        day: meta.day,
        questions,
        currentIndex,
        answers,
        startTime,
        ...override,
      });
    },
    [meta, questions, currentIndex, answers, startTime],
  );

  const startSimulado = useCallback(
    async (year: number, day: 1 | 2) => {
      if (!user) return;
      setState("loading");
      try {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("foreign_language")
          .eq("user_id", user.id)
          .maybeSingle();

        const userLang = (prefs?.foreign_language as string) || "ingles";
        const oppositeLanguage = userLang === "ingles" ? "espanhol" : "ingles";

        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("year", year)
          .eq("day", day)
          .not('correct_answer', 'is', null)
          .order("number", { ascending: true })
          .limit(200);

        if (error) throw error;
        if (!data || data.length === 0) {
          toast.error("Nenhuma questão disponível para este simulado");
          setState("idle");
          return;
        }

        const filtered = data.filter((q: any) => {
          if (!q.foreign_language) return true;
          return q.foreign_language !== oppositeLanguage;
        });

        const mapped = filtered.map(mapQuestion);

        const now = Date.now();
        setQuestions(mapped);
        setCurrentIndex(0);
        setAnswers({});
        setShowFeedback(false);
        setResult(null);
        setStartTime(now);
        setQuestionStartedAt(now);
        setMeta({ year, day });
        setState("active");

        saveSimulado({
          year,
          day,
          questions: mapped,
          currentIndex: 0,
          answers: {},
          startTime: now,
        });
        setHasSaved(true);
        setSavedMeta({ year, day, currentIndex: 0, total: mapped.length });
      } catch (err) {
        console.error("Error starting simulado:", err);
        toast.error("Erro ao iniciar simulado");
        setState("idle");
      }
    },
    [user],
  );

  const resumeSimulado = useCallback(() => {
    const saved = loadSavedSimulado();
    if (!saved || saved.questions.length === 0) {
      setHasSaved(false);
      setSavedMeta(null);
      return false;
    }
    setQuestions(saved.questions);
    setCurrentIndex(saved.currentIndex);
    setAnswers(saved.answers || {});
    setShowFeedback(false);
    setResult(null);
    setStartTime(saved.startTime);
    setQuestionStartedAt(Date.now());
    setMeta({ year: saved.year, day: saved.day });
    setState("active");
    return true;
  }, []);

  const pauseSimulado = useCallback(() => {
    persist();
    setState("idle");
    setShowFeedback(false);
  }, [persist]);

  const discardSavedSimulado = useCallback(() => {
    clearSavedSimulado();
    setHasSaved(false);
    setSavedMeta(null);
  }, []);

  const finishSimulado = useCallback(
    async (finalAnswers?: Record<number, SimuladoAnswer>) => {
      const useAnswers = finalAnswers ?? answers;
      const total = questions.length;
      const totalAnswered = Object.keys(useAnswers).length;
      const correct = Object.values(useAnswers).filter((a) => a.correct).length;
      const durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));

      const byArea: Record<string, { correct: number; total: number }> = {};
      Object.values(useAnswers).forEach((a) => {
        if (!byArea[a.area]) byArea[a.area] = { correct: 0, total: 0 };
        byArea[a.area].total += 1;
        if (a.correct) byArea[a.area].correct += 1;
      });

      const finalResult: SimuladoResult = {
        total: totalAnswered || total,
        correct,
        durationMinutes,
        byArea,
        year: meta?.year ?? 0,
        day: meta?.day ?? 1,
      };

      setResult(finalResult);
      setState("result");
      clearSavedSimulado();
      setHasSaved(false);
      setSavedMeta(null);

      if (user && meta) {
        supabase
          .from("study_sessions")
          .insert({
            user_id: user.id,
            area: "simulado",
            questions_answered: totalAnswered,
            correct_answers: correct,
            flashcards_reviewed: 0,
            duration_minutes: durationMinutes,
            session_date: new Date().toISOString().split("T")[0],
            is_extra: true,
          })
          .then(() => {});
      }
    },
    [answers, questions.length, startTime, meta, user],
  );

  const submitAnswer = useCallback(
    async (selectedLetter: string | null) => {
      const current = questions[currentIndex];
      if (!current || showFeedback) return;
      const isCorrect = selectedLetter === current.correct_answer;
      const timeSpentSec = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));

      const nextAnswers: Record<number, SimuladoAnswer> = {
        ...answers,
        [currentIndex]: { selected: selectedLetter, correct: isCorrect, area: current.area },
      };
      setAnswers(nextAnswers);
      setShowFeedback(true);
      saveSimulado({
        year: meta!.year,
        day: meta!.day,
        questions,
        currentIndex,
        answers: nextAnswers,
        startTime,
      });

      if (user) {
        // Record attempt with simulado_session flag (not extra_session) so it
        // stays out of daily metrics but is distinguishable from extras.
        supabase
          .from("question_attempts")
          .insert({
            user_id: user.id,
            question_id: current.id,
            selected_answer: selectedLetter,
            is_correct: isCorrect,
            response_time_ms: timeSpentSec * 1000,
            session_date: new Date().toISOString().split("T")[0],
            simulado_session: true,
          })
          .then(() => {});

        supabase
          .from("user_question_history")
          .insert({
            user_id: user.id,
            question_id: current.id,
            answer: selectedLetter ?? "dont_know",
            is_correct: isCorrect,
            time_spent_sec: timeSpentSec,
            attempted_at: new Date().toISOString(),
          })
          .then(() => {});
      }
    },
    [questions, currentIndex, showFeedback, questionStartedAt, answers, meta, startTime, user],
  );

  const nextQuestion = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      finishSimulado();
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setShowFeedback(false);
    setQuestionStartedAt(Date.now());
    saveSimulado({
      year: meta!.year,
      day: meta!.day,
      questions,
      currentIndex: nextIndex,
      answers,
      startTime,
    });
  }, [currentIndex, questions, meta, answers, startTime, finishSimulado]);

  const exitToSelection = useCallback(() => {
    setState("idle");
  }, []);

  return {
    state,
    questions,
    currentIndex,
    totalQuestions: questions.length,
    currentQuestion: questions[currentIndex] ?? null,
    showFeedback,
    answers,
    meta,
    result,
    hasSaved,
    savedMeta,
    startSimulado,
    resumeSimulado,
    pauseSimulado,
    discardSavedSimulado,
    submitAnswer,
    nextQuestion,
    finishSimulado,
    exitToSelection,
  };
}
