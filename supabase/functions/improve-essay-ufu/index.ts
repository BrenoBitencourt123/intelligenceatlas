import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// "Versão evoluída" — feature diferencial do modelo UFU.
// Reescreve o texto COMPLETO do aluno na melhor versão que ELE pode
// alcançar — mantendo as ideias, o repertório e o raciocínio do aluno,
// para ele ver o potencial do próprio texto naquele tema (decisão
// 10/07/26, comportamento alinhado ao improve-essay do ENEM). Mantém
// o diff anotado por critério e a tarefa de reescrita à mão.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INPUT_COST_PER_MILLION = 0.4;
const OUTPUT_COST_PER_MILLION = 1.6;

const SYSTEM_PROMPT = `Você é um professor de redação especialista na banca DIRPS/UFU. Sua tarefa é pegar a redação DO PRÓPRIO ALUNO e reescrevê-la por completo na MELHOR versão que ELA pode alcançar na rubrica oficial — mantendo as ideias, os argumentos, o repertório e o raciocínio do aluno. O objetivo é o aluno ver o potencial do texto DELE naquele tema, não receber um texto de outra pessoa.

REGRAS INEGOCIÁVEIS:
1. MANTENHA as ideias, os argumentos e o repertório do aluno. Não introduza dados, citações ou argumentos novos.
2. MANTENHA o gênero e a estrutura geral. Mesmo número aproximado de parágrafos.
3. Melhore TODOS os critérios da rubrica em que o texto perde pontos (proposta temática, gênero/discurso, coesão/coerência, convenções da escrita, leitura dos motivadores) — priorizando os mais fracos apontados na correção.
4. A versão deve continuar soando como um aluno bom escrevendo, não como um manual: eleve o texto sem vocabulário artificial nem períodos que o aluno nunca usaria.
5. Respeite o limite de 15-34 linhas (~70 caracteres por linha).
6. Cada mudança precisa ser rastreável: trecho original → trecho novo → critério → faixa que destrava.

FORMATO DE RESPOSTA (JSON puro):
{
  "improvedText": "o texto evoluído completo",
  "criteriosAlvo": [{"id": "...", "de": faixaAtual, "para": faixaAlvo}],
  "mudancas": [
    {
      "criterioId": "...",
      "antes": "trecho literal do texto original",
      "depois": "trecho correspondente no texto evoluído",
      "porque": "o que essa mudança destrava na rubrica, em 1-2 frases"
    }
  ] (5-10 mudanças, as mais importantes),
  "oQueNaoMudei": "o que ficou intocado de propósito e por quê (1-2 frases)",
  "tarefaReescrita": "instrução direta pro aluno: reescrever à mão a redação aplicando os padrões (não copiando frases), com foco específico — e submeter de novo pra correção"
}`;

const calculateCost = (p: number, c: number) =>
  (p * INPUT_COST_PER_MILLION) / 1_000_000 +
  (c * OUTPUT_COST_PER_MILLION) / 1_000_000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autorizado. Faça login para continuar." }, 401);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseClient.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return json({ error: "Sessão inválida. Faça login novamente." }, 401);
    }

    const { text, theme, genreLabel, criterios } = await req.json();
    if (!text?.trim() || !Array.isArray(criterios)) {
      return json({ error: "Envie o texto e a análise da correção." }, 400);
    }

    // Gate mínimo: só evolui quem tem ao menos 1 correção registrada
    // (a evolução é parte da correção, não um produto avulso gratuito).
    {
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (serviceKey) {
        const admin = createClient(supabaseUrl, serviceKey);
        const { count } = await admin
          .from("ufu_correcoes_uso")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        if (!count || count < 1) {
          return json({ error: "Corrija sua redação primeiro — a versão evoluída nasce da correção.", code: "sem_correcao" }, 403);
        }
      }
    }

    // 2 critérios mais fracos em % do máximo (empate: maior peso primeiro)
    const MAX: Record<string, number> = {
      proposta_tematica: 20,
      genero_discurso: 20,
      coesao_coerencia: 20,
      convencoes_escrita: 12,
      leitura_motivadores: 8,
    };
    const alvos = [...criterios]
      .filter((c: { id: string }) => MAX[c.id])
      .sort((a: { id: string; pontos: number }, b: { id: string; pontos: number }) => {
        const pa = a.pontos / MAX[a.id];
        const pb = b.pontos / MAX[b.id];
        return pa === pb ? MAX[b.id] - MAX[a.id] : pa - pb;
      })
      .slice(0, 2);

    const resumoAnalise = criterios
      .map(
        (c: { id: string; pontos: number; faixa?: string; comoSubirUmaFaixa?: string }) =>
          `- ${c.id}: ${c.pontos}/${MAX[c.id] ?? "?"} (${c.faixa ?? ""}). Para subir: ${c.comoSubirUmaFaixa ?? "-"}`,
      )
      .join("\n");

    const userPrompt = `REDAÇÃO ORIGINAL DO ALUNO (gênero: ${genreLabel ?? "não informado"}${theme ? `; tema: ${theme}` : ""}):
"""
${text}
"""

CORREÇÃO RECEBIDA (rubrica UFU):
${resumoAnalise}

CRITÉRIOS MAIS FRACOS (atenção especial neles, mas melhore o texto em todos os critérios em que perde pontos):
${alvos.map((a: { id: string; pontos: number }) => `- ${a.id} (hoje: ${a.pontos}/${MAX[a.id]})`).join("\n")}

Produza a melhor versão completa do texto do aluno. Responda APENAS com o JSON.`;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

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
      throw new Error("Erro ao gerar versão evoluída");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const usage = data.usage;
    if (!content) throw new Error("Resposta vazia da IA");

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Resposta da IA em formato inválido");
    }

    if (usage) {
      try {
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (serviceKey) {
          const admin = createClient(supabaseUrl, serviceKey);
          await admin.from("token_usage").insert({
            operation_type: "improve-essay-ufu",
            block_type: null,
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
            estimated_cost_usd: calculateCost(
              usage.prompt_tokens,
              usage.completion_tokens,
            ),
          });
        }
      } catch (dbError) {
        console.error("Failed to log token usage:", dbError);
      }
    }

    return json(result);
  } catch (error) {
    console.error("improve-essay-ufu error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
