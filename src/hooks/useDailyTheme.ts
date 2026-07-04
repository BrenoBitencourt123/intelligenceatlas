import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DailyTheme, currentTheme as fallbackTheme } from '@/data/dailyThemes';

interface DbDailyTheme {
  id: string;
  date: string;
  title: string;
  motivating_text: string;
  context: string;
  guiding_questions: string[];
  structure_guide: { id: string; label: string; description: string }[];
  sources?: { title: string; url: string; excerpt: string; type: string }[];
  is_ai_generated: boolean;
  created_at: string;
}

interface UseDailyThemeResult {
  theme: DailyTheme;
  isLoading: boolean;
  error: string | null;
  isAiGenerated: boolean;
  refetch: () => Promise<void>;
}

// Convert database format to frontend format
function mapDbThemeToFrontend(dbTheme: DbDailyTheme): DailyTheme {
  return {
    id: dbTheme.id,
    date: dbTheme.date,
    title: dbTheme.title,
    motivatingText: dbTheme.motivating_text,
    context: dbTheme.context,
    guidingQuestions: dbTheme.guiding_questions,
    structureGuide: dbTheme.structure_guide,
    sources: dbTheme.sources as DailyTheme['sources'],
  };
}

// Cache to avoid duplicate requests within same session
let cachedTheme: { theme: DailyTheme; isAiGenerated: boolean; date: string } | null = null;

export function useDailyTheme(): UseDailyThemeResult {
  const [theme, setTheme] = useState<DailyTheme>(fallbackTheme);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchTheme = useCallback(async () => {
    // Check cache first
    if (cachedTheme && cachedTheme.date === today) {
      setTheme(cachedTheme.theme);
      setIsAiGenerated(cachedTheme.isAiGenerated);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Try to fetch from database
      console.log('[useDailyTheme] Fetching theme for date:', today);
      
      const { data: dbTheme, error: fetchError } = await supabase
        .from('daily_themes')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (fetchError) {
        console.error('[useDailyTheme] Database error:', fetchError);
        throw new Error('Erro ao buscar tema');
      }

      if (dbTheme) {
        // Theme exists in database
        console.log('[useDailyTheme] Found theme in database:', dbTheme.title);
        const mappedTheme = mapDbThemeToFrontend(dbTheme as unknown as DbDailyTheme);
        setTheme(mappedTheme);
        setIsAiGenerated(dbTheme.is_ai_generated);
        
        // Update cache
        cachedTheme = { theme: mappedTheme, isAiGenerated: dbTheme.is_ai_generated, date: today };
        return;
      }

      // No theme in database — use local fallback (no AI generation).
      console.log('[useDailyTheme] No theme in DB, using local fallback');
      setTheme(fallbackTheme);
      setIsAiGenerated(false);
      cachedTheme = { theme: fallbackTheme, isAiGenerated: false, date: today };

    } catch (err) {
      console.error('[useDailyTheme] Error:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // Keep fallback theme on error
      setTheme(fallbackTheme);
      setIsAiGenerated(false);
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  return {
    theme,
    isLoading,
    error,
    isAiGenerated,
    refetch: fetchTheme,
  };
}
