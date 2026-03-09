import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCIPLINE_MAP: Record<string, string> = {
  linguagens: "linguagens",
  "ciencias-humanas": "humanas",
  "ciencias-natureza": "natureza",
  matematica: "matematica",
};

interface EnemAlternative {
  letter: string;
  text: string;
  file: string | null;
  isCorrect: boolean;
}

interface EnemQuestion {
  title: string;
  index: number;
  discipline: string;
  language: string | null;
  year: number;
  context: string;
  files: string[];
  correctAlternative: string;
  alternativesIntroduction: string;
  alternatives: EnemAlternative[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { year, user_id } = await req.json();

    if (!year || !user_id) {
      return new Response(
        JSON.stringify({ error: "year and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check which question numbers already exist for this year
    const { data: existing } = await supabase
      .from("questions")
      .select("number")
      .eq("year", year);

    const existingNumbers = new Set((existing ?? []).map((q: any) => q.number));

    // Fetch all questions from enem.dev (paginate) - both languages
    const fetchAllPages = async (langParam?: string) => {
      const result: EnemQuestion[] = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;
      while (hasMore) {
        const langQuery = langParam ? `&language=${langParam}` : '';
        const url = `https://api.enem.dev/v1/exams/${year}/questions?limit=${limit}&offset=${offset}${langQuery}`;
        console.log(`Fetching: ${url}`);
        const res = await fetch(url);
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`enem.dev API error (${res.status}): ${errText}`);
        }
        const data = await res.json();
        result.push(...(data.questions || []));
        hasMore = data.metadata?.hasMore ?? false;
        offset += limit;
      }
      return result;
    };

    // Default call returns Q1-5 as espanhol + all others
    const defaultQuestions = await fetchAllPages();
    // Fetch English Q1-5 separately
    const englishQuestions = await fetchAllPages('ingles');

    // Merge: keep all from default, add only Q1-5 ingles not already present
    const defaultKeys = new Set(defaultQuestions.map(q => `${q.index}_${q.language || ''}`));
    const extraEnglish = englishQuestions.filter(q =>
      q.language === 'ingles' && q.index >= 1 && q.index <= 5 && !defaultKeys.has(`${q.index}_${q.language}`)
    );
    const allQuestions = [...defaultQuestions, ...extraEnglish];

    console.log(`Fetched ${allQuestions.length} questions from enem.dev for year ${year} (${extraEnglish.length} extra English)`);

    // Filter out already existing
    const newQuestions = allQuestions.filter((q) => !existingNumbers.has(q.index));
    console.log(`${newQuestions.length} new questions to insert (${existingNumbers.size} already exist)`);

    if (newQuestions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Todas as ${allQuestions.length} questões de ${year} já existem no banco.`,
          imported: 0,
          skipped: allQuestions.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map to our schema and insert in batches
    const mapped = newQuestions.map((q) => {
      const area = DISCIPLINE_MAP[q.discipline] || q.discipline;

      // Build statement: context + alternativesIntroduction
      let statement = (q.context || "").trim();
      if (q.alternativesIntroduction?.trim()) {
        statement += `\n\n${q.alternativesIntroduction.trim()}`;
      }

      // Build images from files[]
      const images = (q.files || [])
        .filter((f) => f && f.length > 0)
        .map((url, i) => ({ url, order: i, caption: undefined }));

      // If there are images and no placeholders in statement, add them
      if (images.length > 0 && !statement.includes("{{IMG_")) {
        // Add placeholders at the end of the statement context (before alternativesIntroduction)
        const imgPlaceholders = images.map((_, i) => `{{IMG_${i}}}`).join("\n");
        if (q.alternativesIntroduction?.trim()) {
          // Insert before the introduction
          const contextPart = (q.context || "").trim();
          statement = `${contextPart}\n\n${imgPlaceholders}\n\n${q.alternativesIntroduction.trim()}`;
        } else {
          statement += `\n\n${imgPlaceholders}`;
        }
      }

      // Build alternatives
      const alternatives = q.alternatives.map((alt) => ({
        letter: alt.letter,
        text: alt.text || "",
        image_url: alt.file || undefined,
      }));

      // Determine foreign_language
      let foreign_language: string | null = null;
      if (q.language && q.language !== "portugues" && q.language !== null) {
        foreign_language = q.language; // "ingles" or "espanhol"
      }

      return {
        user_id,
        year: q.year,
        number: q.index,
        area,
        statement,
        alternatives: JSON.stringify(alternatives),
        correct_answer: q.correctAlternative || "A",
        images: JSON.stringify(images),
        foreign_language,
        topic: "Geral",
        subtopic: "",
        difficulty: 2,
        tags: JSON.stringify([]),
        skills: JSON.stringify([]),
        needs_review: false,
      };
    });

    // Insert in batches of 50
    let inserted = 0;
    const BATCH_SIZE = 50;
    for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
      const batch = mapped.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("questions").insert(batch);
      if (error) {
        console.error(`Error inserting batch at offset ${i}:`, error);
        throw new Error(`Erro ao inserir batch: ${error.message}`);
      }
      inserted += batch.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${inserted} questões de ${year} importadas com sucesso!`,
        imported: inserted,
        skipped: allQuestions.length - newQuestions.length,
        total_from_api: allQuestions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("import-enem-api error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
