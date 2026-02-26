import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// All valid areas
const VALID_AREAS = ["linguagens", "humanas", "natureza", "matematica"];

const DISCIPLINAS_BY_AREA: Record<string, string[]> = {
  humanas: ["historia", "geografia", "sociologia", "filosofia"],
  natureza: ["quimica", "fisica", "biologia"],
  linguagens: ["lingua_portuguesa", "literatura", "artes", "ingles"],
  matematica: ["matematica"],
};

/**
 * Pre-classify a batch of questions to correct area + disciplina.
 * Accepts up to 30 questions per call. Uses a single LLM prompt for the batch.
 * Returns: { results: [{ index, area, disciplina }] }
 */
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

    // Verify admin
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) return jsonResponse({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub as string;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return jsonResponse({ error: "Admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const questions: Array<{ index: number; statement: string; area: string; alternatives?: string }> =
      Array.isArray(body.questions) ? body.questions : [];

    if (questions.length === 0) return jsonResponse({ results: [] });
    if (questions.length > 30) return jsonResponse({ error: "Max 30 questions per batch" }, 400);

    // Build a compact batch prompt
    const questionSummaries = questions.map((q, i) => {
      const stmt = (q.statement || "").slice(0, 300).replace(/\n/g, " ");
      const alts = (q.alternatives || "").slice(0, 200).replace(/\n/g, " | ");
      return `[${i}] AREA_ORIGINAL=${q.area} | ${stmt}${alts ? " | " + alts : ""}`;
    }).join("\n");

    const prompt = `Você é um classificador do ENEM. Para cada questão abaixo, determine a ÁREA CORRETA e a DISCIPLINA.

ÁREAS VÁLIDAS: ${VALID_AREAS.join(", ")}

DISCIPLINAS POR ÁREA:
${Object.entries(DISCIPLINAS_BY_AREA).map(([a, ds]) => `${a}: ${ds.join(", ")}`).join("\n")}

QUESTÕES:
${questionSummaries}

REGRAS:
- A área original pode estar ERRADA. Corrija baseado no conteúdo.
- Dia 1 ENEM = linguagens + humanas, Dia 2 = natureza + matematica, mas questões podem ter área trocada.
- Se a questão envolve cálculos geométricos/algébricos, é "matematica".
- Se envolve fenômenos físicos/químicos/biológicos, é "natureza".
- Se envolve textos literários/linguísticos, é "linguagens".
- Se envolve história/geografia/sociologia/filosofia, é "humanas".

Responda SOMENTE com um JSON array. Sem markdown, sem texto extra:
[{"i":0,"area":"area_correta","disciplina":"disciplina_id"},{"i":1,"area":"area_correta","disciplina":"disciplina_id"},...]`;

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    let llmContent = "";

    if (apiKey) {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 2000,
          }),
        }
      );
      if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
      const data = await response.json();
      llmContent = data.choices?.[0]?.message?.content ?? "";
    } else if (lovableKey) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });
      if (!response.ok) throw new Error(`Lovable AI error: ${response.status}`);
      const data = await response.json();
      llmContent = data.choices?.[0]?.message?.content ?? "";
    } else {
      // No API key — return original areas unchanged
      return jsonResponse({
        results: questions.map((q, i) => ({
          index: q.index,
          area: q.area,
          disciplina: null,
        })),
      });
    }

    // Parse the LLM response
    const jsonMatch = llmContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[pre-classify-batch] No JSON array in response:", llmContent.slice(0, 500));
      // Return originals on parse failure
      return jsonResponse({
        results: questions.map((q) => ({
          index: q.index,
          area: q.area,
          disciplina: null,
        })),
      });
    }

    const parsed: Array<{ i: number; area: string; disciplina: string }> = JSON.parse(jsonMatch[0]);

    // Validate and map back
    const results = questions.map((q, i) => {
      const match = parsed.find((p) => p.i === i);
      if (!match) return { index: q.index, area: q.area, disciplina: null };

      const correctedArea = VALID_AREAS.includes(match.area) ? match.area : q.area;
      const validDisciplinas = DISCIPLINAS_BY_AREA[correctedArea] || [];
      const disciplina = validDisciplinas.includes(match.disciplina) ? match.disciplina : null;

      return { index: q.index, area: correctedArea, disciplina };
    });

    return jsonResponse({ results });
  } catch (err) {
    console.error("[pre-classify-batch] error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
