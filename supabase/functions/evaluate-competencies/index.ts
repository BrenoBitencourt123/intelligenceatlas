import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um corretor especialista em redações do ENEM. Sua função é avaliar uma redação completa e atribuir notas às 5 competências oficiais do ENEM.

COMPETÊNCIAS DO ENEM (cada uma vale de 0 a 200 pontos, em múltiplos de 40):

**COMPETÊNCIA 1 - Domínio da norma culta da língua escrita**
Avalia: ortografia, acentuação, pontuação, concordância, regência, colocação pronominal, paralelismo sintático.
- 200: Excelente domínio, desvios mínimos
- 160: Bom domínio, poucos desvios
- 120: Domínio mediano, alguns desvios
- 80: Domínio insuficiente, muitos desvios
- 40: Domínio precário
- 0: Desconhecimento total

**COMPETÊNCIA 2 - Compreensão da proposta e aplicação de conceitos**
Avalia: compreensão do tema, uso de repertório sociocultural (citações, dados, referências históricas, filosóficas, artísticas).
- 200: Excelente compreensão + repertório legitimado, produtivo e diversificado
- 160: Boa compreensão + repertório legitimado
- 120: Compreensão adequada + repertório limitado
- 80: Compreensão parcial ou tangenciamento
- 40: Compreensão mínima
- 0: Fuga ao tema

**COMPETÊNCIA 3 - Seleção e organização de argumentos**
Avalia: progressão textual, organização das ideias, relação entre argumentos e tese.
- 200: Projeto de texto estratégico, argumentação consistente e bem desenvolvida
- 160: Boa organização, argumentação coerente
- 120: Argumentação previsível, pouca progressão
- 80: Argumentação superficial
- 40: Informações desconexas
- 0: Sem defesa de ponto de vista

**COMPETÊNCIA 4 - Conhecimento dos mecanismos linguísticos**
Avalia: uso de conectivos, referenciação, substituição lexical, coesão entre parágrafos e períodos.
- 200: Articulação excelente, repertório diversificado de conectivos
- 160: Boa articulação, poucas inadequações
- 120: Articulação mediana, repetições
- 80: Articulação insuficiente
- 40: Articulação precária
- 0: Ausência de articulação

**COMPETÊNCIA 5 - Proposta de intervenção detalhada**
Avalia: presença dos 5 elementos obrigatórios:
1. AGENTE (quem vai fazer)
2. AÇÃO (o que será feito)
3. MEIO/MODO (como será feito)
4. FINALIDADE (para quê)
5. DETALHAMENTO (especificação de qualquer elemento)
- 200: Proposta completa com todos os 5 elementos + respeita direitos humanos
- 160: 4 elementos presentes
- 120: 3 elementos presentes
- 80: 2 elementos presentes
- 40: 1 elemento presente
- 0: Sem proposta ou desrespeita direitos humanos

INSTRUÇÕES IMPORTANTES:
1. Avalie o texto COMO UM TODO, não apenas blocos isolados
2. Seja JUSTO: uma redação bem estruturada com tema claro, argumentos consistentes e proposta completa merece notas altas (160-200)
3. Considere o contexto do ENEM real: alunos que escrevem bem e seguem a estrutura devem ser recompensados
4. NÃO PUNA excessivamente por erros menores se a estrutura geral estiver boa
5. Cada nota DEVE ser múltiplo de 40 (0, 40, 80, 120, 160, 200)

FORMATO DE RESPOSTA (JSON obrigatório):
{
  "competencies": [
    {"id": "c1", "score": <0-200>, "explanation": "Justificativa breve"},
    {"id": "c2", "score": <0-200>, "explanation": "Justificativa breve"},
    {"id": "c3", "score": <0-200>, "explanation": "Justificativa breve"},
    {"id": "c4", "score": <0-200>, "explanation": "Justificativa breve"},
    {"id": "c5", "score": <0-200>, "explanation": "Justificativa breve"}
  ],
  "totalScore": <soma das 5 competências>,
  "overallFeedback": "Avaliação geral da redação em 2-3 frases"
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
    const { blocks, theme } = await req.json();
    
    if (!blocks || blocks.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum bloco para avaliar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Build full essay text with block labels
    const essayParts: string[] = [];
    for (const block of blocks) {
      const label = block.type === 'introduction' ? 'INTRODUÇÃO' 
        : block.type === 'development' ? 'DESENVOLVIMENTO' 
        : 'CONCLUSÃO';
      essayParts.push(`[${label}]\n${block.text}`);
    }
    const fullEssay = essayParts.join('\n\n');

    const userPrompt = `Avalie esta redação do ENEM e atribua notas às 5 competências.

${theme ? `TEMA DA REDAÇÃO: ${theme}\n` : ''}
REDAÇÃO COMPLETA:
"""
${fullEssay}
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
        temperature: 0.5,
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
      throw new Error("Erro ao processar avaliação");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const usage = data.usage;
    
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    let evaluation;
    try {
      evaluation = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Resposta da IA em formato inválido");
    }

    // Validate required fields
    if (!evaluation.competencies || evaluation.competencies.length !== 5) {
      throw new Error("Resposta da IA incompleta");
    }

    // Ensure scores are multiples of 40 and within range
    for (const comp of evaluation.competencies) {
      comp.score = Math.min(200, Math.max(0, Math.round(comp.score / 40) * 40));
    }
    
    // Recalculate total
    evaluation.totalScore = evaluation.competencies.reduce(
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
            operation_type: 'evaluate-competencies',
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
      JSON.stringify({ ...evaluation, usage: tokenUsage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("evaluate-competencies error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
