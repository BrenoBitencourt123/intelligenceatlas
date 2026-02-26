import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Prompt para modo visão (imagens de páginas do PDF)
const VISION_SYSTEM_PROMPT = `Você é um parser especializado em provas do ENEM. Analise as imagens das páginas da prova e extraia TODAS as questões visíveis.

REGRAS:
1. Identifique cada questão pelo número (ex: QUESTÃO 45 ou QUESTAO 45)
2. Para cada questão, extraia:
   - O número da questão
   - O enunciado COMPLETO (incluindo textos-base, poemas, trechos citados que aparecem na imagem)
   - As 5 alternativas (A, B, C, D, E)
3. IGNORE: capa, instruções gerais, proposta de redação, folha de rascunho
4. Textos compartilhados entre questões devem ser incluídos no enunciado de CADA questão que os referencia
5. Para elementos visuais (gráficos, mapas, tabelas, esquemas): descreva-os brevemente entre colchetes no enunciado
   Exemplo: [Gráfico de barras mostrando crescimento do PIB brasileiro de 2010 a 2020, onde o eixo Y representa bilhões de reais]
   Exemplo: [Mapa do Brasil destacando a região Nordeste com distribuição de biomas]
   Exemplo: [Tabela com 3 colunas: Elemento, Número atômico, Massa atômica — contendo Fe, Cu, Zn]
6. POSICIONAMENTO DE IMAGENS NO ENUNCIADO: Quando uma questão possui imagens (gráficos, figuras, esquemas, mapas),
   insira o placeholder {{IMG_0}}, {{IMG_1}}, etc. EXATAMENTE no ponto do enunciado onde a imagem aparece na prova original.
   O índice corresponde à ordem da imagem no array "images" (0-indexed).
   Exemplo: Se há um gráfico entre dois parágrafos de texto, o statement deve ser:
   "Primeiro parágrafo de contexto.\n\n{{IMG_0}}\n\nSegundo parágrafo com a pergunta em **negrito**"
   Se a questão tem requires_image=true, SEMPRE inclua pelo menos {{IMG_0}} no local correto do enunciado.

FORMATAÇÃO DO CAMPO "statement" (USE MARKDOWN):
- Textos de apoio (poemas, trechos, citações, letras de música) devem vir em bloco de citação com "> " no início de cada linha
- O título/fonte do texto de apoio deve vir em itálico com *texto*
- A pergunta final (o que se pede ao aluno) deve vir em **negrito**
- Preserve quebras de linha em poemas usando \\n
- Separe claramente o texto-base da pergunta com uma linha em branco
- NÃO aplique Markdown nas alternativas

CLASSIFICAÇÃO POR ÁREA:
- "linguagens": Língua Portuguesa, Literatura, Artes, Educação Física, Tecnologias da Informação, Língua Estrangeira
- "humanas": História, Geografia, Filosofia, Sociologia
- "natureza": Biologia, Química, Física
- "matematica": Matemática e suas Tecnologias

Use o conteúdo da questão para classificar. Se houver dúvida, use a posição: questões 1-45 são da primeira área do dia, 46-90 da segunda.

DETECÇÃO DO ANO:
Tente identificar o ano da prova a partir das imagens (ex: "ENEM 2025"). Se encontrar, inclua no campo "detected_year".

CÁPSULAS DE CONHECIMENTO:
Para cada questão, gere também:
- "explanation": Explicação pedagógica de 2-4 frases que ensina o conceito central. NÃO diga apenas "a resposta é X" — ensine o conceito de forma didática. Use Markdown (negrito para termos-chave, itálico para exemplos).
- "tags": Array de 1-3 palavras-chave conceituais (ex: ["Crônica", "Gêneros textuais"])
- "requires_image": true quando a questão depende de figura, gráfico, tabela, mapa ou esquema visível na prova para ser resolvida; false caso contrário.
- "image_reason": frase curta explicando por que precisa imagem (null quando requires_image for false).

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
      "tags": ["Crônica", "Gêneros textuais"],
      "requires_image": false,
      "image_reason": null
    }
  ]
}

Retorne APENAS o JSON, sem texto adicional.`;

// Prompt legado para modo texto
const TEXT_SYSTEM_PROMPT = `Você é um parser especializado em provas do ENEM. Sua função é extrair questões de texto bruto de PDFs de provas do ENEM.

REGRAS:
1. Identifique cada questão pelo padrão "QUESTÃO XX" ou "QUESTAO XX" (com ou sem acento)
2. Para cada questão, extraia o número, enunciado completo e as 5 alternativas (A-E)
3. IGNORE: capa, instruções, proposta de redação, folha de rascunho
4. Textos compartilhados devem ser incluídos no enunciado de CADA questão que os referencia

FORMATAÇÃO DO CAMPO "statement" (USE MARKDOWN):
- Textos de apoio em bloco de citação com "> "
- Título/fonte em itálico com *texto*
- Pergunta final em **negrito**

CLASSIFICAÇÃO POR ÁREA: linguagens, humanas, natureza, matematica

POSICIONAMENTO DE IMAGENS: Se uma questão depende de imagem, insira {{IMG_0}}, {{IMG_1}}, etc. no ponto exato do enunciado onde a imagem aparece na prova. Índices são 0-based e correspondem à ordem no array "images".

CÁPSULAS DE CONHECIMENTO: explanation (2-4 frases pedagógicas), tags (1-3 palavras-chave), requires_image (boolean), image_reason (string ou null)

FORMATO DE RESPOSTA (JSON):
{"detected_year": 2025, "questions": [{"number": 1, "area": "linguagens", "statement": "...", "alternatives": [{"letter": "A", "text": "..."}], "explanation": "...", "tags": [], "requires_image": false, "image_reason": null}]}

Retorne APENAS o JSON, sem texto adicional.`;

