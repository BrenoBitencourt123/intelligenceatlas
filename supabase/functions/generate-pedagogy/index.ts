import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questionId, statement, alternatives, correctAnswer, explanation, area, tags } = await req.json();

    if (!questionId || !statement || !correctAnswer) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cache first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: cached } = await supabase
      .from('question_pedagogy')
      .select('*')
      .eq('question_id', questionId)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const alternativesText = alternatives
      ?.map((a: { letter: string; text: string }) => `${a.letter}) ${a.text}`)
      .join('\n') ?? '';

    const correctAlt = alternatives?.find((a: { letter: string }) => a.letter === correctAnswer);
    const tagsText = Array.isArray(tags) && tags.length > 0 ? tags.join(', ') : 'não informadas';

    const prompt = `Você é um professor especialista em ENEM com foco em preparação estratégica. Analise a questão abaixo e gere conteúdo pedagógico ESPECÍFICO para ela.

REGRAS CRÍTICAS:
- NÃO faça contextualização histórica ampla ou genérica.
- FOQUE exclusivamente no conceito exigido pelo comando da questão.
- CONECTE cada explicação diretamente ao que o enunciado pede.
- IDENTIFIQUE a habilidade cognitiva específica que o ENEM está avaliando.

DADOS DA QUESTÃO:
Área: ${area}
Tags: ${tagsText}
Enunciado: ${statement}
Alternativas:
${alternativesText}
Resposta correta: ${correctAnswer}${correctAlt ? ` - ${correctAlt.text}` : ''}
${explanation ? `Explicação existente: ${explanation}` : ''}

Gere o seguinte conteúdo em JSON:

1. "pre_concept": Bloco "Antes de responder, saiba isso" com:
   - "explanation": Em 2-3 frases, explique SOMENTE o conceito-chave que o enunciado exige para resolver a questão. Não contextualize de forma ampla. Conecte diretamente ao comando da pergunta. Ex: "O enunciado pede que você identifique X, o que exige entender Y."
   - "skill": Uma frase curta descrevendo a habilidade que o ENEM avalia nesta questão (ex: "Interpretar dados em tabela para calcular variação percentual", "Relacionar causa e consequência em processos históricos específicos")
   - "formula": Fórmula ou regra-chave se aplicável (null se não houver)
   - "bullets": Array com exatamente 3 bullets que orientem o raciocínio para ESTA questão específica. Cada bullet deve ser uma dica prática de como atacar o problema, não informação genérica.

2. "cognitive_pattern": Texto explicando o padrão cognitivo que o ENEM está cobrando (máx 5 linhas). Comece identificando o tipo de habilidade (interpretação de texto, análise de dados, relação causa-efeito, etc.) e explique POR QUE o ENEM formulou a questão dessa forma.

3. "deep_lesson": Mini-aula FOCADA no conceito central desta questão (máx 8 linhas). Não repita o que já foi dito no pre_concept. Aprofunde com exemplos práticos e conexões que ajudem a fixar o conceito para questões similares.

4. "video_suggestions": Array com 2-3 sugestões de busca no YouTube para aprofundar. Cada item: {"title": "título descritivo", "query": "termo de busca no YouTube"}

Responda SOMENTE com o JSON válido, sem markdown.`;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    const pedagogy = JSON.parse(jsonMatch[0]);

    // Cache in database
    const insertData = {
      question_id: questionId,
      pre_concept: pedagogy.pre_concept || null,
      cognitive_pattern: pedagogy.cognitive_pattern || null,
      deep_lesson: pedagogy.deep_lesson || null,
      video_suggestions: pedagogy.video_suggestions || null,
    };

    await supabase.from('question_pedagogy').upsert(insertData, { onConflict: 'question_id' });

    return new Response(JSON.stringify({ ...insertData, id: questionId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-pedagogy:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
