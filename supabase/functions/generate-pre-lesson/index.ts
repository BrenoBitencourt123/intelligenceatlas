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
    const { questionId } = await req.json();

    if (!questionId) {
      return new Response(JSON.stringify({ error: 'questionId obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verifica cache
    const { data: cached } = await supabase
      .from('question_pre_lesson')
      .select('items')
      .eq('question_id', questionId)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ items: cached.items }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Busca questão + pedagogia existente
    const [{ data: question }, { data: pedagogy }] = await Promise.all([
      supabase
        .from('questions')
        .select('statement, alternatives, correct_answer, area, topic, subtopic, tags, explanation, command')
        .eq('id', questionId)
        .maybeSingle(),
      supabase
        .from('question_pedagogy')
        .select('pre_concept, deep_lesson, cognitive_pattern')
        .eq('question_id', questionId)
        .maybeSingle(),
    ]);

    if (!question) {
      return new Response(JSON.stringify({ error: 'Questão não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const alternativesText = (question.alternatives as { letter: string; text: string }[])
      ?.map((a) => `${a.letter}) ${a.text}`)
      .join('\n') ?? '';

    const preConceptText = pedagogy?.pre_concept
      ? `Conceito-prévio já mapeado: ${JSON.stringify(pedagogy.pre_concept)}`
      : '';

    const prompt = `Você é um professor do vestibular UFU. Analise a questão abaixo e gere exatamente 4 micro-itens de pré-aula que ensinam o que o aluno precisa saber ANTES de responder esta questão.

QUESTÃO:
Área: ${question.area}
Tópico: ${question.topic} / ${question.subtopic}
Enunciado: ${question.statement}
${question.command ? `Comando: ${question.command}` : ''}
Alternativas:
${alternativesText}
Resposta correta: ${question.correct_answer}
${question.explanation ? `Explicação: ${question.explanation}` : ''}
${preConceptText}

REGRAS para gerar os micro-itens:
- Item 1: sempre tipo "info" — explica o conceito central em linguagem simples (campo "corpo" com 3-5 frases diretas)
- Itens 2 e 3: tipo "multipla" — perguntas de verificação sobre o conceito, NÃO sobre a questão em si
- Item 4: tipo "multipla" ou "completar" — conecta o conceito ao tipo de raciocínio da questão original
- Linguagem: simples, direta, sem jargão. Tom de professor amigo, não de livro didático.
- "gabarito" dos itens "multipla": string com a letra correta (ex: "b")
- "gabarito" dos itens "completar": string com a resposta esperada

Responda APENAS com um JSON array (sem markdown, sem texto extra):
[
  {
    "tipo": "info",
    "enunciado": "título curto do cartão",
    "corpo": "explicação do conceito em 3-5 frases simples",
    "gabarito": null,
    "feedback_acerto": null,
    "feedback_erro": null,
    "explicacao_curta": null
  },
  {
    "tipo": "multipla",
    "enunciado": "pergunta clara sobre o conceito",
    "opcoes": [
      {"id": "a", "texto": "opção A"},
      {"id": "b", "texto": "opção B"},
      {"id": "c", "texto": "opção C"},
      {"id": "d", "texto": "opção D"}
    ],
    "gabarito": "b",
    "feedback_acerto": "frase curta de reforço positivo",
    "feedback_erro": "frase curta explicando o erro",
    "explicacao_curta": "explicação da resposta correta em 1-2 frases"
  }
]`;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

    const callGemini = () => fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    let response = await callGemini();

    if (response.status === 503) {
      await new Promise(r => setTimeout(r, 1000));
      response = await callGemini();
    }

    if (!response.ok) {
      const lovableKey = Deno.env.get('LOVABLE_API_KEY');
      if (lovableKey) {
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
          }),
        });
      }
    }

    if (!response.ok) {
      return new Response(JSON.stringify({ items: null, fallback: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Resposta da IA sem JSON array');

    const items = JSON.parse(jsonMatch[0]);

    await supabase.from('question_pre_lesson').upsert(
      { question_id: questionId, items },
      { onConflict: 'question_id' },
    );

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro em generate-pre-lesson:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