async function callAIVision(
  apiKey: string,
  images: string[],
  userPrompt: string,
  maxTokens = 16000,
): Promise<{ parsed: any; finishReason: string; usage: any }> {
  const makeRequest = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      // Conteúdo multimodal: imagens + texto
      const userContent = [
        ...images.map((img) => ({
          type: "image_url",
          image_url: { url: img },
        })),
        { type: "text", text: userPrompt },
      ];

      return await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: VISION_SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          temperature: 0.1,
          max_tokens: Math.min(maxTokens, 32000),
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let response = await makeRequest();

  if (response.status === 429) {
    console.warn("Rate limited, retrying in 5s...");
    await new Promise((r) => setTimeout(r, 5000));
    response = await makeRequest();
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI vision error: ${response.status}`, errorText);
    return { parsed: { questions: [], detected_year: null }, finishReason: "error", usage: null };
  }

  const data = await response.json();
  const finishReason = data.choices?.[0]?.finish_reason || "unknown";
  const usage = data.usage;
  const content = data.choices?.[0]?.message?.content;
  try {
    return { parsed: content ? JSON.parse(content) : { questions: [], detected_year: null }, finishReason, usage };
  } catch {
    console.error("Failed to parse model JSON response", content?.substring(0, 200));
    return { parsed: { questions: [], detected_year: null }, finishReason, usage };
  }
}

async function callAIText(
  apiKey: string,
  userPrompt: string,
  maxTokens = 32000,
): Promise<{ parsed: any; finishReason: string; usage: any }> {
  const makeRequest = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      return await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: TEXT_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: Math.min(maxTokens, 32000),
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let response = await makeRequest();

  if (response.status === 429) {
    console.warn("Rate limited, retrying in 5s...");
    await new Promise((r) => setTimeout(r, 5000));
    response = await makeRequest();
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI text error: ${response.status}`, errorText);
    return { parsed: { questions: [], detected_year: null }, finishReason: "error", usage: null };
  }

  const data = await response.json();
  const finishReason = data.choices?.[0]?.finish_reason || "unknown";
  const usage = data.usage;
  const content = data.choices?.[0]?.message?.content;
  try {
    return { parsed: content ? JSON.parse(content) : { questions: [], detected_year: null }, finishReason, usage };
  } catch {
    console.error("Failed to parse model JSON response", content?.substring(0, 200));
    return { parsed: { questions: [], detected_year: null }, finishReason, usage };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, chunk, chunkIndex, totalChunks, year, day } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const yearHint = year ? `ENEM ${year}` : "ENEM (detecte o ano)";
    const dayHint = day ? `, Dia ${day}` : "";
    const idx = chunkIndex ?? 0;
    const total = totalChunks ?? 1;

    // Modo visão: recebe array de imagens base64
    if (images && Array.isArray(images) && images.length > 0) {
      const userPrompt = `Extraia TODAS as questões visíveis nestas ${images.length} página(s) da prova ${yearHint}${dayHint} (grupo ${idx + 1} de ${total}).

Se não houver questões nestas páginas, retorne {"questions": [], "detected_year": null}.`;

      console.log(`Vision mode: processing group ${idx + 1}/${total} (${images.length} pages) for Day ${day || "?"}`);
      const { parsed, finishReason, usage } = await callAIVision(GEMINI_API_KEY, images, userPrompt);
      console.log(
        `Group ${idx + 1} finish_reason: ${finishReason}, extracted ${parsed.questions?.length || 0} questions, tokens: ${JSON.stringify(usage)}`,
      );

      return new Response(
        JSON.stringify({
          questions: parsed.questions || [],
          detected_year: parsed.detected_year || null,
          truncated: finishReason === "length",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Modo texto legado: recebe chunk de texto
    if (chunk) {
      const userPrompt = `Extraia as questões do ${yearHint}${dayHint} deste trecho de texto (parte ${idx + 1} de ${total}).

Se não houver questões neste trecho, retorne {"questions": [], "detected_year": null}.

TEXTO:
"""
${chunk}
"""`;

      console.log(`Text mode: processing chunk ${idx + 1}/${total} for Day ${day || "?"}`);
      const { parsed, finishReason, usage } = await callAIText(GEMINI_API_KEY, userPrompt);
      console.log(
        `Chunk ${idx + 1} finish_reason: ${finishReason}, extracted ${parsed.questions?.length || 0} questions, tokens: ${JSON.stringify(usage)}`,
      );

      return new Response(
        JSON.stringify({
          questions: parsed.questions || [],
          detected_year: parsed.detected_year || null,
          truncated: finishReason === "length",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Campo obrigatório: images (array) ou chunk (string)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("parse-exam-pdf error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
