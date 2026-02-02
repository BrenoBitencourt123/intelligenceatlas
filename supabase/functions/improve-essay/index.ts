import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um professor especialista em redação ENEM. Sua tarefa é reescrever a redação do aluno mantendo TODAS as ideias originais, mas melhorando:

1. COMPETÊNCIA 1: Gramática, ortografia, pontuação
2. COMPETÊNCIA 2: Compreensão do tema e uso de repertório
3. COMPETÊNCIA 3: Organização e progressão dos argumentos
4. COMPETÊNCIA 4: Coesão (conectivos, referências, articulação)
5. COMPETÊNCIA 5: Proposta de intervenção completa (agente + ação + meio + finalidade + detalhamento)

REGRAS IMPORTANTES:
- MANTENHA o mesmo número de parágrafos
- MANTENHA as ideias e argumentos do aluno
- NÃO adicione informações que o aluno não mencionou
- Melhore a estrutura, conectivos e clareza
- Na conclusão, garanta os 5 elementos da proposta de intervenção
- Use linguagem formal adequada ao ENEM
- Separe cada parágrafo com uma linha em branco

Retorne APENAS o texto melhorado, sem explicações ou comentários.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { blocks, theme } = await req.json();
    
    if (!blocks || blocks.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum bloco para melhorar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Format blocks for the prompt
    const formattedBlocks = blocks.map((block: { type: string; text: string }, index: number) => {
      const typeLabel = block.type === 'introduction' ? 'INTRODUÇÃO' : 
                       block.type === 'conclusion' ? 'CONCLUSÃO' : 
                       `DESENVOLVIMENTO ${index}`;
      return `[${typeLabel}]\n${block.text}`;
    }).join('\n\n');

    const userPrompt = `${theme ? `TEMA: ${theme}\n\n` : ''}REDAÇÃO ORIGINAL:

${formattedBlocks}

Reescreva a redação completa, mantendo o mesmo número de parágrafos e as mesmas ideias do aluno, mas com melhorias de escrita para atingir nota alta no ENEM.`;

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
      throw new Error("Erro ao gerar versão melhorada");
    }

    const data = await response.json();
    const improvedText = data.choices?.[0]?.message?.content;
    
    if (!improvedText) {
      throw new Error("Resposta vazia da IA");
    }

    return new Response(
      JSON.stringify({ improvedText: improvedText.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("improve-essay error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
