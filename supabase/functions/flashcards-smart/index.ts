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
  current: { intervalDays: number; level: number; easeFactor: number },
  rating: Rating
) {
  const currentIdx = nearestIntervalIndex(current.intervalDays);
  let nextIdx = currentIdx;
  let nextLevel = current.level;
  let nextEase = current.easeFactor;

  if (rating === "again") {
    nextIdx = 0;
    nextLevel = Math.max(0, current.level - 1);
    nextEase = Math.max(1.3, current.easeFactor - 0.2);
  } else if (rating === "hard") {
    nextIdx = Math.min(currentIdx + (currentIdx === 0 ? 1 : 0), INTERVALS.length - 1);
    nextLevel = current.level;
    nextEase = Math.max(1.3, current.easeFactor - 0.05);
  } else {
    nextIdx = Math.min(currentIdx + 1, INTERVALS.length - 1);
    nextLevel = Math.min(3, current.level + 1);
    nextEase = Math.min(3.0, current.easeFactor + 0.1);
  }

  const nextIntervalDays = INTERVALS[nextIdx];
  const nextReviewAt = new Date();
  nextReviewAt.setUTCDate(nextReviewAt.getUTCDate() + nextIntervalDays);

  return {
    nextLevel,
    nextEase,
    nextIntervalDays,
    nextReviewAt: nextReviewAt.toISOString(),
    nextReviewDate: nextReviewAt.toISOString().split("T")[0],
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

    if (action === "get_due") {
      const nowIso = new Date().toISOString();

      const { data: dueCards, error: dueError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", userId)
        .lte("next_review_at", nowIso)
        .order("next_review_at", { ascending: true })
        .order("wrong_count", { ascending: false })
        .order("level", { ascending: true });
      if (dueError) throw dueError;

      const { data: topicAgg, error: topicError } = await supabase
        .from("flashcards")
        .select("topic,subtopic,correct_count,wrong_count,dont_know_count,review_count")
        .eq("user_id", userId);
      if (topicError) throw topicError;

      const topicMap = new Map<string, { key: string; wrong: number; correct: number; reviews: number }>();
      for (const row of topicAgg ?? []) {
        const key = `${row.topic}::${row.subtopic ?? ""}`;
        const current = topicMap.get(key) ?? { key, wrong: 0, correct: 0, reviews: 0 };
        current.wrong += (row.wrong_count ?? 0) + (row.dont_know_count ?? 0);
        current.correct += row.correct_count ?? 0;
        current.reviews += row.review_count ?? 0;
        topicMap.set(key, current);
      }

      const weakTopics = [...topicMap.values()]
        .map((row) => ({
          topic: row.key.split("::")[0] || "Geral",
          subtopic: row.key.split("::")[1] || "",
          wrongRate: row.reviews > 0 ? row.wrong / Math.max(1, row.reviews) : 0,
          reviews: row.reviews,
        }))
        .sort((a, b) => b.wrongRate - a.wrongRate || b.reviews - a.reviews)
        .slice(0, 5);

      const intervals = (dueCards ?? []).reduce(
        (acc, row) => {
          const d = row.interval_days ?? 1;
          if (d <= 1) acc.d1 += 1;
          else if (d <= 3) acc.d3 += 1;
          else if (d <= 7) acc.d7 += 1;
          else if (d <= 14) acc.d14 += 1;
          else acc.d30 += 1;
          return acc;
        },
        { d1: 0, d3: 0, d7: 0, d14: 0, d30: 0 }
      );

      const retentionTrend = (topicAgg ?? []).reduce(
        (acc, row) => {
          acc.correct += row.correct_count ?? 0;
          acc.total += (row.correct_count ?? 0) + (row.wrong_count ?? 0) + (row.dont_know_count ?? 0);
          return acc;
        },
        { correct: 0, total: 0 }
      );

      return jsonResponse({
        cards: dueCards ?? [],
        metrics: {
          dueToday: (dueCards ?? []).length,
          intervalBuckets: intervals,
          weakTopics,
          retentionPct:
            retentionTrend.total > 0
              ? Math.round((retentionTrend.correct / retentionTrend.total) * 100)
              : 0,
        },
      });
    }

    if (action === "review") {
      const flashcardId = body?.flashcardId as string | undefined;
      const rating = body?.rating as Rating | undefined;
      const responseTimeSec = Number(body?.responseTimeSec ?? 0);
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

      const schedule = nextSchedule({
        intervalDays: card.interval_days ?? 1,
        level: card.level ?? 0,
        easeFactor: Number(card.ease_factor ?? 2.5),
      }, rating);

      const nowIso = new Date().toISOString();
      const isAgain = rating === "again";

      const { error: updateError } = await supabase
        .from("flashcards")
        .update({
          interval_days: schedule.nextIntervalDays,
          next_review: schedule.nextReviewDate,
          next_review_at: schedule.nextReviewAt,
          ease_factor: schedule.nextEase,
          level: schedule.nextLevel,
          review_count: (card.review_count ?? 0) + 1,
          last_seen_at: nowIso,
          correct_count: (card.correct_count ?? 0) + (isAgain ? 0 : 1),
          wrong_count: (card.wrong_count ?? 0) + (isAgain ? 1 : 0),
          dont_know_count: (card.dont_know_count ?? 0),
        })
        .eq("id", card.id);
      if (updateError) throw updateError;

      const { error: reviewError } = await supabase.from("flashcard_reviews").insert({
        user_id: userId,
        flashcard_id: card.id,
        rating,
        response_time_sec: Number.isFinite(responseTimeSec) ? Math.max(0, Math.round(responseTimeSec)) : null,
        previous_level: card.level ?? 0,
        new_level: schedule.nextLevel,
        previous_interval_days: card.interval_days ?? 1,
        new_interval_days: schedule.nextIntervalDays,
      });
      if (reviewError) throw reviewError;

      return jsonResponse({ success: true });
    }

    if (action === "upsert_from_error") {
      const payload = body?.payload as Record<string, unknown> | undefined;
      if (!payload) return jsonResponse({ error: "Missing payload." }, 400);

      const sourceId = typeof payload.source_id === "string" ? payload.source_id : null;
      const resultType = payload.result_type === "dont_know" ? "dont_know" : "wrong";
      const nowIso = new Date().toISOString();

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
            topic: payload.topic ?? existing.topic ?? "Geral",
            subtopic: payload.subtopic ?? existing.subtopic ?? "",
            skills: payload.skills ?? existing.skills ?? [],
            example_context: payload.example_context ?? existing.example_context ?? null,
            image_url: payload.image_url ?? existing.image_url ?? null,
            last_seen_at: nowIso,
            next_review_at: nowIso,
            next_review: nowIso.split("T")[0],
            interval_days: 1,
            level: 0,
            wrong_count: Number(existing.wrong_count ?? 0) + (resultType === "wrong" ? 1 : 0),
            dont_know_count: Number(existing.dont_know_count ?? 0) + (resultType === "dont_know" ? 1 : 0),
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
          topic: payload.topic ?? "Geral",
          subtopic: payload.subtopic ?? "",
          skills: payload.skills ?? [],
          example_context: payload.example_context ?? null,
          image_url: payload.image_url ?? null,
          level: 0,
          interval_days: 1,
          next_review_at: nowIso,
          next_review: nowIso.split("T")[0],
          wrong_count: resultType === "wrong" ? 1 : 0,
          dont_know_count: resultType === "dont_know" ? 1 : 0,
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
