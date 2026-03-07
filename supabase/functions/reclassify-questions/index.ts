import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CLASSIFY_FN = "classify-question";
const BATCH_DELAY_MS = 250;
const MAX_PER_CALL = 15; // Keep well under 60s timeout

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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Use anon key client with user auth for admin check
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin check
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !userData?.user?.id) return jsonResponse({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return jsonResponse({ error: "Admin only" }, 403);

    const body = await req.json().catch(() => ({}));

    // Use service role client for querying and invoking functions
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Build question IDs list from filters
    let questionIds: string[] = [];

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      questionIds = body.ids as string[];
    } else {
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

      // Use offset for pagination across calls
      const offset = Number(body.offset) || 0;
      query = query.range(offset, offset + MAX_PER_CALL - 1);

      const { data, error } = await query;
      if (error) throw error;
      questionIds = (data ?? []).map((r) => r.id as string);
    }

    if (questionIds.length === 0) {
      return jsonResponse({ processed: 0, errors: [], remaining: 0, message: "No questions to classify." });
    }

    // Also get total count for remaining calculation
    let totalRemaining = 0;
    if (!Array.isArray(body.ids)) {
      let countQuery = supabase.from("questions").select("id", { count: "exact", head: true });
      if (body.year) countQuery = countQuery.eq("year", Number(body.year));
      if (body.needs_review === true) countQuery = countQuery.eq("needs_review", true);
      if (body.unclassified === true) countQuery = countQuery.is("classified_at", null);
      const { count } = await countQuery;
      const offset = Number(body.offset) || 0;
      totalRemaining = Math.max(0, (count ?? 0) - offset - questionIds.length);
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

      if (processed < questionIds.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    return jsonResponse({
      processed,
      total: questionIds.length,
      errors,
      remaining: totalRemaining,
    });
  } catch (err) {
    console.error("[reclassify-questions] error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
