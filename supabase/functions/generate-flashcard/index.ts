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

    const prompt = `Você é um especialista em criar flashcards para o ENEM. Transforme a questão abaixo em um flashcard eficiente.

REGRAS OBRIGATÓRIAS:
1. A FRENTE deve ser uma pergunta curta e objetiva (máximo 2 linhas) que teste decisão, reconhecimento de padrão ou conceito mínimo.
2. O VERSO deve conter:
   - Explicação resumida (3-4 linhas máximo)
   - Uma linha final começando com "🎯 ENEM:" com dica prática para a prova
3. NÃO copie trechos longos do enunciado. Sintetize o conceito.
4. O flashcard deve ser respondível em 5-10 segundos.

TIPOS DE FLASHCARD (escolha o mais adequado):
- Decisão Estratégica: "Quando o enunciado traz X, o que isso indica?"
- Conceito Mínimo: "O que é X?" ou "Qual a diferença entre X e Y?"
- Pegadinha ENEM: "Se duas alternativas parecem corretas sobre X, como decidir?"

DADOS DA QUESTÃO:
Área: ${area}
Enunciado: ${statement}
Alternativas:
${alternativesText}
Resposta correta: ${correctAnswer}${correctAlt ? ` - ${correctAlt.text}` : ''}
${explanation ? `Explicação: ${explanation}` : ''}

Responda EXATAMENTE neste formato JSON:
{"front": "pergunta curta aqui", "back": "explicação resumida aqui\\n\\n🎯 ENEM: dica prática aqui"}`;

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
