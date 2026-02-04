import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StructureItem {
  id: string;
  label: string;
  description: string;
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

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[generate-theme] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

    // ============ AUTHENTICATION CHECK ============
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logStep("ERROR: No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized. Authentication required." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client for auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !userData?.user) {
      logStep("ERROR: Invalid session", { error: authError?.message });
      return new Response(
        JSON.stringify({ error: "Invalid session. Please log in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("User authenticated", { userId: userData.user.id, email: userData.user.email });

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabaseAuth.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      logStep("ERROR: Admin access required", { error: roleError?.message });
      return new Response(
        JSON.stringify({ error: "Admin access required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Admin access verified");
    // ============ END AUTHENTICATION CHECK ============

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date from request body or use today
    let targetDate: string;
    try {
      const body = await req.json();
      targetDate = body.date || new Date().toISOString().split("T")[0];
    } catch {
      targetDate = new Date().toISOString().split("T")[0];
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
      return new Response(
        JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Looking for theme on date", { targetDate });

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
      logStep("Found existing theme", { title: existingTheme.title });
      return new Response(JSON.stringify({ theme: existingTheme, generated: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No theme exists - generate with AI
    logStep("No theme found, generating with AI...");

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
  ],
  "sources": [
    {
      "title": "Título do artigo, estudo ou notícia",
      "url": "https://url-real-da-fonte.com.br",
      "excerpt": "Trecho relevante que pode ser citado na redação (1-2 frases)",
      "type": "artigo|estatistica|legislacao|noticia"
    }
  ]
}

IMPORTANTE sobre sources:
- Inclua 3-5 fontes reais e verificáveis (artigos, estatísticas oficiais, legislações, notícias)
- Os URLs devem ser de sites brasileiros confiáveis (IBGE, IPEA, jornais, portais do governo)
- Os trechos devem ser úteis para citação direta na redação
- Tipos válidos: "artigo", "estatistica", "legislacao", "noticia"

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

    logStep("AI response received");

    // Parse the AI response
    let parsedTheme: {
      title: string;
      motivating_text: string;
      context: string;
      guiding_questions: string[];
      sources?: { title: string; url: string; excerpt: string; type: string }[];
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
      sources: parsedTheme.sources || [],
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

    logStep("Theme generated and saved", { title: insertedTheme.title });

    // Log token usage
    const usage = openaiData.usage;
    if (usage) {
      const estimatedCost = (usage.prompt_tokens * 0.00015 + usage.completion_tokens * 0.0006) / 1000;
      logStep("Token usage", {
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
