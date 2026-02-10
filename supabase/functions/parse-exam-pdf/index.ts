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

CLASSIFICAÇÃO POR ÁREA:
Detecte a área de conhecimento de cada questão com base no CONTEÚDO e CONTEXTO:
- "linguagens": Língua Portuguesa, Literatura, Artes, Educação Física, Tecnologias da Informação, Língua Estrangeira (Inglês/Espanhol)
- "humanas": História, Geografia, Filosofia, Sociologia
- "natureza": Biologia, Química, Física
- "matematica": Matemática e suas Tecnologias

Use o conteúdo da questão para classificar. Se houver dúvida, use a posição: questões 1-45 são da primeira área do dia, 46-90 da segunda.

DETECÇÃO DO ANO:
Tente identificar o ano da prova a partir do texto (ex: "ENEM 2025", "Exame Nacional do Ensino Médio 2024"). Se encontrar, inclua no campo "detected_year".

FORMATO DE RESPOSTA (JSON):
{
  "detected_year": 2025,
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

function splitTextIntoChunks(text: string, maxChunkSize = 24000): string[] {
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

    if (!pdfText) {
      return new Response(
        JSON.stringify({ error: "Campo obrigatório: pdfText" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const chunks = splitTextIntoChunks(pdfText);
    console.log(`Processing ${chunks.length} chunks${year ? ` for ENEM ${year}` : ''}${day ? ` Day ${day}` : ''}`);

    const allQuestions: Array<{
      number: number;
      area: string;
      statement: string;
      alternatives: Array<{ letter: string; text: string }>;
    }> = [];

    let detectedYear: number | null = null;

    // Process all chunks in parallel (batches of 3 to avoid rate limits)
    const BATCH_SIZE = 3;
    const results: Array<{ questions: any[]; detected_year: number | null }> = [];

    for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
      const batch = chunks.slice(batchStart, batchStart + BATCH_SIZE);
      
      const batchPromises = batch.map(async (chunk, batchIdx) => {
        const i = batchStart + batchIdx;
        const yearHint = year ? `ENEM ${year}` : 'ENEM (detecte o ano do texto)';
        const dayHint = day ? `Dia ${day}` : '';
        
        const userPrompt = `Extraia as questões do ${yearHint}${dayHint ? `, ${dayHint}` : ''} deste trecho de texto (parte ${i + 1} de ${chunks.length}).

Se não houver questões neste trecho, retorne {"questions": [], "detected_year": null}.

TEXTO:
"""
${chunk}
"""`;

        try {
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
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
            console.error(`AI error on chunk ${i + 1}:`, response.status, errorText);
            if (response.status === 429) {
              // Wait and retry once on rate limit
              await new Promise(r => setTimeout(r, 5000));
              const retry = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash",
                  messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt },
                  ],
                  temperature: 0.2,
                  response_format: { type: "json_object" },
                }),
              });
              if (!retry.ok) return { questions: [], detected_year: null };
              const retryData = await retry.json();
              const retryContent = retryData.choices?.[0]?.message?.content;
              if (retryContent) {
                try { return JSON.parse(retryContent); } catch { return { questions: [], detected_year: null }; }
              }
            }
            return { questions: [], detected_year: null };
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            try { return JSON.parse(content); } catch { return { questions: [], detected_year: null }; }
          }
          return { questions: [], detected_year: null };
        } catch (err) {
          console.error(`Chunk ${i + 1} error:`, err);
          return { questions: [], detected_year: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      console.log(`Completed batch ${Math.floor(batchStart / BATCH_SIZE) + 1}, processed ${Math.min(batchStart + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
    }

    // Collect results
    for (const result of results) {
      if (result.detected_year && !detectedYear) {
        detectedYear = result.detected_year;
      }
      if (result.questions && Array.isArray(result.questions)) {
        for (const q of result.questions) {
          allQuestions.push(q);
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

    console.log(`Extracted ${uniqueQuestions.length} unique questions, detected year: ${detectedYear}`);

    return new Response(
      JSON.stringify({ 
        questions: uniqueQuestions, 
        total: uniqueQuestions.length,
        detected_year: detectedYear || year || null,
      }),
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
