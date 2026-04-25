import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { computePriorityScore, nextReviewDateForLevel } from '@/lib/adaptiveStudy';
import { InlineStatementRenderer } from '@/components/study/InlineStatementRenderer';
import { ArrowRight, Check, X } from 'lucide-react';
import { QuestionImage, normalizeQuestionImages } from '@/lib/questionImages';

/* ─── Types ──────────────────────────────────────────────────────────── */
interface DiagQuestion {
  id: string;
  number: number;
  area: string;
  topic: string;
  subtopic: string;
  difficulty: number;
  statement: string;
  alternatives: { letter: string; text: string; image_url?: string | null }[];
  correct_answer: string;
  explanation: string | null;
  images: QuestionImage[];
  year: number;
}

interface AnswerRecord {
  selected: string;
  correct: boolean;
}

type DiagState = 'loading' | 'active' | 'saving' | 'done';

/* ─── Constants ─────────────────────────────────────────────────────── */
const AREAS = ['matematica', 'linguagens', 'natureza', 'humanas'] as const;
const AREA_LABELS: Record<string, string> = {
  matematica: 'Matemática',
  linguagens: 'Linguagens',
  natureza:   'Ciências da Natureza',
  humanas:    'Ciências Humanas',
};
const AREA_ICONS: Record<string, string> = {
  matematica: '📐',
  linguagens: '📝',
  natureza:   '🔬',
  humanas:    '🌍',
};
const QUESTIONS_PER_AREA = 3;

