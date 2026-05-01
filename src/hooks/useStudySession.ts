import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QuestionImage, normalizeQuestionImages } from "@/lib/questionImages";
import {
  computePriorityScore,
  nextReviewDateForLevel,
  normalizeDifficulty,
  normalizeSubtopic,
  normalizeTopic,
} from "@/lib/adaptiveStudy";

interface Question {
  id: string;
  number: number;
  area: string;
  topic: string;
  subtopic: string;
  difficulty: 1 | 2 | 3;
  skills: string[];
  statement: string;
  alternatives: { letter: string; text: string; image_url?: string | null }[];
  correct_answer: string | null;
  explanation: string | null;
  tags: string[];
  image_url: string | null;
  images: QuestionImage[];
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
  extraSession?: boolean;
}

interface PersistedDailyPlan {
  date: string;
  area: string | null;
  questionIds: string[];
}

type SessionState = "idle" | "loading" | "active" | "result";

const STORAGE_KEY = "atlas_study_session";
const EXTRA_STORAGE_KEY = "atlas_extra_session";
const DAILY_PLAN_KEY = "atlas_study_daily_plan";

const EXTRA_BATCH_SIZE = 20;
const EXTRA_PRELOAD_THRESHOLD = 3;

function saveToStorage(data: PersistedSession) {
  try {
    const key = data.extraSession ? EXTRA_STORAGE_KEY : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function loadFromStorage(): PersistedSession | null {
  try {
    const rawExtra = localStorage.getItem(EXTRA_STORAGE_KEY);
    if (rawExtra) return JSON.parse(rawExtra);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearStorage(extra = false) {
  if (extra) {
    localStorage.removeItem(EXTRA_STORAGE_KEY);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function todayDateKey() {
  return new Date().toISOString().split("T")[0];
}

function saveDailyPlan(data: PersistedDailyPlan) {
  try {
    localStorage.setItem(DAILY_PLAN_KEY, JSON.stringify(data));
  } catch {}
}

function loadDailyPlan(): PersistedDailyPlan | null {
  try {
    const raw = localStorage.getItem(DAILY_PLAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDailyPlan;
    if (!parsed?.date || !Array.isArray(parsed.questionIds)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// normalizeQuestionImages agora vem de @/lib/questionImages (fonte única).

function makeTopicKey(area: string, topic: string, subtopic?: string) {
  return `${area}::${normalizeTopic(topic)}::${normalizeSubtopic(subtopic)}`;
}

function shuffleArray<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

/**
 * Detect if a response was likely a guess based on reading time.
 * Uses ~240 wpm (~5 chars/word) as baseline reading speed.
 * Returns true if time spent is less than 40% of estimated reading time.
 */
function isLikelyGuess(
  statement: string,
  alternatives: { text: string }[],
  timeSpentSec: number,
): boolean {
  const totalChars = statement.length + alternatives.reduce((sum, a) => sum + (a.text?.length ?? 0), 0);
  const estimatedReadSec = Math.max(8, (totalChars / 5) / 4);
  return timeSpentSec < estimatedReadSec * 0.4;
}

type ProfileRow = {
  area: string;
  topic: string;
  subtopic: string;
  level: number;
  attempts: number;
  correct: number;
  next_review_at: string | null;
  last_attempt_at: string | null;
  priority_score: number;
};

const DIAGNOSTIC_QUESTIONS_PER_AREA = 20;

function buildExplorationSelection(input: Question[], limit: number): Question[] {
  if (input.length <= limit) return shuffleArray(input);

  const selected: Question[] = [];
  const selectedIds = new Set<string>();
  const subtopicCount = new Map<string, number>();
  const difficultyCount = { 1: 0, 2: 0, 3: 0 };
  const difficultyTarget = {
    1: Math.round(limit * 0.3),
    2: Math.round(limit * 0.5),
    3: limit - Math.round(limit * 0.3) - Math.round(limit * 0.5),
  };
  const maxPerSubtopic = 4;

  const byTopic = new Map<string, Question[]>();
  for (const question of shuffleArray(input)) {
    const key = makeTopicKey(question.area, question.topic, question.subtopic);
    const bucket = byTopic.get(key) ?? [];
    bucket.push(question);
    byTopic.set(key, bucket);
  }

  const topicKeys = shuffleArray([...byTopic.keys()]);
  let keepGoing = true;

  while (selected.length < limit && keepGoing) {
    keepGoing = false;

    for (const topicKey of topicKeys) {
      if (selected.length >= limit) break;
      const bucket = byTopic.get(topicKey);
      if (!bucket || bucket.length === 0) continue;
      keepGoing = true;

      const pickIndex = bucket.findIndex((q) => {
        const diff = normalizeDifficulty(q.difficulty);
        const subKey = makeTopicKey(q.area, q.topic, q.subtopic);
        return (
          !selectedIds.has(q.id) &&
          (subtopicCount.get(subKey) ?? 0) < maxPerSubtopic &&
          difficultyCount[diff] < difficultyTarget[diff]
        );
      });

      const fallbackIndex = bucket.findIndex((q) => {
        const subKey = makeTopicKey(q.area, q.topic, q.subtopic);
        return !selectedIds.has(q.id) && (subtopicCount.get(subKey) ?? 0) < maxPerSubtopic;
      });

      const indexToUse = pickIndex >= 0 ? pickIndex : fallbackIndex;
      if (indexToUse < 0) continue;

      const question = bucket.splice(indexToUse, 1)[0];
      if (selectedIds.has(question.id)) continue;

      const subKey = makeTopicKey(question.area, question.topic, question.subtopic);
      selected.push(question);
      selectedIds.add(question.id);
      subtopicCount.set(subKey, (subtopicCount.get(subKey) ?? 0) + 1);
      difficultyCount[normalizeDifficulty(question.difficulty)] += 1;
    }
  }

  if (selected.length < limit) {
    for (const question of shuffleArray(input)) {
      if (selected.length >= limit) break;
      if (selectedIds.has(question.id)) continue;
      selected.push(question);
      selectedIds.add(question.id);
    }
  }

  return selected.slice(0, limit);
}

function buildAdaptiveSelection(input: Question[], profiles: ProfileRow[], limit: number): Question[] {
  if (input.length <= limit) return shuffleArray(input);

  const profileMap = new Map<string, ProfileRow>();
  for (const profile of profiles) {
    profileMap.set(makeTopicKey(profile.area, profile.topic, profile.subtopic), profile);
  }

  const withPriority = shuffleArray(input).map((question) => {
    const key = makeTopicKey(question.area, question.topic, question.subtopic);
    const profile = profileMap.get(key);
    const priority = profile
      ? computePriorityScore({
          attempts: profile.attempts,
          correct: profile.correct,
          level: profile.level,
          nextReviewAt: profile.next_review_at,
          lastAttemptAt: profile.last_attempt_at,
        })
      : 0.75;

    const attempts = profile?.attempts ?? 0;
    const correct = profile?.correct ?? 0;
    const accuracy = attempts > 0 ? correct / attempts : 0;
    const level = profile?.level ?? 1;
    const overdue = Boolean(profile?.next_review_at && new Date(profile.next_review_at).getTime() <= Date.now());

    return {
      question,
      priority,
      accuracy,
      level,
      overdue,
      topicKey: `${question.area}::${question.topic}`,
      subKey: makeTopicKey(question.area, question.topic, question.subtopic),
      difficulty: normalizeDifficulty(question.difficulty),
    };
  });

  const weak = withPriority
    .filter((item) => item.level <= 1 || item.accuracy < 0.55 || item.priority >= 0.6)
    .sort((a, b) => b.priority - a.priority || Number(b.overdue) - Number(a.overdue));

  const maintenance = withPriority
    .filter((item) => item.level >= 3 && item.accuracy >= 0.75)
    .sort((a, b) => b.accuracy - a.accuracy || a.priority - b.priority);

  const middle = withPriority
    .filter((item) => !weak.includes(item) && !maintenance.includes(item))
    .sort((a, b) => b.priority - a.priority);

  const selected: Question[] = [];
  const selectedIds = new Set<string>();
  const topicCount = new Map<string, number>();
  const subtopicCount = new Map<string, number>();
  const maxSubtopic = 6;
  const tryAddRanked = (
    item: (typeof withPriority)[number],
    blockDiffCount?: { 1: number; 2: number; 3: number },
    blockDiffTarget?: { 1: number; 2: number; 3: number },
  ) => {
    if (selectedIds.has(item.question.id)) return false;
    if ((subtopicCount.get(item.subKey) ?? 0) >= maxSubtopic) return false;

    if (blockDiffCount && blockDiffTarget) {
      if (blockDiffCount[item.difficulty] >= blockDiffTarget[item.difficulty]) return false;
    }

    selected.push(item.question);
    selectedIds.add(item.question.id);
    topicCount.set(item.topicKey, (topicCount.get(item.topicKey) ?? 0) + 1);
    subtopicCount.set(item.subKey, (subtopicCount.get(item.subKey) ?? 0) + 1);
    if (blockDiffCount) blockDiffCount[item.difficulty] += 1;
    return true;
  };

  const warmTarget = Math.max(1, Math.round(limit * 0.25));
  const consTarget = Math.max(1, Math.round(limit * 0.25));
  const learnTarget = Math.max(0, limit - warmTarget - consTarget);

  const pickForBlock = (
    candidates: typeof withPriority,
    targetCount: number,
    diffTarget: { 1: number; 2: number; 3: number },
  ) => {
    const startLen = selected.length;
    const diffCount = { 1: 0, 2: 0, 3: 0 };

    // First pass: prioritize unseen topics to ensure diversity.
    for (const item of candidates) {
      if (selected.length - startLen >= targetCount) break;
      if (topicCount.has(item.topicKey)) continue;
      tryAddRanked(item, diffCount, diffTarget);
    }

    // Second pass: fill respecting difficulty target.
    for (const item of candidates) {
      if (selected.length - startLen >= targetCount) break;
      tryAddRanked(item, diffCount, diffTarget);
    }

    // Third pass: fill any remaining ignoring block difficulty target.
    for (const item of candidates) {
      if (selected.length - startLen >= targetCount) break;
      tryAddRanked(item);
    }
  };

  const warmCandidates = [
    ...maintenance.filter((i) => i.difficulty <= 2),
    ...middle.filter((i) => i.difficulty <= 2),
    ...weak.filter((i) => i.difficulty <= 2),
    ...withPriority,
  ];
  const learningCandidates = [...weak, ...middle, ...maintenance, ...withPriority];
  const consolidationCandidates = [
    ...[...weak, ...middle, ...maintenance].sort(
      (a, b) => Number(b.overdue) - Number(a.overdue) || b.difficulty - a.difficulty || b.priority - a.priority,
    ),
    ...withPriority,
  ];

  pickForBlock(warmCandidates, warmTarget, {
    1: Math.round(warmTarget * 0.6),
    2: warmTarget - Math.round(warmTarget * 0.6),
    3: 0,
  });
  pickForBlock(learningCandidates, learnTarget, {
    1: Math.round(learnTarget * 0.2),
    2: Math.round(learnTarget * 0.65),
    3: learnTarget - Math.round(learnTarget * 0.2) - Math.round(learnTarget * 0.65),
  });
  pickForBlock(consolidationCandidates, consTarget, {
    1: Math.round(consTarget * 0.1),
    2: Math.round(consTarget * 0.45),
    3: consTarget - Math.round(consTarget * 0.1) - Math.round(consTarget * 0.45),
  });

  const minTopics = Math.min(6, new Set(withPriority.map((item) => item.topicKey)).size);
  if (topicCount.size < minTopics) {
    for (const item of withPriority.sort((a, b) => b.priority - a.priority)) {
      if (topicCount.size >= minTopics) break;
      if (topicCount.has(item.topicKey)) continue;
      tryAddRanked(item);
    }
  }

  if (selected.length < limit) {
    for (const item of withPriority.sort((a, b) => b.priority - a.priority)) {
      if (selected.length >= limit) break;
      tryAddRanked(item);
    }
  }

  return selected.slice(0, limit);
}

export function useStudySession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>("idle");
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selected: string | null; correct: boolean }>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(0);
  const [flashcardsGenerated, setFlashcardsGenerated] = useState(0);
  const [extraSession, setExtraSession] = useState(false);
  const [extraArea, setExtraArea] = useState<string | null>(null);
  const [loadingMoreExtra, setLoadingMoreExtra] = useState(false);

  const mapQuestion = useCallback(
    (q: any): Question => ({
      id: q.id,
      number: q.number,
      area: q.area,
      topic: normalizeTopic(q.topic) === 'Geral' ? (q.disciplina || q.area) : normalizeTopic(q.topic),
      subtopic: normalizeSubtopic(q.subtopic),
      difficulty: normalizeDifficulty(q.difficulty),
      skills: Array.isArray(q.skills) ? (q.skills as string[]) : [],
      statement: q.statement,
      alternatives: q.alternatives as any,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      tags: Array.isArray(q.tags) ? (q.tags as string[]) : [],
      image_url: q.image_url,
      images: normalizeQuestionImages(q.images, q.image_url),
      year: q.year,
    }),
    [],
  );

  const syncTopicProfile = useCallback(
    async (params: { question: Question; selectedLetter: string | null; isCorrect: boolean; timeSpentSec: number; wasGuess?: boolean }) => {
      if (!user) return;
      const { question, selectedLetter, isCorrect, timeSpentSec, wasGuess = false } = params;
      const answer = selectedLetter ?? "dont_know";
      const nowIso = new Date().toISOString();

      // Guess multipliers: attenuate the impact on the algorithm
      const correctWeight = wasGuess ? 0.3 : 1;
      const wrongWeight = wasGuess ? 0.5 : 1;

      const { error: historyError } = await supabase.from("user_question_history").insert({
        user_id: user.id,
        question_id: question.id,
        answer,
        is_correct: isCorrect,
        time_spent_sec: timeSpentSec,
        attempted_at: nowIso,
      });

      if (historyError) {
        console.error("Error writing user_question_history:", historyError);
      }

      const profileFilter = {
        user_id: user.id,
        area: question.area,
        topic: normalizeTopic(question.topic),
        subtopic: normalizeSubtopic(question.subtopic),
      };

      const { data: existing, error: profileLoadError } = await supabase
        .from("user_topic_profile")
        .select("*")
        .match(profileFilter)
        .maybeSingle();

      if (profileLoadError) {
        console.error("Error loading user_topic_profile:", profileLoadError);
      }

      const attempts = (existing?.attempts ?? 0) + 1;
      const correct = (existing?.correct ?? 0) + (isCorrect ? correctWeight : 0);
      const dontKnowAnswer = selectedLetter === null;
      const wrong = (existing?.wrong ?? 0) + (!isCorrect ? wrongWeight : 0);
      const dontKnow = (existing?.dont_know ?? 0) + (dontKnowAnswer ? 1 : 0);

      let level = existing?.level ?? 1;
      let correctStreak = existing?.correct_streak ?? 0;

      if (isCorrect) {
        if (!wasGuess) {
          correctStreak += 1;
          if (correctStreak >= 3) {
            level = Math.min(3, level + 1);
            correctStreak = 0;
          }
        }
        // If it was a guess, don't increment streak
      } else {
        correctStreak = 0;
        if (dontKnowAnswer) {
          level = Math.max(0, level - 1);
        }
      }

      const accuracy = attempts > 0 ? correct / attempts : 0;
      if (attempts >= 6 && accuracy < 0.35) level = Math.max(0, level - 1);

      const nextReviewAt = nextReviewDateForLevel(level, { forceSoon: !isCorrect || dontKnowAnswer });
      const priorityScore = computePriorityScore({
        attempts,
        correct,
        level,
        nextReviewAt,
        lastAttemptAt: nowIso,
      });

      const { error: profileUpsertError } = await supabase.from("user_topic_profile").upsert(
        {
          ...profileFilter,
          level,
          attempts,
          correct,
          wrong,
          dont_know: dontKnow,
          correct_streak: correctStreak,
          last_attempt_at: nowIso,
          next_review_at: nextReviewAt,
          priority_score: priorityScore,
          updated_at: nowIso,
        },
        {
          onConflict: "user_id,area,topic,subtopic",
        },
      );

      if (profileUpsertError) {
        console.error("Error upserting user_topic_profile:", profileUpsertError);
      }

      // Update user_mastery for each standardized topic and skill (fire-and-forget)
      const stdTopics: string[] = Array.isArray((question as any).topics) ? (question as any).topics : [];
      const stdSkills: string[] = Array.isArray((question as any).skills) ? (question as any).skills : [];

      if (stdTopics.length > 0 || stdSkills.length > 0) {
        type DimType = "topic" | "skill" | "topic_skill";
        const masteryDims: Array<{ type: DimType; id: string }> = [
          ...stdTopics.map((t) => ({ type: "topic" as DimType, id: t })),
          ...stdSkills.map((s) => ({ type: "skill" as DimType, id: s })),
          // Limit topic×skill combos to avoid explosion (max 2 topics × 2 skills)
          ...stdTopics.slice(0, 2).flatMap((t) =>
            stdSkills.slice(0, 2).map((s) => ({ type: "topic_skill" as DimType, id: `${t}__${s}` }))
          ),
        ];

        (async () => {
          for (const dim of masteryDims) {
            try {
              const { data: ex } = await supabase
                .from("user_mastery")
                .select("attempts, correct, avg_time_sec")
                .eq("user_id", user.id)
                .eq("dimension_type", dim.type)
                .eq("dimension_id", dim.id)
                .maybeSingle();

              const newAttempts = (ex?.attempts ?? 0) + 1;
              const newCorrect = (ex?.correct ?? 0) + (isCorrect ? correctWeight : 0);
              // Bayesian smoothing: score = (correct + 1) / (attempts + 2)
              const masteryScore = (newCorrect + 1) / (newAttempts + 2);
              const newAvgTime = ex?.avg_time_sec
                ? Math.round((ex.avg_time_sec * (newAttempts - 1) + timeSpentSec) / newAttempts)
                : timeSpentSec;

              await supabase.from("user_mastery").upsert(
                {
                  user_id: user.id,
                  dimension_type: dim.type,
                  dimension_id: dim.id,
                  mastery_score: Math.round(masteryScore * 1000) / 1000,
                  attempts: newAttempts,
                  correct: newCorrect,
                  avg_time_sec: newAvgTime,
                  updated_at: nowIso,
                },
                { onConflict: "user_id,dimension_type,dimension_id" }
              );
            } catch (err) {
              console.warn("[syncMastery] Error updating user_mastery:", err);
            }
          }
        })();
      }
    },
    [user],
  );

  // Detect if a resumable session exists (do not auto-open it)
  useEffect(() => {
    const saved = loadFromStorage();
    setHasSavedSession(Boolean(saved && saved.questions.length > 0));
  }, []);

  // Persist session state whenever it changes
  useEffect(() => {
    if (state === "active" && questions.length > 0) {
      saveToStorage({
        questions,
        currentIndex,
        answers,
        startTime,
        flashcardsGenerated,
        area: questions[0]?.area ?? null,
        extraSession,
      });
      setHasSavedSession(true);
    }
  }, [state, questions, currentIndex, answers, startTime, flashcardsGenerated, extraSession]);

  const resumeSession = useCallback(() => {
    const saved = loadFromStorage();
    if (!saved || saved.questions.length === 0) {
      setHasSavedSession(false);
      return false;
    }

    setQuestions(saved.questions);
    setCurrentIndex(saved.currentIndex);
    setAnswers(saved.answers);
    setStartTime(saved.startTime);
    setQuestionStartedAt(Date.now());
    setFlashcardsGenerated(saved.flashcardsGenerated);
    setShowFeedback(false);
    setResult(null);
    setExtraSession(Boolean(saved.extraSession));
    setExtraArea(saved.extraSession ? saved.area : null);
    setState("active");
    setHasSavedSession(true);
    return true;
  }, []);

  const exitSessionView = useCallback(() => {
    setState("idle");
    setShowFeedback(false);
  }, []);

  const currentQuestion = questions[currentIndex] ?? null;
  const totalQuestions = questions.length;
  const _warmSz = Math.max(1, Math.round(totalQuestions * 0.25));
  const _consSz = Math.max(1, Math.round(totalQuestions * 0.25));
  const currentBlock = currentIndex < _warmSz ? 0 : currentIndex < totalQuestions - _consSz ? 1 : 2;
  const blockLabels = ["Aquecimento", "Aprendizado", "Consolidação"];
  const progress =
    totalQuestions > 0 ? Math.round(((currentIndex + (showFeedback ? 1 : 0)) / totalQuestions) * 100) : 0;

  const startSession = useCallback(
    async (area: string | null, questionLimit?: number, forceNew = false, resetTodayAttempts = false) => {
      if (!user) return;
      setState("loading");

      try {
        const limit = questionLimit ?? 20;
        const today = todayDateKey();
        const normalizedArea = area ?? null;
        const savedPlan = !forceNew ? loadDailyPlan() : null;

        if (resetTodayAttempts) {
          const { error: resetAttemptsError } = await supabase
            .from("question_attempts")
            .delete()
            .eq("user_id", user.id)
            .eq("session_date", today);

          if (resetAttemptsError) {
            console.error("Error resetting today attempts:", resetAttemptsError);
            toast.error("Nao foi possivel resetar as respostas de hoje");
          } else {
            await queryClient.invalidateQueries({ queryKey: ["study-stats", user.id, today] });
          }
        }

        if (
          savedPlan &&
          savedPlan.date === today &&
          savedPlan.area === normalizedArea &&
          savedPlan.questionIds.length > 0
        ) {
          let resumeQuery = supabase.from("questions").select("*").in("id", savedPlan.questionIds).not('correct_answer', 'is', null);

          if (area && area !== "mista") {
            resumeQuery = resumeQuery.eq("area", area);
          }

          const { data: plannedData, error: plannedError } = await resumeQuery;
          if (plannedError) throw plannedError;

          if (plannedData && plannedData.length > 0) {
            const byId = new Map(plannedData.map((question) => [question.id, question]));
            const orderedQuestions = savedPlan.questionIds
              .map((id) => byId.get(id))
              .filter((item): item is NonNullable<typeof item> => Boolean(item))
              .slice(0, limit)
              .map(mapQuestion);

            if (orderedQuestions.length > 0) {
              const now = Date.now();
              setQuestions(orderedQuestions);
              setCurrentIndex(0);
              setAnswers({});
              setShowFeedback(false);
              setResult(null);
              setFlashcardsGenerated(0);
              setStartTime(now);
              setQuestionStartedAt(now);
              setState("active");
              saveToStorage({
                questions: orderedQuestions,
                currentIndex: 0,
                answers: {},
                startTime: now,
                flashcardsGenerated: 0,
                area: orderedQuestions[0]?.area ?? null,
              });
              setHasSavedSession(true);
              return;
            }
          }
        }

        let query = supabase.from("questions").select("*").not('correct_answer', 'is', null);

        if (area && area !== "mista") {
          query = query.eq("area", area);
        }

        const { data, error } = await query.limit(1500);
        if (error) throw error;

        if (!data || data.length === 0) {
          toast.error("Nenhuma questão disponível para esta área");
          setState("idle");
          return;
        }

        // Filter out questions with the wrong foreign language based on user preference
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("foreign_language")
          .eq("user_id", user.id)
          .maybeSingle();

        const userLang = (prefs?.foreign_language as string) || "ingles";
        const oppositeLanguage = userLang === "ingles" ? "espanhol" : "ingles";

        const filteredData = data.filter((q: any) => {
          // Keep questions with no foreign_language (regular questions)
          // Keep questions matching the user's chosen language
          // Exclude questions in the opposite language
          if (!q.foreign_language) return true;
          return q.foreign_language !== oppositeLanguage;
        });

        if (filteredData.length === 0) {
          toast.error("Nenhuma questão disponível para esta área");
          setState("idle");
          return;
        }

        const parsedQuestions = filteredData.map(mapQuestion);
        const hasTaxonomy = parsedQuestions.some((q) => q.topic && q.topic !== "Geral");
        let selectedQuestions = shuffleArray(parsedQuestions).slice(0, limit);

        if (hasTaxonomy) {
          let profileQuery = supabase
            .from("user_topic_profile")
            .select("area,topic,subtopic,level,attempts,correct,next_review_at,last_attempt_at,priority_score")
            .eq("user_id", user.id);

          if (area && area !== "mista") {
            profileQuery = profileQuery.eq("area", area);
          }

          const { data: profiles } = await profileQuery;
          if (profiles) {
            const typedProfiles = profiles as ProfileRow[];
            const attemptsInArea = typedProfiles.reduce((sum, p) => sum + (p.attempts ?? 0), 0);
            const inDiagnosticMode = attemptsInArea < DIAGNOSTIC_QUESTIONS_PER_AREA;

            selectedQuestions = inDiagnosticMode
              ? buildExplorationSelection(parsedQuestions, limit)
              : buildAdaptiveSelection(parsedQuestions, typedProfiles, limit);
          }
        }

        const now = Date.now();
        setQuestions(selectedQuestions);
        setCurrentIndex(0);
        setAnswers({});
        setShowFeedback(false);
        setResult(null);
        setFlashcardsGenerated(0);
        setStartTime(now);
        setQuestionStartedAt(now);
        setState("active");
        saveDailyPlan({
          date: today,
          area: normalizedArea,
          questionIds: selectedQuestions.map((question) => question.id),
        });
        saveToStorage({
          questions: selectedQuestions,
          currentIndex: 0,
          answers: {},
          startTime: now,
          flashcardsGenerated: 0,
          area: selectedQuestions[0]?.area ?? null,
        });
        setHasSavedSession(true);
      } catch (err: any) {
        console.error("Error starting session:", err);
        toast.error("Erro ao iniciar sessão");
        setState("idle");
      }
    },
    [mapQuestion, queryClient, user],
  );

  const startPreviewQuestion = useCallback(
    async (questionId: string) => {
      if (!user || !questionId) return false;
      setState("loading");

      try {
        const { data, error } = await supabase.from("questions").select("*").eq("id", questionId).single();

        if (error || !data) {
          throw new Error(error?.message || "Questao nao encontrada");
        }

        const previewQuestion: Question = mapQuestion(data);

        setQuestions([previewQuestion]);
        setCurrentIndex(0);
        setAnswers({});
        setShowFeedback(false);
        setResult(null);
        setFlashcardsGenerated(0);
        setStartTime(Date.now());
        setQuestionStartedAt(Date.now());
        setState("active");
        saveToStorage({
          questions: [previewQuestion],
          currentIndex: 0,
          answers: {},
          startTime: Date.now(),
          flashcardsGenerated: 0,
          area: previewQuestion.area ?? null,
        });
        return true;
      } catch (err) {
        console.error("Error starting preview question:", err);
        toast.error("Nao foi possivel abrir o preview da questao");
        setState("idle");
        return false;
      }
    },
    [mapQuestion, queryClient, user],
  );

  const generateFlashcard = useCallback(
    async (question: Question, resultType: "wrong" | "dont_know") => {
      if (!user) return;
      try {
        let front: string;
        let back: string;

        // Try AI-powered flashcard generation
        try {
          const { data, error } = await supabase.functions.invoke("generate-flashcard", {
            body: {
              questionId: question.id,
              statement: question.statement,
              alternatives: question.alternatives,
              correctAnswer: question.correct_answer,
              explanation: question.explanation,
              area: question.area,
            },
          });

          if (error || !data?.front || !data?.back) {
            throw new Error(error?.message || "Invalid response");
          }

          front = data.front;
          back = data.back;
        } catch (aiErr) {
          console.warn("AI flashcard generation failed, using fallback:", aiErr);
          // Fallback: simplified version (better than raw statement)
          const correctAlt = question.alternatives.find((a: any) => a.letter === question.correct_answer);
          front = `[${question.area}] Qual conceito-chave da questao ${question.number}?`;
          back = `Resposta: ${question.correct_answer}${correctAlt ? ` â€” ${correctAlt.text}` : ""}${question.explanation ? `\n\n${question.explanation}` : ""}`;
        }

        const firstImage = question.images?.[0]?.url ?? question.image_url ?? null;
        const exampleContext = (question.statement || "").slice(0, 280) || null;

        const { error: smartError } = await supabase.functions.invoke("flashcards-smart", {
          body: {
            action: "upsert_from_error",
            payload: {
              source_id: question.id,
              source_type: "question",
              area: question.area,
              topic: question.topic,
              subtopic: question.subtopic,
              skills: question.skills,
              front,
              back,
              example_context: exampleContext,
              image_url: firstImage,
              result_type: resultType,
            },
          },
        });
        if (smartError) throw smartError;
        setFlashcardsGenerated((prev) => prev + 1);
      } catch (err) {
        console.error("Error generating flashcard:", err);
      }
    },
    [user],
  );

  const answerQuestion = useCallback(
    async (selectedLetter: string | null, autoFlashcard = true): Promise<{ submitted: boolean; suspectedGuess: boolean }> => {
      if (!currentQuestion || showFeedback) return { submitted: false, suspectedGuess: false };

      const isCorrect = selectedLetter === currentQuestion.correct_answer;
      const timeSpentSec = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));

      // Check for suspected guess (only for actual answer selections, not "don't know")
      if (selectedLetter !== null && isLikelyGuess(currentQuestion.statement, currentQuestion.alternatives, timeSpentSec)) {
        return { submitted: false, suspectedGuess: true };
      }

      return submitAnswer(selectedLetter, autoFlashcard, false);
    },
    [currentQuestion, questionStartedAt, showFeedback],
  );

  const submitAnswer = useCallback(
    async (selectedLetter: string | null, autoFlashcard: boolean, wasGuess: boolean): Promise<{ submitted: boolean; suspectedGuess: boolean }> => {
      if (!currentQuestion || showFeedback) return { submitted: false, suspectedGuess: false };

      const isCorrect = selectedLetter === currentQuestion.correct_answer;
      const timeSpentSec = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
      const nextAnswers = {
        ...answers,
        [currentIndex]: { selected: selectedLetter, correct: isCorrect },
      };
      setAnswers((prev) => ({
        ...prev,
        [currentIndex]: { selected: selectedLetter, correct: isCorrect },
      }));
      setShowFeedback(true);
      saveToStorage({
        questions,
        currentIndex,
        answers: nextAnswers,
        startTime,
        flashcardsGenerated,
        area: questions[0]?.area ?? null,
        extraSession,
      });

      // Record attempt
      if (user) {
        supabase
          .from("question_attempts")
          .insert({
            user_id: user.id,
            question_id: currentQuestion.id,
            selected_answer: selectedLetter,
            is_correct: isCorrect,
            response_time_ms: timeSpentSec * 1000,
            session_date: new Date().toISOString().split("T")[0],
            extra_session: extraSession,
          })
          .then(() => {});

        syncTopicProfile({
          question: currentQuestion,
          selectedLetter,
          isCorrect,
          timeSpentSec,
          wasGuess,
        }).then(() => {});
      }

      // Auto-generate flashcard on wrong answer (only if plan allows)
      if (!isCorrect && autoFlashcard) {
        await generateFlashcard(currentQuestion, selectedLetter === null ? "dont_know" : "wrong");
      }

      return { submitted: true, suspectedGuess: false };
    },
    [
      answers,
      currentQuestion,
      currentIndex,
      flashcardsGenerated,
      generateFlashcard,
      questionStartedAt,
      questions,
      showFeedback,
      startTime,
      syncTopicProfile,
      user,
      extraSession,
    ],
  );

  const confirmAnswer = useCallback(
    async (selectedLetter: string, autoFlashcard: boolean, wasGuess: boolean) => {
      return submitAnswer(selectedLetter, autoFlashcard, wasGuess);
    },
    [submitAnswer],
  );

  const nextQuestion = useCallback(async () => {
    // Extra session: never auto-complete by count. Just advance; loadMoreExtra is triggered by the page when nearing the end.
    if (extraSession) {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= totalQuestions) {
        // Out of preloaded questions; stay on current and let UI show a "Carregando próxima…" state via loadingMoreExtra.
        // The UI is responsible for invoking loadMoreExtra in advance.
        return;
      }
      setCurrentIndex(nextIndex);
      setShowFeedback(false);
      setQuestionStartedAt(Date.now());
      saveToStorage({
        questions,
        currentIndex: nextIndex,
        answers,
        startTime,
        flashcardsGenerated,
        area: extraArea,
        extraSession: true,
      });
      return;
    }

    if (currentIndex + 1 >= totalQuestions) {
      // Session complete
      const durationMinutes = Math.round((Date.now() - startTime) / 60000);
      const totalCorrect = Object.values(answers).filter((a) => a.correct).length;

      // Calculate per-block results using 25%/50%/25% boundaries
      const blocks = [];
      const resWarm = Math.max(1, Math.round(totalQuestions * 0.25));
      const resCons = Math.max(1, Math.round(totalQuestions * 0.25));
      const blockBounds = [0, resWarm, totalQuestions - resCons, totalQuestions];
      for (let b = 0; b < 3; b++) {
        const start = blockBounds[b];
        const end = blockBounds[b + 1];
        const blockAnswers = Object.entries(answers)
          .filter(([idx]) => {
            const i = parseInt(idx);
            return i >= start && i < end;
          })
          .map(([, a]) => a);
        blocks.push({
          correct: blockAnswers.filter((a) => a.correct).length,
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
      setState("result");
      clearStorage();
      setHasSavedSession(false);

      // Save study session
      if (user && currentQuestion) {
        supabase
          .from("study_sessions")
          .insert({
            user_id: user.id,
            area: currentQuestion.area,
            questions_answered: totalQuestions,
            correct_answers: totalCorrect,
            flashcards_reviewed: 0,
            duration_minutes: Math.max(1, durationMinutes),
            session_date: new Date().toISOString().split("T")[0],
          })
          .then(() => {});
      }
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setShowFeedback(false);
      setQuestionStartedAt(Date.now());
      saveToStorage({
        questions,
        currentIndex: nextIndex,
        answers,
        startTime,
        flashcardsGenerated,
        area: questions[0]?.area ?? null,
      });
    }
  }, [
    currentIndex,
    totalQuestions,
    answers,
    startTime,
    flashcardsGenerated,
    user,
    currentQuestion,
    showFeedback,
    questions,
    extraSession,
    extraArea,
  ]);

  const resetSession = useCallback(() => {
    setState("idle");
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setShowFeedback(false);
    setResult(null);
    setFlashcardsGenerated(0);
    setQuestionStartedAt(0);
    setExtraSession(false);
    setExtraArea(null);
    clearStorage();
    clearStorage(true);
    setHasSavedSession(false);
  }, []);

  // ─── EXTRA SESSION (Pro) ────────────────────────────────────────
  // Fetches a batch of fresh questions, optionally filtered by area, excluding
  // questions the user has already answered (in any session). Does not affect
  // daily metrics — `extra_session=true` is propagated to question_attempts.

  const fetchExtraQuestions = useCallback(
    async (area: string | null, excludeIds: Set<string>): Promise<Question[]> => {
      if (!user) return [];

      // Get user's already-answered question IDs to avoid repetition.
      const { data: history } = await supabase
        .from("user_question_history")
        .select("question_id")
        .eq("user_id", user.id);
      const answeredIds = new Set<string>((history ?? []).map((h: any) => h.question_id));
      excludeIds.forEach((id) => answeredIds.add(id));

      // Foreign-language preference filter.
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("foreign_language")
        .eq("user_id", user.id)
        .maybeSingle();
      const userLang = (prefs?.foreign_language as string) || "ingles";
      const oppositeLanguage = userLang === "ingles" ? "espanhol" : "ingles";

      let query = supabase.from("questions").select("*").not('correct_answer', 'is', null);
      if (area && area !== "geral") {
        query = query.eq("area", area);
      }
      const { data, error } = await query.limit(1500);
      if (error) throw error;
      if (!data) return [];

      const filtered = data.filter((q: any) => {
        if (answeredIds.has(q.id)) return false;
        if (q.foreign_language && q.foreign_language === oppositeLanguage) return false;
        return true;
      });

      return shuffleArray(filtered).slice(0, EXTRA_BATCH_SIZE).map(mapQuestion);
    },
    [user, mapQuestion],
  );

  const startExtraSession = useCallback(
    async (area: string | null) => {
      if (!user) return;
      setState("loading");
      try {
        const batch = await fetchExtraQuestions(area, new Set());
        if (batch.length === 0) {
          toast.error("Nenhuma questão nova disponível para este modo");
          setState("idle");
          return;
        }
        const now = Date.now();
        // Clear any prior extra-session storage; do NOT touch the daily session storage.
        clearStorage(true);
        setQuestions(batch);
        setCurrentIndex(0);
        setAnswers({});
        setShowFeedback(false);
        setResult(null);
        setFlashcardsGenerated(0);
        setStartTime(now);
        setQuestionStartedAt(now);
        setExtraSession(true);
        setExtraArea(area);
        setState("active");
        saveToStorage({
          questions: batch,
          currentIndex: 0,
          answers: {},
          startTime: now,
          flashcardsGenerated: 0,
          area,
          extraSession: true,
        });
      } catch (err) {
        console.error("Error starting extra session:", err);
        toast.error("Erro ao iniciar sessão extra");
        setState("idle");
      }
    },
    [user, fetchExtraQuestions],
  );

  const loadMoreExtra = useCallback(async () => {
    if (!extraSession || loadingMoreExtra) return;
    // Only preload when we are within EXTRA_PRELOAD_THRESHOLD of the end.
    if (questions.length - (currentIndex + 1) > EXTRA_PRELOAD_THRESHOLD) return;
    setLoadingMoreExtra(true);
    try {
      const existing = new Set(questions.map((q) => q.id));
      const more = await fetchExtraQuestions(extraArea, existing);
      if (more.length > 0) {
        setQuestions((prev) => [...prev, ...more]);
      }
    } catch (err) {
      console.error("Error loading more extra questions:", err);
    } finally {
      setLoadingMoreExtra(false);
    }
  }, [extraSession, loadingMoreExtra, questions, currentIndex, extraArea, fetchExtraQuestions]);

  const endExtraSession = useCallback(() => {
    const answered = Object.keys(answers).length;
    const totalCorrect = Object.values(answers).filter((a) => a.correct).length;
    const durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));

    const sessionResult: SessionResult = {
      total: answered,
      correct: totalCorrect,
      blocks: [{ correct: totalCorrect, total: answered }],
      flashcardsGenerated,
      durationMinutes,
    };

    setResult(sessionResult);
    setState("result");
    clearStorage(true);
    setHasSavedSession(false);

    if (user && answered > 0) {
      supabase
        .from("study_sessions")
        .insert({
          user_id: user.id,
          area: extraArea ?? "mista",
          questions_answered: answered,
          correct_answers: totalCorrect,
          flashcards_reviewed: 0,
          duration_minutes: durationMinutes,
          session_date: new Date().toISOString().split("T")[0],
          is_extra: true,
        })
        .then(() => {});
    }
  }, [answers, startTime, flashcardsGenerated, user, extraArea]);

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
    hasSavedSession,
    extraSession,
    extraArea,
    loadingMoreExtra,
    startSession,
    resumeSession,
    exitSessionView,
    startPreviewQuestion,
    answerQuestion,
    confirmAnswer,
    nextQuestion,
    resetSession,
    startExtraSession,
    loadMoreExtra,
    endExtraSession,
  };
}
