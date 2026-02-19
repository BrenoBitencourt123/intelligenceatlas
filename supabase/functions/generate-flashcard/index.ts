import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { statement, alternatives, correctAnswer, explanation, area } = await req.json();

    if (!statement || !correctAnswer) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const alternativesText = alternatives
      ?.map((a: { letter: string; text: string }) => `${a.letter}) ${a.text}`)
      .join('\n') ?? '';

    const correctAlt = alternatives?.find((a: { letter: string }) => a.letter === correctAnswer);

    const prompt = `Você é um especialista em criar flashcards de estudo para o ENEM.

OBJETIVO: Use a questão abaixo apenas como REFERÊNCIA para identificar o conceito central que ela testa. Depois, crie um flashcard que ensina esse conceito — NÃO que reproduz a questão.

REGRAS OBRIGATÓRIAS:
1. Identifique o conceito, fórmula ou habilidade que a questão exige (ex: proporção direta, bioma cerrado, Modernismo brasileiro).
2. A FRENTE é uma pergunta direta sobre esse conceito. Exemplos: "Qual é a fórmula de proporção direta?", "O que caracteriza o Cerrado?", "O que define o Modernismo de 1922?".
3. O VERSO traz a resposta objetiva: fórmula, definição, lista de características ou regra prática (máximo 4 linhas).
4. Termine o verso com "🎯 ENEM: [dica de como identificar esse conceito na prova]".
5. NUNCA copie o enunciado. NUNCA mencione "na questão" ou "neste caso". O flashcard deve servir para QUALQUER questão do mesmo tema.

Área: ${area}
Questão (somente para referência):
${statement}
Resposta correta: ${correctAnswer}${correctAlt ? ` — ${correctAlt.text}` : ''}
${explanation ? `Explicação: ${explanation}` : ''}

Responda EXATAMENTE neste formato JSON:
{"front": "pergunta sobre o conceito", "back": "resposta objetiva\\n\\n🎯 ENEM: dica prática"}`;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*"front"[\s\S]*"back"[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    const flashcard = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ front: flashcard.front, back: flashcard.back }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-flashcard:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