/* ─── Helpers ───────────────────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// normalizeImages local foi substituída por normalizeQuestionImages de @/lib/questionImages.

function mapQuestion(q: any): DiagQuestion {
  return {
    id: q.id,
    number: q.number,
    area: q.area,
    topic: q.topic ?? 'Geral',
    subtopic: q.subtopic ?? '',
    difficulty: q.difficulty ?? 2,
    statement: q.statement,
    alternatives: q.alternatives as any,
    correct_answer: q.correct_answer,
    explanation: q.explanation ?? null,
    images: normalizeQuestionImages(q.images, q.image_url),
    year: q.year,
  };
}

// Map accuracy to level 0-3
function accuracyToLevel(correct: number, total: number): number {
  if (total === 0) return 1;
  const pct = correct / total;
  if (pct < 0.34) return 0;
  if (pct < 0.67) return 1;
  if (pct < 1.0)  return 2;
  return 3;
}

/* ─── Component ─────────────────────────────────────────────────────── */
export default function Diagnostico() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [diagState, setDiagState] = useState<DiagState>('loading');
  const [questions, setQuestions]   = useState<DiagQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [areaResults, setAreaResults] = useState<Record<string, { correct: number; total: number }>>({});

  /* ─── Redirect if user already has question history ─── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { count } = await supabase
        .from('question_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (count && count > 0) {
        navigate('/hoje', { replace: true });
        return;
      }
      fetchQuestions();
    })();
  }, [user?.id]);

  /* ─── Fetch 12 diagnostic questions ─── */
  const fetchQuestions = useCallback(async () => {
    if (!user) return;
    setDiagState('loading');

    // Fetch a broad pool and balance by area + difficulty client-side
    const { data, error } = await supabase
      .from('questions')
      .select('id, area, topic, subtopic, difficulty, statement, alternatives, correct_answer, explanation, tags, image_url, images, year, number, foreign_language')
      .in('area', [...AREAS])
      .limit(400);

    if (error || !data) {
      navigate('/bem-vindo', { replace: true });
      return;
    }

    // Filter foreign language questions
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('foreign_language')
      .eq('user_id', user.id)
      .maybeSingle();
    const userLang = (prefs?.foreign_language as string) ?? 'ingles';
    const oppLang  = userLang === 'ingles' ? 'espanhol' : 'ingles';
    const filtered = data.filter((q: any) => !q.foreign_language || q.foreign_language !== oppLang);

    // Group by area
    const byArea: Record<string, any[]> = {};
    for (const area of AREAS) byArea[area] = [];
    for (const q of filtered) {
      if (byArea[q.area]) byArea[q.area].push(q);
    }

    // Pick 3 per area: 1 easy + 1 medium + 1 hard (best effort)
    const picked: DiagQuestion[] = [];
    for (const area of AREAS) {
      const pool = byArea[area];
      const easy   = shuffle(pool.filter((q: any) => q.difficulty === 1));
      const medium = shuffle(pool.filter((q: any) => q.difficulty === 2));
      const hard   = shuffle(pool.filter((q: any) => q.difficulty === 3));

      const trio: any[] = [];
      if (easy[0])   trio.push(easy[0]);
      if (medium[0]) trio.push(medium[0]);
      if (hard[0])   trio.push(hard[0]);

      // Fallback: fill from the rest if we don't have 3
      const usedIds = new Set(trio.map(q => q.id));
      const rest = shuffle(pool.filter((q: any) => !usedIds.has(q.id)));
      while (trio.length < QUESTIONS_PER_AREA && rest.length > 0) {
        trio.push(rest.shift());
      }

      picked.push(...shuffle(trio).slice(0, QUESTIONS_PER_AREA).map(mapQuestion));
    }

    // Interleave by area: Q1-Mat, Q1-Lang, Q1-Nat, Q1-Hum, Q2-Mat, ...
    const interleaved: DiagQuestion[] = [];
    for (let i = 0; i < QUESTIONS_PER_AREA; i++) {
      for (let a = 0; a < AREAS.length; a++) {
        const q = picked[a * QUESTIONS_PER_AREA + i];
        if (q) interleaved.push(q);
      }
    }

    setQuestions(interleaved);
    setCurrentIndex(0);
    setAnswers({});
    setShowFeedback(false);
    setDiagState('active');
  }, [user?.id]);

  /* ─── Answer handler ─── */
  const handleSelect = (letter: string) => {
    if (showFeedback) return;
    const q = questions[currentIndex];
    const isCorrect = letter === q.correct_answer;
    setAnswers(prev => ({ ...prev, [currentIndex]: { selected: letter, correct: isCorrect } }));
    setShowFeedback(true);
  };

  const handleDontKnow = () => {
    if (showFeedback) return;
    // Registra como errada sem selecionar alternativa — revela a correta
    setAnswers(prev => ({ ...prev, [currentIndex]: { selected: '', correct: false } }));
    setShowFeedback(true);
  };

  /* ─── Next question ─── */
  const handleNext = async () => {
    const nextIdx = currentIndex + 1;

    if (nextIdx >= questions.length) {
      // All questions done → compute results and save
      await saveResults();
    } else {
      setCurrentIndex(nextIdx);
      setShowFeedback(false);
    }
  };

  /* ─── Save results + seed user_topic_profile ─── */
  const saveResults = async () => {
    if (!user) return;
    setDiagState('saving');

    // Tally by area
    const tally: Record<string, { correct: number; total: number }> = {};
    for (const area of AREAS) tally[area] = { correct: 0, total: 0 };

    for (let i = 0; i < questions.length; i++) {
      const area = questions[i].area;
      const ans  = answers[i];
      if (!tally[area]) tally[area] = { correct: 0, total: 0 };
      tally[area].total++;
      if (ans?.correct) tally[area].correct++;
    }

    setAreaResults(tally);

    // Seed user_topic_profile per area
    const nowIso = new Date().toISOString();
    const upserts = Object.entries(tally).map(([area, { correct, total }]) => {
      const level = accuracyToLevel(correct, total);
      const priorityScore = computePriorityScore({ attempts: total, correct, level });
      return supabase.from('user_topic_profile').upsert(
        {
          user_id:        user.id,
          area,
          topic:          'Geral',
          subtopic:       '',
          level,
          attempts:       total,
          correct,
          wrong:          total - correct,
          dont_know:      0,
          correct_streak: 0,
          priority_score: priorityScore,
          next_review_at: nextReviewDateForLevel(level),
          last_attempt_at: nowIso,
          updated_at:      nowIso,
        },
        { onConflict: 'user_id,area,topic,subtopic' }
      );
    });

    // Also seed per-topic profiles from actual question topics
    const topicMap: Record<string, { area: string; correct: number; total: number }> = {};
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const key = `${q.area}::${q.topic}`;
      if (!topicMap[key]) topicMap[key] = { area: q.area, correct: 0, total: 0 };
      topicMap[key].total++;
      if (answers[i]?.correct) topicMap[key].correct++;
    }
    const topicUpserts = Object.entries(topicMap).map(([key, { area, correct, total }]) => {
      const topic = key.split('::')[1] ?? 'Geral';
      if (topic === 'Geral') return Promise.resolve(); // already handled above
      const level = accuracyToLevel(correct, total);
      const priorityScore = computePriorityScore({ attempts: total, correct, level });
      return supabase.from('user_topic_profile').upsert(
        {
          user_id:        user.id,
          area,
          topic,
          subtopic:       '',
          level,
          attempts:       total,
          correct,
          wrong:          total - correct,
          dont_know:      0,
          correct_streak: 0,
          priority_score: priorityScore,
          next_review_at: nextReviewDateForLevel(level),
          last_attempt_at: nowIso,
          updated_at:      nowIso,
        },
        { onConflict: 'user_id,area,topic,subtopic' }
      );
    });

    await Promise.all([...upserts, ...topicUpserts]);
    setDiagState('done');
  };

  /* ─── Loading ─── */
  if (diagState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔬</div>
          <p className="text-sm text-muted-foreground">Preparando diagnóstico…</p>
        </div>
      </div>
    );
  }

  /* ─── Saving ─── */
  if (diagState === 'saving') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">⚙️</div>
          <p className="text-sm text-muted-foreground">Calibrando seu perfil…</p>
        </div>
      </div>
    );
  }

  /* ─── Done — results screen ─── */
  if (diagState === 'done') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="text-5xl">🎯</div>
            <h1 className="text-2xl font-bold text-foreground">Perfil calibrado!</h1>
            <p className="text-sm text-muted-foreground">
              O Atlas ajustou seu plano de estudos com base no seu desempenho.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            {AREAS.map((area) => {
              const r = areaResults[area] ?? { correct: 0, total: QUESTIONS_PER_AREA };
              const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
              return (
                <div key={area} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span>{AREA_ICONS[area]}</span>
                      <span className="font-medium text-foreground">{AREA_LABELS[area]}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {r.correct}/{r.total} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Button className="w-full gap-2" onClick={() => navigate('/bem-vindo', { replace: true })}>
            Começar a estudar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  /* ─── Active — question ─── */
  const q = questions[currentIndex];
  if (!q) return null;

  const answer = answers[currentIndex];
  const alternatives = q.alternatives as { letter: string; text: string; image_url?: string | null }[];
  const ALT_LETTERS = ['A', 'B', 'C', 'D', 'E'];
  const allImages = q.images ?? [];
  const statementImages = allImages.filter(
    (img) => !img.caption || !ALT_LETTERS.includes(img.caption.trim().toUpperCase())
  );

  const progressPct = Math.round(((currentIndex + (showFeedback ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Diagnóstico
              </p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <span>{AREA_ICONS[q.area]}</span>
                <span>{AREA_LABELS[q.area]}</span>
              </p>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {currentIndex + (showFeedback ? 1 : 0)}/{questions.length}
            </span>
          </div>

          {/* Progress */}
          <Progress value={progressPct} className="h-1" />

          {/* Question card */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="p-5 space-y-5">
              {/* Meta */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">Q{q.number}</span>
                <span className="w-px h-3 bg-border" />
                <span>ENEM {q.year}</span>
              </div>

              {/* Statement */}
              <InlineStatementRenderer
                statement={q.statement || ''}
                images={statementImages}
                questionNumber={q.number}
              />

              {/* Alternatives */}
              <div className="space-y-2">
                {alternatives.map((alt) => {
                  let stateClass = 'border-border hover:bg-muted/50 cursor-pointer';

                  if (showFeedback) {
                    stateClass = 'cursor-default border-border';
                    if (alt.letter === q.correct_answer) {
                      stateClass = 'border-green-500 bg-green-500/10 cursor-default';
                    } else if (answer?.selected === alt.letter && !answer.correct) {
                      stateClass = 'border-red-500 bg-red-500/10 cursor-default';
                    }
                  } else if (answer?.selected === alt.letter) {
                    stateClass = 'border-foreground bg-foreground/5';
                  }

                  return (
                    <button
                      key={alt.letter}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${stateClass}`}
                      onClick={() => handleSelect(alt.letter)}
                      disabled={showFeedback}
                    >
                      <span className="text-xs font-semibold shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground">
                        {alt.letter}
                      </span>
                      <span className="text-sm flex-1">
                        {alt.text}
                        {(alt as any).image_url && (
                          <img
                            src={(alt as any).image_url}
                            alt={`Alternativa ${alt.letter}`}
                            className="max-h-20 max-w-[180px] rounded border object-contain bg-muted/10 mt-1"
                            loading="lazy"
                          />
                        )}
                      </span>
                      {showFeedback && alt.letter === q.correct_answer && (
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      )}
                      {showFeedback && answer?.selected === alt.letter && !answer.correct && (
                        <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Não sei — só aparece antes do feedback */}
              {!showFeedback && (
                <Button
                  variant="outline"
                  className="w-full text-muted-foreground"
                  onClick={handleDontKnow}
                >
                  Não sei
                </Button>
              )}

              {/* Explanation (brief, only on feedback) */}
              {showFeedback && q.explanation && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed">
                  {q.explanation.length > 200
                    ? q.explanation.slice(0, 200) + '…'
                    : q.explanation}
                </div>
              )}
            </div>
          </div>

          {/* Next button */}
          {showFeedback && (
            <Button className="w-full gap-2" onClick={handleNext}>
              {currentIndex + 1 >= questions.length ? 'Ver resultado' : 'Próxima'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

        </div>
      </div>
    </div>
  );
}
