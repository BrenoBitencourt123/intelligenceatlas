import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um corretor especialista em redações do ENEM. Sua função é analisar uma redação completa, avaliando CADA BLOCO individualmente E atribuindo notas às 5 competências oficiais.

## PARTE 1 - ANÁLISE DE CADA BLOCO

Para cada bloco (introdução, desenvolvimento, conclusão), retorne:
- summary: Avaliação em 2-3 frases didáticas
- whyItMatters: Por que esse tipo de bloco importa no ENEM
- checklist: Critérios avaliados com status checked (true/false)
- textEvidence: Trechos com problemas e sugestões
- howToImprove: Passos concretos de melhoria
- strengths: Pontos fortes identificados
- cohesionTip: Sugestão de conectivo (ou null)
- tags: Tags relevantes

CRITÉRIOS POR TIPO DE BLOCO:

INTRODUÇÃO:
- Contextualização do tema (histórica, social, cultural)
- Tese clara e assertiva
- Repertório sociocultural (citação, dado, referência)
- Gancho inicial que prende atenção
- CONECTIVO: Expressões como "Diante desse cenário", "Nesse contexto", "Sob essa perspectiva" são válidos

DESENVOLVIMENTO:
- Conectivo inicial que liga ao parágrafo anterior
- Argumento central claro
- Evidências/exemplos concretos (dados, citações, casos)
- RELAÇÃO CAUSA-EFEITO: Construções como "o que provoca", "contribui para", "resultando em" são válidas
- CONEXÃO COM A TESE: Se argumenta coerentemente sobre o tema, marque TRUE

CONCLUSÃO:
- Retomada da tese
- Proposta de intervenção com 5 elementos:
  1. AGENTE (quem vai agir)
  2. AÇÃO (o que será feito)
  3. MEIO (como será feito)
  4. FINALIDADE (para quê)
  5. DETALHAMENTO (especificação de pelo menos um elemento)

## PARTE 2 - AVALIAÇÃO DAS 5 COMPETÊNCIAS (cada uma 0-200, múltiplos de 40)

**C1 - Domínio da norma culta**
- 200: Excelente domínio, desvios mínimos
- 160: Bom domínio, poucos desvios
- 120: Domínio mediano
- 80: Domínio insuficiente
- 40: Domínio precário
- 0: Desconhecimento total

**C2 - Compreensão da proposta e repertório**
- 200: Excelente + repertório diversificado
- 160: Boa + repertório legitimado
- 120: Adequada + repertório limitado
- 80: Parcial ou tangenciamento
- 40: Mínima
- 0: Fuga ao tema

**C3 - Seleção e organização de argumentos**
- 200: Projeto estratégico, argumentação consistente
- 160: Boa organização, argumentação coerente
- 120: Argumentação previsível
- 80: Superficial
- 40: Informações desconexas
- 0: Sem defesa de ponto de vista

**C4 - Mecanismos linguísticos (coesão)**
- 200: Articulação excelente, conectivos diversificados
- 160: Boa articulação
- 120: Articulação mediana
- 80: Insuficiente
- 40: Precária
- 0: Ausência de articulação

**C5 - Proposta de intervenção**
- 200: Completa com 5 elementos + respeita direitos humanos
- 160: 4 elementos
- 120: 3 elementos
- 80: 2 elementos
- 40: 1 elemento
- 0: Sem proposta ou desrespeita direitos humanos

INSTRUÇÕES:
1. Avalie o texto COMO UM TODO para competências
2. Seja JUSTO: redação bem estruturada merece notas altas (160-200)
3. NÃO PUNA excessivamente por erros menores

FORMATO DE RESPOSTA (JSON obrigatório):
{
  "blockAnalyses": {
    "introduction": { análise do bloco introdução se existir },
    "development_1": { análise do primeiro desenvolvimento },
    "development_2": { análise do segundo desenvolvimento se existir },
    "conclusion": { análise da conclusão se existir }
  },
  "competencies": [
    {"id": "c1", "score": <0-200>, "explanation": "Justificativa breve"},
    {"id": "c2", "score": <0-200>, "explanation": "Justificativa breve"},
    {"id": "c3", "score": <0-200>, "explanation": "Justificativa breve"},
    {"id": "c4", "score": <0-200>, "explanation": "Justificativa breve"},
    {"id": "c5", "score": <0-200>, "explanation": "Justificativa breve"}
  ],
  "totalScore": <soma das 5 competências>,
  "overallFeedback": "Avaliação geral em 2-3 frases"
}

