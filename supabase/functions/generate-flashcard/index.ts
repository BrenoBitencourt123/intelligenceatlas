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

OBJETIVO: Identifique o CONCEITO-CHAVE, FÓRMULA ou REGRA que o aluno precisa dominar para resolver questões desse tipo. Crie um flashcard que ENSINA esse conceito de forma independente.

REGRAS OBRIGATÓRIAS:
1. NUNCA mencione o enunciado, a questão, imagens, gráficos, tabelas, setas, figuras ou qualquer elemento visual. O flashcard deve ser 100% autossuficiente.
2. NUNCA use frases como "na questão", "no texto", "na figura", "as setas indicam", "observe o formato". O aluno NÃO terá acesso à questão original.
3. Identifique o conceito fundamental: pode ser uma fórmula (ex: Bhaskara), uma definição (ex: o que é mitose), uma regra gramatical, um princípio físico, um período histórico, etc.
4. A FRENTE deve ser uma pergunta direta sobre o conceito. Exemplos:
   - "Qual é a fórmula de Bhaskara e quando usá-la?"
   - "O que caracteriza o bioma Cerrado?"
   - "Qual a diferença entre mitose e meiose?"
   - "O que foi a Revolução de 1930?"
5. O VERSO deve conter a resposta objetiva: fórmula, definição, lista de características ou regra prática (máximo 4 linhas).
6. Termine o verso com "🎯 ENEM: [dica de como esse conceito aparece na prova]".

Área: ${area}
Conceito extraído da questão (use apenas como referência para identificar o tema):
Resposta correta: ${correctAnswer}${correctAlt ? ` — ${correctAlt.text}` : ''}
${explanation ? `Explicação: ${explanation}` : ''}
Tópico implícito no enunciado: ${statement.substring(0, 200)}

Responda EXATAMENTE neste formato JSON:
{"front": "pergunta sobre o conceito-chave", "back": "resposta objetiva\\n\\n🎯 ENEM: dica prática"}`;

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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
