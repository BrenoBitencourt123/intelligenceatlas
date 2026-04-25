import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SimuladoAvailabilityRow {
  year: number;
  day1: number;
  day2: number;
}

const MIN_QUESTIONS_PER_DAY = 80;

export function useSimuladoAvailability() {
  const [rows, setRows] = useState<SimuladoAvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Fetch only year/day, then aggregate client-side.
        const { data, error } = await supabase
          .from("questions")
          .select("year, day")
          .not("day", "is", null)
          .limit(20000);

        if (error) throw error;
        if (cancelled || !data) return;

        const counts = new Map<number, { day1: number; day2: number }>();
        for (const row of data as { year: number; day: number | null }[]) {
          if (!row.day) continue;
          const entry = counts.get(row.year) ?? { day1: 0, day2: 0 };
          if (row.day === 1) entry.day1 += 1;
          else if (row.day === 2) entry.day2 += 1;
          counts.set(row.year, entry);
        }

        const result: SimuladoAvailabilityRow[] = [...counts.entries()]
          .map(([year, c]) => ({ year, day1: c.day1, day2: c.day2 }))
          .sort((a, b) => b.year - a.year);

        setRows(result);
      } catch (err) {
        console.error("Error loading simulado availability:", err);
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading, MIN_QUESTIONS_PER_DAY };
}
