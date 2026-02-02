import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um corretor especialista em redações do ENEM. Sua função é analisar um bloco específico (introdução, desenvolvimento ou conclusão) de forma didática e construtiva.

REGRAS:
- Seja objetivo e didático
- Explique POR QUE cada ponto importa no ENEM
- Dê sugestões concretas de como melhorar
- Cite trechos específicos do texto como evidência
- Use linguagem acolhedora de professor particular

FORMATO DE RESPOSTA (JSON obrigatório):
{
  "summary": "Avaliação em 2-3 frases didáticas sobre o bloco",
  "whyItMatters": "Explicação de por que esse tipo de bloco importa no ENEM",
  "checklist": [
    {"id": "string_unica", "label": "Critério avaliado", "checked": true/false, "description": "Explicação breve"}
  ],
  "textEvidence": [
    {"quote": "Trecho exato do texto", "issue": "Problema identificado", "suggestion": "Como melhorar"}
  ],
  "howToImprove": ["Passo concreto 1", "Passo concreto 2", "Passo concreto 3"],
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "cohesionTip": {"current": "conectivo usado", "suggested": "alternativa melhor", "explanation": "por que é melhor"} ou null,
  "tags": ["tag1", "tag2"]
}

CRITÉRIOS POR TIPO DE BLOCO:

INTRODUÇÃO:
- Contextualização do tema (histórica, social, cultural)
- Tese clara e assertiva
- Repertório sociocultural (citação, dado, referência)
- Gancho inicial que prende atenção
- CONECTIVO: Qualquer expressão que faça transição lógica entre ideias. Exemplos válidos: "Diante desse cenário", "Nesse contexto", "Sob essa perspectiva", "Frente a isso", além dos clássicos "Portanto", "Além disso", etc.

DESENVOLVIMENTO:
- Conectivo inicial que liga ao parágrafo anterior (mesmos exemplos acima)
- Argumento central claro
- Evidências/exemplos concretos (dados, citações, casos)
- RELAÇÃO CAUSA-EFEITO: Identificar construções que expressem causa e consequência, mesmo que implícitas. Exemplos válidos: "o que provoca", "o que dificulta", "contribui para", "limitando", "em decorrência de", "resultando em". NÃO precisa usar as palavras "causa" ou "efeito" explicitamente.
- Conexão com a tese

CONCLUSÃO:
- Retomada da tese
- Proposta de intervenção com 5 elementos:
  1. AGENTE: quem vai agir (Governo, ONGs, escolas, etc.)
  2. AÇÃO: o que deve ser feito
  3. MEIO: como será feito
  4. FINALIDADE: para que/objetivo
  5. DETALHAMENTO: especificação de pelo menos um elemento

IMPORTANTE PARA O CHECKLIST:
- Marque como TRUE (checked: true) se o elemento estiver PRESENTE, mesmo que de forma implícita
- Expressões como "Diante desse cenário", "Nesse panorama", "Ante o exposto" SÃO conectivos válidos - marque como TRUE
- Construções como "o que dificulta X, limitando Y" ou "contribui para Z" CONTÊM relação causa-efeito - marque como TRUE
- Seja criterioso mas justo: o objetivo é avaliar se o aluno demonstrou a competência, não exigir formato específico`;

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
    const { blockType, text, theme } = await req.json();
    
    if (!text || text.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Texto muito curto para análise" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const userPrompt = `Analise este bloco de ${blockType === 'introduction' ? 'INTRODUÇÃO' : blockType === 'development' ? 'DESENVOLVIMENTO' : 'CONCLUSÃO'} de uma redação ENEM.

${theme ? `TEMA DA REDAÇÃO: ${theme}\n` : ''}
TEXTO DO BLOCO:
"""
${text}
"""

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
        temperature: 0.7,
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

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Resposta da IA em formato inválido");
    }

    // Validate required fields
    if (!analysis.summary || !analysis.checklist || !analysis.howToImprove) {
      throw new Error("Resposta da IA incompleta");
    }

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

      // Log to database using service role
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
          
          await supabaseClient.from('token_usage').insert({
            operation_type: 'analyze-block',
            block_type: blockType,
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
            estimated_cost_usd: estimatedCost,
          });
        }
      } catch (dbError) {
        console.error("Failed to log token usage:", dbError);
        // Don't fail the request if logging fails
      }
    }

    return new Response(
      JSON.stringify({ analysis, usage: tokenUsage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-block error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
