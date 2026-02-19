import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CLASSIFY_FN = "classify-question";
const BATCH_DELAY_MS = 250; // rate-limit Gemini

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin check
    const { data: isAdmin } = await supabase.rpc("has_role", { role_name: "admin" });
    if (!isAdmin) return jsonResponse({ error: "Admin only" }, 403);

    const body = await req.json().catch(() => ({}));

    // Build question IDs list from filters
    let questionIds: string[] = [];

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      questionIds = body.ids as string[];
    } else {
      // Build query based on filters
      let query = supabase.from("questions").select("id");

      if (body.year) {
        query = query.eq("year", Number(body.year));
      }
      if (body.needs_review === true) {
        query = query.eq("needs_review", true);
      }
      if (body.unclassified === true) {
        query = query.is("classified_at", null);
      }

      // Safety limit: process at most 200 questions per call
      query = query.limit(200);

      const { data, error } = await query;
      if (error) throw error;
      questionIds = (data ?? []).map((r) => r.id as string);
    }

    if (questionIds.length === 0) {
      return jsonResponse({ processed: 0, errors: [], message: "No questions to classify." });
    }

    // Process each question
    const errors: Array<{ id: string; message: string }> = [];
    let processed = 0;

    for (const qId of questionIds) {
      try {
        const res = await supabase.functions.invoke(CLASSIFY_FN, {
          body: { questionId: qId },
        });
        if (res.error) {
          errors.push({ id: qId, message: String(res.error.message ?? res.error) });
        } else {
          processed++;
        }
      } catch (err) {
        errors.push({ id: qId, message: err instanceof Error ? err.message : "Unknown error" });
      }

      // Respect Gemini rate limit
      if (processed < questionIds.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    return jsonResponse({
      processed,
      total: questionIds.length,
      errors,
    });
  } catch (err) {
    console.error("[reclassify-questions] error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
