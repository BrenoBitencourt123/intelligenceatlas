import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

DESENVOLVIMENTO:
- Conectivo inicial que liga ao parágrafo anterior
- Argumento central claro
- Evidências/exemplos concretos (dados, citações, casos)
- Relação causa-consequência
- Conexão com a tese

CONCLUSÃO:
- Retomada da tese
- Proposta de intervenção com 5 elementos:
  1. AGENTE: quem vai agir (Governo, ONGs, escolas, etc.)
  2. AÇÃO: o que deve ser feito
  3. MEIO: como será feito
  4. FINALIDADE: para que/objetivo
  5. DETALHAMENTO: especificação de pelo menos um elemento`;

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

    return new Response(
      JSON.stringify({ analysis }),
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