Onde cada análise de bloco segue o formato:
{
  "summary": "Avaliação em 2-3 frases",
  "whyItMatters": "Por que importa no ENEM",
  "checklist": [{"id": "string", "label": "Critério", "checked": true/false, "description": "Explicação"}],
  "textEvidence": [{"quote": "Trecho", "issue": "Problema", "suggestion": "Sugestão"}],
  "howToImprove": ["Passo 1", "Passo 2"],
  "strengths": ["Ponto forte 1"],
  "cohesionTip": {"current": "usado", "suggested": "alternativa", "explanation": "motivo"} ou null,
  "tags": ["tag1", "tag2"]
}`;

// GPT-4.1-mini pricing per 1M tokens
const INPUT_COST_PER_MILLION = 0.40;
const OUTPUT_COST_PER_MILLION = 1.60;

const calculateCost = (promptTokens: number, completionTokens: number): number => {
  return (promptTokens * INPUT_COST_PER_MILLION / 1_000_000) + 
         (completionTokens * OUTPUT_COST_PER_MILLION / 1_000_000);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Não autorizado. Faça login para continuar." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida. Faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = claimsData.user;

    // ===== QUOTA VALIDATION =====
    // Get user's plan type and flexible quota setting
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('plan_type, flexible_quota')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error("Failed to fetch user profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar plano do usuário." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const planType = profile.plan_type || 'free';
    const isFlexibleMode = profile.flexible_quota === true;
    
    // Define limits per plan
    const limits: Record<string, { monthly: number; daily: number }> = {
      free: { monthly: 1, daily: 1 },
      basic: { monthly: 30, daily: 1 },
      pro: { monthly: 60, daily: 2 },
    };

    const userLimits = limits[planType] || limits.free;

    // Calculate start of month and start of today
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Count monthly analyzed essays
    const { count: monthlyCount, error: monthlyError } = await supabaseClient
      .from('essays')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('analyzed_at', 'is', null)
      .gte('analyzed_at', startOfMonth.toISOString());

    if (monthlyError) {
      console.error("Failed to count monthly essays:", monthlyError);
    }

    // For free plan, check total (not monthly)
    if (planType === 'free') {
      const { count: totalCount } = await supabaseClient
        .from('essays')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('analyzed_at', 'is', null);

      if ((totalCount ?? 0) >= userLimits.monthly) {
        return new Response(
          JSON.stringify({ 
            error: 'Você usou sua redação gratuita. Assine para continuar.',
            code: 'QUOTA_EXCEEDED',
            limit_type: 'total'
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Check monthly limit for basic/pro
      if ((monthlyCount ?? 0) >= userLimits.monthly) {
        return new Response(
          JSON.stringify({ 
            error: 'Limite de correções do mês atingido.',
            code: 'QUOTA_EXCEEDED',
            limit_type: 'monthly'
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Only check daily limit if flexible mode is NOT enabled
      if (!isFlexibleMode) {
        // Count today's analyzed essays
        const { count: todayCount, error: todayError } = await supabaseClient
          .from('essays')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('analyzed_at', 'is', null)
          .gte('analyzed_at', startOfToday.toISOString());

        if (todayError) {
          console.error("Failed to count today's essays:", todayError);
        }

        // Check daily limit
        if ((todayCount ?? 0) >= userLimits.daily) {
          return new Response(
            JSON.stringify({ 
              error: 'Limite diário de correções atingido. Volte amanhã!',
              code: 'QUOTA_EXCEEDED',
              limit_type: 'daily'
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }
    // ===== END QUOTA VALIDATION =====

    const { blocks, theme } = await req.json();
    
    if (!blocks || blocks.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum bloco para analisar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter blocks with content
    const blocksWithContent = blocks.filter((b: { text: string }) => b.text?.trim().length > 0);
    
    if (blocksWithContent.length === 0) {
      return new Response(
        JSON.stringify({ error: "Adicione texto antes de analisar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Build essay with block labels and IDs for mapping
    const essayParts: string[] = [];
    const blockMapping: { id: string; type: string; key: string }[] = [];
    
    let devIndex = 0;
    for (const block of blocksWithContent) {
      let label: string;
      let key: string;
      
      if (block.type === 'introduction') {
        label = 'INTRODUÇÃO';
        key = 'introduction';
      } else if (block.type === 'development') {
        devIndex++;
        label = `DESENVOLVIMENTO ${devIndex}`;
        key = `development_${devIndex}`;
      } else {
        label = 'CONCLUSÃO';
        key = 'conclusion';
      }
      
      blockMapping.push({ id: block.id, type: block.type, key });
      essayParts.push(`[${label}] (id: ${block.id})\n${block.text}`);
    }
    
    const fullEssay = essayParts.join('\n\n');

    const userPrompt = `Analise esta redação do ENEM completa: avalie cada bloco individualmente E atribua notas às 5 competências.

${theme ? `TEMA DA REDAÇÃO: ${theme}\n` : ''}
REDAÇÃO COMPLETA:
"""
${fullEssay}
"""

Blocos para analisar: ${blockMapping.map(b => b.key).join(', ')}

Retorne APENAS o JSON no formato especificado, sem texto adicional.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Chave da API OpenAI inválida." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Erro ao processar análise");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const usage = data.usage;
    
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Resposta da IA em formato inválido");
    }

    // Validate required fields
    if (!result.blockAnalyses || !result.competencies || result.competencies.length !== 5) {
      console.error("Incomplete response:", result);
      throw new Error("Resposta da IA incompleta");
    }

    // Map block analyses to block IDs for frontend consumption
    const blockAnalysesById: Record<string, unknown> = {};
    for (const mapping of blockMapping) {
      const analysis = result.blockAnalyses[mapping.key];
      if (analysis) {
        blockAnalysesById[mapping.id] = analysis;
      }
    }

    // Ensure competency scores are multiples of 40 and within range
    for (const comp of result.competencies) {
      comp.score = Math.min(200, Math.max(0, Math.round(comp.score / 40) * 40));
    }
    
    // Recalculate total
    result.totalScore = result.competencies.reduce(
      (sum: number, c: { score: number }) => sum + c.score, 
      0
    );

    // Calculate cost and log token usage
    let tokenUsage = null;
    if (usage) {
      const estimatedCost = calculateCost(usage.prompt_tokens, usage.completion_tokens);
      
      tokenUsage = {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        estimated_cost_usd: estimatedCost,
      };

      // Log to database
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
          
          await supabaseClient.from('token_usage').insert({
            operation_type: 'analyze-essay',
            block_type: null,
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
            estimated_cost_usd: estimatedCost,
          });
        }
      } catch (dbError) {
        console.error("Failed to log token usage:", dbError);
      }
    }

    return new Response(
      JSON.stringify({
        blockAnalyses: blockAnalysesById,
        competencies: result.competencies,
        totalScore: result.totalScore,
        overallFeedback: result.overallFeedback,
        usage: tokenUsage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-essay error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
