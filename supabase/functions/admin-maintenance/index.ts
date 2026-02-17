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
      // Count questions before deletion
      const { count: beforeCount, error: countError } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true });
      if (countError) throw countError;

      // Delete dependent tables first (FK constraints)
      const { error: e1 } = await supabase
        .from("question_pedagogy")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e1) throw new Error(`Erro ao limpar question_pedagogy: ${e1.message}`);

      const { error: e2 } = await supabase
        .from("question_attempts")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e2) throw new Error(`Erro ao limpar question_attempts: ${e2.message}`);

      const { error: e3 } = await supabase
        .from("user_question_history")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e3) throw new Error(`Erro ao limpar user_question_history: ${e3.message}`);

      // Reset user_topic_profile
      const { error: e4 } = await supabase
        .from("user_topic_profile")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e4) throw new Error(`Erro ao limpar user_topic_profile: ${e4.message}`);

      // Clean up question images from storage
      try {
        const { data: files } = await supabase.storage
          .from("question-images")
          .list("", { limit: 1000 });
        if (files && files.length > 0) {
          // List all folders (user folders)
          for (const folder of files) {
            if (folder.id === null) {
              // It's a folder, list its contents
              const { data: innerFiles } = await supabase.storage
                .from("question-images")
                .list(folder.name, { limit: 1000 });
              if (innerFiles && innerFiles.length > 0) {
                const paths = innerFiles.map(f => `${folder.name}/${f.name}`);
                await supabase.storage.from("question-images").remove(paths);
              }
            }
          }
        }
      } catch (storageErr) {
        console.warn("[admin-maintenance] storage cleanup warning:", storageErr);
        // Don't fail the whole operation for storage cleanup
      }

      // Now delete questions
      const { error: deleteError } = await supabase
        .from("questions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({
          success: true,
          deleted: beforeCount ?? 0,
          message: `${beforeCount ?? 0} questões removidas (incluindo dados relacionados).`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // clear_flashcards
    const { count: flashcardsCount, error: flashcardsCountError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true });
    if (flashcardsCountError) throw flashcardsCountError;

    // Delete dependent flashcard_reviews first
    const { error: reviewsError } = await supabase
      .from("flashcard_reviews")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (reviewsError) throw new Error(`Erro ao limpar flashcard_reviews: ${reviewsError.message}`);

    const { error: clearFlashcardsError } = await supabase
      .from("flashcards")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (clearFlashcardsError) throw clearFlashcardsError;

    return new Response(
      JSON.stringify({
        success: true,
        deleted: flashcardsCount ?? 0,
        message: `${flashcardsCount ?? 0} flashcards removidos (incluindo revisões).`,
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
