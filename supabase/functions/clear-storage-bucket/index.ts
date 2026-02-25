import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bucket } = await req.json();
    if (!bucket || bucket !== "question-images") {
      return new Response(JSON.stringify({ error: "Invalid bucket" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List and delete all files recursively
    let totalDeleted = 0;
    let totalErrors = 0;

    const deleteFolder = async (prefix: string) => {
      const { data: files, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(prefix, { limit: 1000 });

      if (error) {
        console.error(`Error listing ${prefix}:`, error);
        return;
      }

      if (!files || files.length === 0) return;

      // Separate folders from files
      const folders = files.filter((f) => f.id === null);
      const realFiles = files.filter((f) => f.id !== null);

      // Delete files in this level
      if (realFiles.length > 0) {
        const paths = realFiles.map((f) =>
          prefix ? `${prefix}/${f.name}` : f.name
        );
        const { error: delError } = await supabaseAdmin.storage
          .from(bucket)
          .remove(paths);

        if (delError) {
          console.error(`Error deleting files:`, delError);
          totalErrors += paths.length;
        } else {
          totalDeleted += paths.length;
        }
      }

      // Recurse into subfolders
      for (const folder of folders) {
        const folderPath = prefix ? `${prefix}/${folder.name}` : folder.name;
        await deleteFolder(folderPath);
      }
    };

    await deleteFolder("");

    return new Response(
      JSON.stringify({ success: true, deleted: totalDeleted, errors: totalErrors }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
