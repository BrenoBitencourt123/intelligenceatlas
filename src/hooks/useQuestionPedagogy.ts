import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PreConcept {
  explanation: string;
  skill: string | null;
  formula: string | null;
  bullets: string[];
}

interface VideoSuggestion {
  title: string;
  query: string;
}

export interface QuestionPedagogy {
  pre_concept: PreConcept | null;
  cognitive_pattern: string | null;
  deep_lesson: string | null;
  video_suggestions: VideoSuggestion[] | null;
}

interface QuestionData {
  id: string;
  statement: string;
  alternatives: { letter: string; text: string }[];
  correct_answer: string;
  explanation: string | null;
  area: string;
  tags: string[];
  images?: { url: string }[];
}

export function useQuestionPedagogy(question: QuestionData | null, shouldLoad: boolean) {
  const [pedagogy, setPedagogy] = useState<QuestionPedagogy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!question || !shouldLoad) {
      setPedagogy(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        // Check cache first
        const { data: cached } = await supabase
          .from('question_pedagogy')
          .select('pre_concept, cognitive_pattern, deep_lesson, video_suggestions')
          .eq('question_id', question.id)
          .maybeSingle();

        if (cached && !cancelled) {
          setPedagogy(cached as unknown as QuestionPedagogy);
          setLoading(false);
          return;
        }

        // Generate via edge function
        const { data, error: fnError } = await supabase.functions.invoke('generate-pedagogy', {
          body: {
            questionId: question.id,
            statement: question.statement,
            alternatives: question.alternatives,
            correctAnswer: question.correct_answer,
            explanation: question.explanation,
            area: question.area,
            tags: question.tags,
          },
        });

        if (!cancelled) {
          if (fnError || !data) {
            setError(true);
          } else {
            setPedagogy({
              pre_concept: data.pre_concept,
              cognitive_pattern: data.cognitive_pattern,
              deep_lesson: data.deep_lesson,
              video_suggestions: data.video_suggestions,
            });
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [question?.id, shouldLoad]);

  return { pedagogy, loading, error };
}
