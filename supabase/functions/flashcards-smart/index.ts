import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Rating = "again" | "hard" | "easy";
type Action = "get_due" | "review" | "upsert_from_error";

const INTERVALS = [1, 3, 7, 14, 30, 45];

function nearestIntervalIndex(days: number) {
  if (!Number.isFinite(days) || days <= 1) return 0;
  const idx = INTERVALS.findIndex((v) => days <= v);
  return idx === -1 ? INTERVALS.length - 1 : idx;
}

function nextSchedule(
  current: { intervalDays: number; easeFactor: number },
  rating: Rating
) {
  const currentIdx = nearestIntervalIndex(current.intervalDays);
  let nextIdx = currentIdx;
  let nextEase = current.easeFactor;

  if (rating === "again") {
    nextIdx = 0;
    nextEase = Math.max(1.3, current.easeFactor - 0.2);
  } else if (rating === "hard") {
    nextIdx = Math.min(currentIdx + (currentIdx === 0 ? 1 : 0), INTERVALS.length - 1);
    nextEase = Math.max(1.3, current.easeFactor - 0.05);
  } else {
    nextIdx = Math.min(currentIdx + 1, INTERVALS.length - 1);
    nextEase = Math.min(3.0, current.easeFactor + 0.1);
  }

  const nextIntervalDays = INTERVALS[nextIdx];
  const nextReviewDate = new Date();
  nextReviewDate.setUTCDate(nextReviewDate.getUTCDate() + nextIntervalDays);

  return {
    nextEase,
    nextIntervalDays,
    nextReviewDate: nextReviewDate.toISOString().split("T")[0],
  };
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized. Authentication required." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return jsonResponse({ error: "Invalid session. Please log in." }, 401);
    }
    const userId = authData.user.id;

    const body = await req.json().catch(() => ({}));
    const action = body?.action as Action | undefined;
    if (!action) return jsonResponse({ error: "Missing action." }, 400);

    // ─── GET DUE ────────────────────────────────────────────────────────────────
    if (action === "get_due") {
      const today = new Date().toISOString().split("T")[0];

      const { data: dueCards, error: dueError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", userId)
        .lte("next_review", today)
        .order("next_review", { ascending: true })
        .order("ease_factor", { ascending: true });

      if (dueError) throw dueError;

      return jsonResponse({
        cards: dueCards ?? [],
        metrics: {
          dueToday: (dueCards ?? []).length,
        },
      });
    }

    // ─── REVIEW ─────────────────────────────────────────────────────────────────
    if (action === "review") {
      const flashcardId = body?.flashcardId as string | undefined;
      const rating = body?.rating as Rating | undefined;
      if (!flashcardId || !rating) {
        return jsonResponse({ error: "flashcardId and rating are required." }, 400);
      }

      const { data: card, error: cardError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("id", flashcardId)
        .eq("user_id", userId)
        .single();
      if (cardError || !card) return jsonResponse({ error: "Flashcard not found." }, 404);

      const schedule = nextSchedule(
        {
          intervalDays: card.interval_days ?? 1,
          easeFactor: Number(card.ease_factor ?? 2.5),
        },
        rating
      );

      const { error: updateError } = await supabase
        .from("flashcards")
        .update({
          interval_days: schedule.nextIntervalDays,
          next_review: schedule.nextReviewDate,
          ease_factor: schedule.nextEase,
          review_count: (card.review_count ?? 0) + 1,
        })
        .eq("id", card.id);
      if (updateError) throw updateError;

      const { error: reviewError } = await supabase.from("flashcard_reviews").insert({
        user_id: userId,
        flashcard_id: card.id,
        rating,
      });
      if (reviewError) throw reviewError;

      return jsonResponse({ success: true });
    }

    // ─── UPSERT FROM ERROR ───────────────────────────────────────────────────────
    if (action === "upsert_from_error") {
      const payload = body?.payload as Record<string, unknown> | undefined;
      if (!payload) return jsonResponse({ error: "Missing payload." }, 400);

      const sourceId = typeof payload.source_id === "string" ? payload.source_id : null;
      const today = new Date().toISOString().split("T")[0];

      let existing = null as Record<string, unknown> | null;
      if (sourceId) {
        const { data } = await supabase
          .from("flashcards")
          .select("*")
          .eq("user_id", userId)
          .eq("source_type", "question")
          .eq("source_id", sourceId)
          .maybeSingle();
        existing = data as Record<string, unknown> | null;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from("flashcards")
          .update({
            front: payload.front ?? existing.front,
            back: payload.back ?? existing.back,
            next_review: today,
            interval_days: 1,
            ease_factor: Math.max(1.3, Number(existing.ease_factor ?? 2.5) - 0.2),
          })
          .eq("id", String(existing.id));
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("flashcards").insert({
          user_id: userId,
          source_type: "question",
          source_id: sourceId,
          front: payload.front,
          back: payload.back,
          area: payload.area ?? null,
          interval_days: 1,
          next_review: today,
          ease_factor: 2.5,
          review_count: 0,
        });
        if (insertError) throw insertError;
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Unsupported action." }, 400);
  } catch (error) {
    console.error("[flashcards-smart] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});
