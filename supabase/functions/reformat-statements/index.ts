import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify admin
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader! } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Apenas admins podem reformatar");

    const { batch_size = 10, dry_run = false } = await req.json().catch(() => ({}));

    // Fetch questions without Markdown formatting (no ** or > )
    const { data: questions, error: fetchErr } = await supabase
      .from("questions")
      .select("id, statement, number, year")
      .not("statement", "like", "%**%")
      .not("statement", "like", "%> %")
      .limit(batch_size);

    if (fetchErr) throw fetchErr;
    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, remaining: 0, message: "Nenhuma questão sem formatação encontrada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count remaining
    const { count: remaining } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .not("statement", "like", "%**%")
      .not("statement", "like", "%> %");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const results: Array<{ id: string; number: number; success: boolean; error?: string }> = [];

    for (const q of questions) {
      try {
        const formatted = await reformatStatement(q.statement, LOVABLE_API_KEY, GEMINI_API_KEY);

        if (!dry_run) {
          const { error: updateErr } = await supabase
            .from("questions")
            .update({ statement: formatted })
            .eq("id", q.id);
          if (updateErr) throw updateErr;
        }

        results.push({ id: q.id, number: q.number, success: true });
      } catch (e: any) {
        console.error(`Error formatting Q${q.number}:`, e.message);
        results.push({ id: q.id, number: q.number, success: false, error: e.message });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        successful: results.filter((r) => r.success).length,
        errors: results.filter((r) => !r.success),
        remaining: (remaining ?? 0) - results.filter((r) => r.success).length,
        dry_run,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("reformat-statements error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function reformatStatement(
  statement: string,
  lovableKey?: string,
  geminiKey?: string
): Promise<string> {
  const systemPrompt = `Você é um formatador de enunciados de questões do ENEM. Sua tarefa é aplicar formatação Markdown leve ao texto bruto para melhorar a legibilidade, mantendo o conteúdo EXATAMENTE igual (não altere, resuma ou adicione palavras).

REGRAS ESTRITAS:
1. Textos de apoio (poemas, trechos literários, letras de música, citações longas) devem usar bloco de citação Markdown: cada linha prefixada com "> "
2. Referências bibliográficas (autor, livro, disponível em, acesso em, adaptado) devem ficar em itálico: *texto*
3. A pergunta final do enunciado (geralmente a última frase que termina com "é", "são", "está", etc.) deve ficar em negrito: **texto**
4. Preserve TODAS as quebras de linha existentes
5. NÃO altere nenhuma palavra do texto original
6. NÃO adicione comentários, explicações ou texto extra
7. Retorne APENAS o texto reformatado, sem delimitadores de código

EXEMPLO DE ENTRADA:
O cântico da terra
Eu sou a terra, eu sou a vida.
A ti, ó lavrador, tudo quanto é meu.
CORALINA, C. Textos e contextos. São Paulo: Global, 1997 (fragmento).
No contexto das distintas formas de apropriação da terra, o poema valoriza a relação entre

EXEMPLO DE SAÍDA:
> O cântico da terra
> Eu sou a terra, eu sou a vida.
> A ti, ó lavrador, tudo quanto é meu.

*CORALINA, C. Textos e contextos. São Paulo: Global, 1997 (fragmento).*

**No contexto das distintas formas de apropriação da terra, o poema valoriza a relação entre**`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: statement },
  ];

  // Try Lovable AI Gateway first, fallback to Gemini
  if (lovableKey) {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages,
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return cleanResponse(content);
    }
  }

  if (geminiKey) {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": geminiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash-lite",
          messages,
          temperature: 0.1,
          max_tokens: 4000,
        }),
      }
    );

    if (resp.ok) {
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return cleanResponse(content);
    }
  }

  throw new Error("Nenhuma API key disponível para reformatar");
}

function cleanResponse(text: string): string {
  // Remove code fences if present
  let cleaned = text.replace(/^```(?:markdown)?\n?/i, "").replace(/\n?```$/i, "");
  return cleaned.trim();
}
