import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type MaintenanceAction = "clear_questions" | "clear_flashcards";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Authentication required." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment configuration");
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid session. Please log in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: isAdmin, error: roleError } = await supabaseAuth.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as MaintenanceAction | undefined;
    if (!action || !["clear_questions", "clear_flashcards"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use clear_questions or clear_flashcards." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "clear_questions") {
      const { count: beforeCount, error: countError } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true });
      if (countError) throw countError;

      const { error: deleteError } = await supabase
        .from("questions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({
          success: true,
          deleted: beforeCount ?? 0,
          message: `${beforeCount ?? 0} questoes removidas.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count: flashcardsCount, error: flashcardsCountError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true });
    if (flashcardsCountError) throw flashcardsCountError;

    const { error: clearFlashcardsError } = await supabase
      .from("flashcards")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (clearFlashcardsError) throw clearFlashcardsError;

    return new Response(
      JSON.stringify({
        success: true,
        deleted: flashcardsCount ?? 0,
        message: `${flashcardsCount ?? 0} flashcards removidos.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[admin-maintenance] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
