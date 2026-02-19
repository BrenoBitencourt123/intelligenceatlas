import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getTopicLabel, getSkillLabel } from '@/taxonomy/taxonomy';

export interface MasteryEntry {
  dimension_type: 'topic' | 'skill' | 'topic_skill';
  dimension_id: string;
  label: string;
  mastery_score: number;
  attempts: number;
  correct: number;
  avg_time_sec: number | null;
  updated_at: string;
}

export interface UserMasteryData {
  weakTopics: MasteryEntry[];
  weakSkills: MasteryEntry[];
  strongTopics: MasteryEntry[];
  strongSkills: MasteryEntry[];
  masteryByTopic: Record<string, number>;
  masteryBySkill: Record<string, number>;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export function useUserMastery(): UserMasteryData {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<MasteryEntry[]>([]);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('user_mastery')
        .select('dimension_type, dimension_id, mastery_score, attempts, correct, avg_time_sec, updated_at')
        .eq('user_id', user.id)
        .in('dimension_type', ['topic', 'skill'])
        .order('mastery_score', { ascending: true });

      if (dbError) throw dbError;

      const mapped: MasteryEntry[] = (data ?? []).map((row) => ({
        dimension_type: row.dimension_type as 'topic' | 'skill',
        dimension_id: row.dimension_id,
        label:
          row.dimension_type === 'topic'
            ? (getTopicLabel(row.dimension_id) ?? row.dimension_id)
            : (getSkillLabel(row.dimension_id) ?? row.dimension_id),
        mastery_score: Number(row.mastery_score),
        attempts: row.attempts,
        correct: row.correct,
        avg_time_sec: row.avg_time_sec ?? null,
        updated_at: row.updated_at,
      }));

      setEntries(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar mastery';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const topics = entries.filter((e) => e.dimension_type === 'topic');
  const skills = entries.filter((e) => e.dimension_type === 'skill');

  // Already sorted ASC by mastery_score from DB
  const weakTopics = topics.filter((e) => e.attempts >= 2).slice(0, 5);
  const weakSkills = skills.filter((e) => e.attempts >= 2).slice(0, 5);

  // Strong = top mastery (sort DESC)
  const strongTopics = [...topics].sort((a, b) => b.mastery_score - a.mastery_score).slice(0, 5);
  const strongSkills = [...skills].sort((a, b) => b.mastery_score - a.mastery_score).slice(0, 5);

  const masteryByTopic = Object.fromEntries(topics.map((e) => [e.dimension_id, e.mastery_score]));
  const masteryBySkill = Object.fromEntries(skills.map((e) => [e.dimension_id, e.mastery_score]));

  return {
    weakTopics,
    weakSkills,
    strongTopics,
    strongSkills,
    masteryByTopic,
    masteryBySkill,
    loading,
    error,
    fetch,
  };
}
