import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um parser especializado em provas do ENEM. Sua função é extrair questões de texto bruto de PDFs de provas do ENEM.

REGRAS:
1. Identifique cada questão pelo padrão "QUESTÃO XX" ou "QUESTAO XX" (com ou sem acento)
2. Para cada questão, extraia:
   - O número da questão
   - O enunciado completo (incluindo textos-base, poemas, trechos citados)
   - As 5 alternativas (A, B, C, D, E)
3. IGNORE: capa, instruções, proposta de redação, folha de rascunho
4. Textos compartilhados ("Texto para as questões X a Y") devem ser incluídos no enunciado de CADA questão que os referencia
5. Mantenha formatação de poemas e citações

CLASSIFICAÇÃO POR ÁREA (baseada no número da questão e dia):
- Dia 1: questões 1-45 = "linguagens", questões 46-90 = "humanas"
- Dia 2: questões 1-45 = "natureza", questões 46-90 = "matematica"

FORMATO DE RESPOSTA (JSON):
{
  "questions": [
    {
      "number": 1,
      "area": "linguagens",
      "statement": "Texto completo do enunciado...",
      "alternatives": [
        {"letter": "A", "text": "texto da alternativa A"},
        {"letter": "B", "text": "texto da alternativa B"},
        {"letter": "C", "text": "texto da alternativa C"},
        {"letter": "D", "text": "texto da alternativa D"},
        {"letter": "E", "text": "texto da alternativa E"}
      ]
    }
  ]
}

Retorne APENAS o JSON, sem texto adicional.`;

function getAreaForQuestion(questionNumber: number, day: number): string {
  if (day === 1) {
    return questionNumber <= 45 ? "linguagens" : "humanas";
  } else {
    return questionNumber <= 45 ? "natureza" : "matematica";
  }
}

function splitTextIntoChunks(text: string, maxChunkSize = 12000): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if (currentChunk.length + line.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk);
  }
  return chunks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText, year, day } = await req.json();

    if (!pdfText || !year || !day) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: pdfText, year, day" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const chunks = splitTextIntoChunks(pdfText);
    console.log(`Processing ${chunks.length} chunks for ENEM ${year} Day ${day}`);

    const allQuestions: Array<{
      number: number;
      area: string;
      statement: string;
      alternatives: Array<{ letter: string; text: string }>;
    }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      const userPrompt = `Extraia as questões do ENEM ${year}, Dia ${day} deste trecho de texto (parte ${i + 1} de ${chunks.length}).

Se não houver questões neste trecho, retorne {"questions": []}.

TEXTO:
"""
${chunk}
"""`;

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
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI error on chunk ${i + 1}:`, response.status, errorText);
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 401) {
          return new Response(
            JSON.stringify({ error: "Chave da API inválida." }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        continue; // Skip failed chunk
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        try {
          const parsed = JSON.parse(content);
          if (parsed.questions && Array.isArray(parsed.questions)) {
            for (const q of parsed.questions) {
              // Override area classification based on question number
              q.area = getAreaForQuestion(q.number, day);
              allQuestions.push(q);
            }
          }
        } catch (parseErr) {
          console.error(`Failed to parse chunk ${i + 1}:`, parseErr);
        }
      }
    }

    // Deduplicate by question number
    const seen = new Set<number>();
    const uniqueQuestions = allQuestions.filter(q => {
      if (seen.has(q.number)) return false;
      seen.add(q.number);
      return true;
    }).sort((a, b) => a.number - b.number);

    console.log(`Extracted ${uniqueQuestions.length} unique questions`);

    return new Response(
      JSON.stringify({ questions: uniqueQuestions, total: uniqueQuestions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("parse-exam-pdf error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
