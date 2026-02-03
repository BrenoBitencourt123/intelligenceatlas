import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StructureItem {
  id: string;
  label: string;
  description: string;
}

interface DailyTheme {
  id: string;
  date: string;
  title: string;
  motivating_text: string;
  context: string;
  guiding_questions: string[];
  structure_guide: StructureItem[];
  is_ai_generated: boolean;
  created_at: string;
}

const DEFAULT_STRUCTURE_GUIDE: StructureItem[] = [
  {
    id: "intro",
    label: "Introdução",
    description: "Contextualizar o tema + apresentar sua tese (posicionamento)",
  },
  {
    id: "dev1",
    label: "Desenvolvimento 1",
    description: "Primeiro argumento com exemplos, dados ou referências",
  },
  {
    id: "dev2",
    label: "Desenvolvimento 2",
    description: "Segundo argumento com exemplos, dados ou referências",
  },
  {
    id: "conclusion",
    label: "Conclusão",
    description: "Proposta de intervenção: agente + ação + meio + finalidade",
  },
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date from request body or use today
    let targetDate: string;
    try {
      const body = await req.json();
      targetDate = body.date || new Date().toISOString().split("T")[0];
    } catch {
      targetDate = new Date().toISOString().split("T")[0];
    }

    console.log("[generate-theme] Looking for theme on date:", targetDate);

    // Check if theme already exists for this date
    const { data: existingTheme, error: fetchError } = await supabase
      .from("daily_themes")
      .select("*")
      .eq("date", targetDate)
      .maybeSingle();

    if (fetchError) {
      console.error("[generate-theme] Error fetching theme:", fetchError);
      throw new Error("Failed to check existing theme");
    }

    if (existingTheme) {
      console.log("[generate-theme] Found existing theme:", existingTheme.title);
      return new Response(JSON.stringify({ theme: existingTheme, generated: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No theme exists - generate with AI
    console.log("[generate-theme] No theme found, generating with AI...");

    const systemPrompt = `Você é um especialista em elaborar temas de redação no estilo ENEM. Sua tarefa é criar temas relevantes, atuais e que estimulem a reflexão crítica sobre problemas sociais brasileiros.

Você deve gerar temas que:
1. Abordem questões sociais, culturais, ambientais ou políticas relevantes para o Brasil
2. Permitam argumentação de múltiplos pontos de vista
3. Possibilitem propostas de intervenção concretas
4. Sejam adequados para estudantes do ensino médio

IMPORTANTE: Responda APENAS com JSON válido, sem markdown ou texto adicional.`;

    const userPrompt = `Gere um tema de redação ENEM completo para a data ${targetDate}.

O JSON deve ter exatamente esta estrutura:
{
  "title": "Título do tema no formato ENEM (ex: 'Os desafios da educação inclusiva no Brasil')",
  "motivating_text": "Texto motivador com 2-3 parágrafos contendo: uma citação relevante de pensador/autor, dados estatísticos recentes sobre o tema, e contextualização do problema. Use aspas para citações e cite fontes.",
  "context": "Contextualização histórico-social do tema em 2-3 parágrafos, explicando as origens do problema, sua evolução e situação atual no Brasil.",
  "guiding_questions": [
    "Pergunta 1 sobre causas do problema",
    "Pergunta 2 sobre agentes envolvidos",
    "Pergunta 3 sobre dados/exemplos",
    "Pergunta 4 sobre obstáculos para solução",
    "Pergunta 5 sobre proposta de intervenção"
  ]
}

Gere um tema atual e relevante. Evite temas muito comuns como violência contra a mulher, racismo estrutural, ou educação básica - busque temas menos explorados mas igualmente importantes.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[generate-theme] OpenAI error:", errorText);
      throw new Error("Failed to generate theme with AI");
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = openaiData.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content returned from AI");
    }

    console.log("[generate-theme] AI response:", generatedContent);

    // Parse the AI response
    let parsedTheme: {
      title: string;
      motivating_text: string;
      context: string;
      guiding_questions: string[];
    };

    try {
      // Clean up potential markdown formatting
      const cleanedContent = generatedContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsedTheme = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("[generate-theme] Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI response");
    }

    // Validate required fields
    if (!parsedTheme.title || !parsedTheme.motivating_text || !parsedTheme.context || !parsedTheme.guiding_questions) {
      throw new Error("AI response missing required fields");
    }

    // Insert new theme into database
    const newTheme = {
      date: targetDate,
      title: parsedTheme.title,
      motivating_text: parsedTheme.motivating_text,
      context: parsedTheme.context,
      guiding_questions: parsedTheme.guiding_questions,
      structure_guide: DEFAULT_STRUCTURE_GUIDE,
      is_ai_generated: true,
    };

    const { data: insertedTheme, error: insertError } = await supabase
      .from("daily_themes")
      .insert([newTheme])
      .select()
      .single();

    if (insertError) {
      console.error("[generate-theme] Error inserting theme:", insertError);
      throw new Error("Failed to save generated theme");
    }

    console.log("[generate-theme] Theme generated and saved:", insertedTheme.title);

    // Log token usage
    const usage = openaiData.usage;
    if (usage) {
      const estimatedCost = (usage.prompt_tokens * 0.00015 + usage.completion_tokens * 0.0006) / 1000;
      console.log("[generate-theme] Token usage:", {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens,
        estimatedCost: `$${estimatedCost.toFixed(6)}`,
      });
    }

    return new Response(
      JSON.stringify({ theme: insertedTheme, generated: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[generate-theme] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
