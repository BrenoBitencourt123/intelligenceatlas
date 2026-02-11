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

FORMATAÇÃO DO CAMPO "statement" (USE MARKDOWN):
- Textos de apoio (poemas, trechos, citações, letras de música) devem vir em bloco de citação com "> " no início de cada linha
- O título/fonte do texto de apoio (ex: autor, obra, ano) deve vir em itálico com *texto*
- A pergunta final (o que se pede ao aluno) deve vir em **negrito**
- Preserve quebras de linha em poemas e listas usando \\n
- Separe claramente o texto-base da pergunta com uma linha em branco
- NÃO aplique Markdown nas alternativas (elas são exibidas separadamente)

Exemplo de statement formatado:
> Lá vai o trem com o menino
> Lá vai a vida a rodar
> Lá vai ciranda e destino
> Cidade e sertão e dar

*Carlos Drummond de Andrade, "Menino", 1951.*

**Com base no poema, é correto afirmar que o eu lírico expressa:**

CLASSIFICAÇÃO POR ÁREA:
Detecte a área de conhecimento de cada questão com base no CONTEÚDO e CONTEXTO:
- "linguagens": Língua Portuguesa, Literatura, Artes, Educação Física, Tecnologias da Informação, Língua Estrangeira (Inglês/Espanhol)
- "humanas": História, Geografia, Filosofia, Sociologia
- "natureza": Biologia, Química, Física
- "matematica": Matemática e suas Tecnologias

Use o conteúdo da questão para classificar. Se houver dúvida, use a posição: questões 1-45 são da primeira área do dia, 46-90 da segunda.

DETECÇÃO DO ANO:
Tente identificar o ano da prova a partir do texto (ex: "ENEM 2025", "Exame Nacional do Ensino Médio 2024"). Se encontrar, inclua no campo "detected_year".

CÁPSULAS DE CONHECIMENTO:
Para cada questão, gere também:
- "explanation": Uma explicação pedagógica de 2-4 frases que ensina o conceito central da questão (ex: o que é crônica, como funciona regra de três, o que são figuras de linguagem). NÃO diga apenas "a resposta é X" — ensine o conceito de forma didática como uma mini-aula. Use Markdown para formatar (negrito para termos-chave, itálico para exemplos).
- "tags": Array de 1-3 palavras-chave conceituais que identificam os temas da questão (ex: ["Crônica", "Gêneros textuais"], ["Regra de três", "Proporcionalidade"], ["Figuras de linguagem", "Metáfora"])

FORMATO DE RESPOSTA (JSON):
{
  "detected_year": 2025,
  "questions": [
    {
      "number": 1,
      "area": "linguagens",
      "statement": "Texto completo do enunciado com Markdown...",
      "alternatives": [
        {"letter": "A", "text": "texto da alternativa A"},
        {"letter": "B", "text": "texto da alternativa B"},
        {"letter": "C", "text": "texto da alternativa C"},
        {"letter": "D", "text": "texto da alternativa D"},
        {"letter": "E", "text": "texto da alternativa E"}
      ],
      "explanation": "**Crônica** é um gênero textual que mistura jornalismo e literatura...",
      "tags": ["Crônica", "Gêneros textuais"]
    }
  ]
}

