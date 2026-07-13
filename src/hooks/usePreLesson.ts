import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PreLessonItemType = "info" | "multipla" | "completar";

export interface PreLessonOpcao {
  id: string;
  texto: string;
}

export interface PreLessonItem {
  tipo: PreLessonItemType;
  enunciado: string;
  corpo?: string;
  opcoes?: PreLessonOpcao[];
  gabarito: string | null;
  feedback_acerto?: string | null;
  feedback_erro?: string | null;
  explicacao_curta?: string | null;
}

interface UsePreLessonReturn {
  items: PreLessonItem[];
  loading: boolean;
  currentIndex: number;
  isComplete: boolean;
  fetch: (questionId: string) => Promise<void>;
  advance: () => void;
  skip: () => void;
  reset: () => void;
}

export function usePreLesson(): UsePreLessonReturn {
  const [items, setItems] = useState<PreLessonItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const fetch = useCallback(async (questionId: string) => {
    setLoading(true);
    setCurrentIndex(0);
    setIsComplete(false);
    setItems([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-pre-lesson", {
        body: { questionId },
      });

      if (error || !data?.items?.length) {
        // Sem pré-aula: pula direto para a questão
        setIsComplete(true);
        return;
      }

      setItems(data.items as PreLessonItem[]);
    } catch {
      setIsComplete(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const advance = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= items.length) {
        setIsComplete(true);
        return prev;
      }
      return next;
    });
  }, [items.length]);

  const skip = useCallback(() => {
    setIsComplete(true);
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setCurrentIndex(0);
    setIsComplete(false);
    setLoading(false);
  }, []);

  return { items, loading, currentIndex, isComplete, fetch, advance, skip, reset };
}