Retorne APENAS o JSON, sem texto adicional.`;

function splitTextIntoChunks(text: string, maxChunkSize = 30000): string[] {
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

interface ChunkResult {
  questions: any[];
  detected_year: number | null;
  chunkIndex: number;
  truncated: boolean;
  chunkText: string;
}

async function callAI(apiKey: string, userPrompt: string, maxTokens = 32000): Promise<{ parsed: any; finishReason: string; usage: any }> {
  const makeRequest = async () => {
    return await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
    });
  };

  let response = await makeRequest();

  if (response.status === 429) {
    console.warn("Rate limited, retrying in 5s...");
    await new Promise(r => setTimeout(r, 5000));
    response = await makeRequest();
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI error: ${response.status}`, errorText);
    return { parsed: { questions: [], detected_year: null }, finishReason: 'error', usage: null };
  }

  const data = await response.json();
  const finishReason = data.choices?.[0]?.finish_reason || 'unknown';
  const usage = data.usage;
  const content = data.choices?.[0]?.message?.content;
  try {
    return { parsed: content ? JSON.parse(content) : { questions: [], detected_year: null }, finishReason, usage };
  } catch {
    return { parsed: { questions: [], detected_year: null }, finishReason, usage };
  }
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const chunks = splitTextIntoChunks(pdfText);
    console.log(`Processing ${chunks.length} chunks${year ? ` for ENEM ${year}` : ''}${day ? ` Day ${day}` : ''}`);

    let detectedYear: number | null = null;
    const chunkResults: ChunkResult[] = [];

    // Process chunks in parallel batches of 3
    const BATCH_SIZE = 3;
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
          const { parsed, finishReason, usage } = await callAI(GEMINI_API_KEY, userPrompt);
          console.log(`Chunk ${i + 1} finish_reason: ${finishReason}, tokens: ${JSON.stringify(usage)}`);

          const truncated = finishReason === 'length';
          if (truncated) {
            console.warn(`Chunk ${i + 1} was TRUNCATED! Output hit max_tokens limit.`);
          }

          console.log(`Chunk ${i + 1} extracted ${parsed.questions?.length || 0} questions`);

          return {
            questions: parsed.questions || [],
            detected_year: parsed.detected_year || null,
            chunkIndex: i,
            truncated,
            chunkText: chunk,
          } as ChunkResult;
        } catch (err) {
          console.error(`Chunk ${i + 1} error:`, err);
          return { questions: [], detected_year: null, chunkIndex: i, truncated: false, chunkText: chunk } as ChunkResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      chunkResults.push(...batchResults);
      console.log(`Completed batch ${Math.floor(batchStart / BATCH_SIZE) + 1}, processed ${Math.min(batchStart + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
    }

    // Collect all questions and detect year
    const allQuestions: any[] = [];
    for (const result of chunkResults) {
      if (result.detected_year && !detectedYear) {
        detectedYear = result.detected_year;
      }
      allQuestions.push(...result.questions);
    }

    // Deduplicate
    const seen = new Set<number>();
    let uniqueQuestions = allQuestions.filter(q => {
      if (seen.has(q.number)) return false;
      seen.add(q.number);
      return true;
    });

    // Detect missing questions from truncated chunks and retry
    if (uniqueQuestions.length > 0) {
      const numbers = uniqueQuestions.map(q => q.number).sort((a, b) => a - b);
      const minQ = numbers[0];
      const maxQ = numbers[numbers.length - 1];
      const extractedSet = new Set(numbers);
      const missing: number[] = [];
      for (let n = minQ; n <= maxQ; n++) {
        if (!extractedSet.has(n)) missing.push(n);
      }

      if (missing.length > 0) {
        console.log(`Missing questions detected: ${missing.join(', ')}`);

        // Find truncated chunks to retry with targeted prompt
        const truncatedChunks = chunkResults.filter(cr => cr.truncated);
        if (truncatedChunks.length > 0) {
          console.log(`Retrying ${truncatedChunks.length} truncated chunk(s) for missing questions: ${missing.join(', ')}`);

          const retryPromises = truncatedChunks.map(async (cr) => {
            const yearHint = year || detectedYear ? `ENEM ${year || detectedYear}` : 'ENEM';
            const dayHint = day ? `Dia ${day}` : '';
            const retryPrompt = `Extraia APENAS as questões de números ${missing.join(', ')} do ${yearHint}${dayHint ? `, ${dayHint}` : ''} deste trecho.

Se alguma dessas questões não estiver neste trecho, ignore-a. Retorne APENAS as questões encontradas.

Se não houver nenhuma, retorne {"questions": [], "detected_year": null}.

TEXTO:
"""
${cr.chunkText}
"""`;

            try {
              const { parsed, finishReason, usage } = await callAI(GEMINI_API_KEY, retryPrompt);
              console.log(`Retry chunk ${cr.chunkIndex + 1} finish_reason: ${finishReason}, extracted ${parsed.questions?.length || 0} questions, tokens: ${JSON.stringify(usage)}`);
              return parsed.questions || [];
            } catch (err) {
              console.error(`Retry chunk ${cr.chunkIndex + 1} error:`, err);
              return [];
            }
          });

          const retryResults = await Promise.all(retryPromises);
          for (const retryQuestions of retryResults) {
            for (const q of retryQuestions) {
              if (!seen.has(q.number)) {
                seen.add(q.number);
                uniqueQuestions.push(q);
              }
            }
          }
        }
      }
    }

    uniqueQuestions.sort((a, b) => a.number - b.number);
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
