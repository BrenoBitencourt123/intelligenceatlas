import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// Corretor de redação — modelo VESTIBULAR UFU (banca DIRPS)
// Rubrica oficial do Edital 18/2026 (Quadro 2): 5 critérios, 80 pts,
// notas por FAIXA. Nota zero em qualquer condição eliminatória = eliminado.
// Espelho da rubrica em src/data/ufu/redacao.ts — manter em sincronia.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// gpt-4.1-mini (mesmo modelo do analyze-essay ENEM)
const INPUT_COST_PER_MILLION = 0.4;
const OUTPUT_COST_PER_MILLION = 1.6;

// Faixas válidas por critério (clamp server-side — a banca não dá 17/20)
const FAIXAS_VALIDAS: Record<string, number[]> = {
  proposta_tematica: [20, 15, 10, 5, 0],
  genero_discurso: [20, 15, 10, 5, 0],
  coesao_coerencia: [20, 15, 10, 5, 0],
  convencoes_escrita: [12, 9, 6, 3, 0],
  leitura_motivadores: [8, 6, 4, 2, 0],
};

const ORDEM_CRITERIOS = [
  "proposta_tematica",
  "genero_discurso",
  "coesao_coerencia",
  "convencoes_escrita",
  "leitura_motivadores",
];

const SYSTEM_PROMPT = `Você é um corretor oficial da banca DIRPS/UFU (Vestibular da Universidade Federal de Uberlândia). Você corrige EXATAMENTE pela rubrica oficial do edital, com o rigor real da banca — que é rigorosa, não bondosa. Redações medianas ficam na casa de 45-60/80. Nota alta (70+) é rara e exige texto excelente de verdade.

REGRA DE OURO: cada critério só aceita as notas das FAIXAS oficiais abaixo. Nunca invente valores intermediários.

CALIBRAÇÃO OBRIGATÓRIA DA BANCA:
- Em dúvida entre duas faixas, atribua SEMPRE a menor.
- Faixa máxima em qualquer critério exige AUSÊNCIA de falhas naquele critério. UMA falha identificável e citável já derruba para a faixa seguinte.
- Toda falha PONTUA no critério correspondente — nunca relegue uma falha apenas ao campo "alertas".
- Distribuição realista da banca: redação mediana fica entre 45 e 58. Total acima de 70 é excepcional e exige texto sem falhas relevantes em nenhum critério.

═══ ETAPA 0 — CONDIÇÕES ELIMINATÓRIAS (verificar ANTES de pontuar) ═══
A redação recebe NOTA ZERO TOTAL (e o candidato é ELIMINADO do vestibular) se:
a) Fugir da proposta temática;
b) Fugir do gênero solicitado;
c) Ter menos de 15 linhas (use a estimativa de linhas informada);
d) Ser cópia total dos textos motivadores;
e) Estar total/parcialmente em língua estrangeira;
f) Desrespeitar direitos humanos (termos racistas, sexistas, homofóbicos);
g) Conter assinatura/nome/sinal que identifique o candidato.
Se houver eliminação, marque eliminado=true, explique o(s) motivo(s) e dê nota 0 em tudo.
Se houver RISCO PRÓXIMO de eliminação (tangenciamento forte, gênero descaracterizado mas reconhecível), NÃO elimine, mas registre em "alertas".

═══ RUBRICA OFICIAL (Quadro 2 do Edital DIRPS 18/2026) ═══

1. PROPOSTA TEMÁTICA (20 pts) — faixas: 20 | 15 | 10 | 5 | 0
20: compreensão totalmente adequada E plena obediência ao que se pede. TODOS os parágrafos dentro do recorte.
15: compreensão adequada, falhas pontuais que não comprometem.
10: compreensão pouco adequada, falhas que comprometem significativamente.
5: TANGENCIAMENTO — assunto relacionado sem o recorte específico exigido; foco no tema amplo ou em aspecto periférico.
0: fuga total (elimina).
PROCEDIMENTO: verifique PARÁGRAFO POR PARÁGRAFO se desenvolve o RECORTE específico da proposta. Um parágrafo que escorrega pro tema amplo ou pra assunto vizinho (sem conectar de volta ao recorte) = falha pontual → máximo 15. Dois ou mais parágrafos fora do recorte → 10.

2. GÊNERO DO DISCURSO (20 pts) — faixas: 20 | 15 | 10 | 5 | 0
20: contempla adequadamente TODOS os elementos constitutivos do gênero, sem falhas de estilo.
15: falhas na construção COMPOSICIONAL (estrutura: elementos do gênero faltando ou incompletos, ex.: artigo sem título, carta sem fecho).
10: falhas no ESTILO (registro, pessoa do discurso, interlocução ou tom inadequados ao gênero — ex.: 2ª pessoa ou tom de carta num artigo de opinião, informalidade em gênero formal).
5: falhas na composição E no estilo.
0: gênero irreconhecível (elimina).
ATENÇÃO: falha de registro/pessoa do discurso NÃO é "alerta" — é falha de ESTILO e coloca o critério na faixa 10. Se além disso faltar elemento composicional, desce pra 5.

3. COESÃO E COERÊNCIA TEXTUAIS (20 pts) — faixas: 20 | 15 | 10 | 5 | 0
20: coerência adequada E ótima articulação (coesão referencial e sequencial), sem clichês.
15: coerente, com falhas de coesão que não comprometem o sentido.
10: coeso, mas com falhas de coerência: baixa informatividade, pouca progressão temática, contradições, clichês.
5: falhas conceituais E articulação inadequada que comprometem significativamente.
0: incoeso e incoerente.
PROCEDIMENTO: cace ativamente ANTES de pontuar: (a) clichês e fórmulas prontas ("desde os primórdios", "a sociedade como um todo", "nos dias de hoje"); (b) contradição entre afirmações de parágrafos diferentes; (c) repetição de ideia ou palavra sem retomada pronominal/sinonímia; (d) parágrafo com baixa progressão (não adiciona informação nova). Encontrou ocorrências de 2 ou mais desses tipos → máximo 10.

4. CONVENÇÕES DE ESCRITA (12 pts) — faixas: 12 | 9 | 6 | 3 | 0
(ortografia, pontuação, concordância verbal/nominal, regência verbal/nominal)
PROCEDIMENTO OBRIGATÓRIO: varra o texto FRASE A FRASE e liste TODOS os desvios encontrados em "desviosContados" ANTES de atribuir a faixa. Checagens que a banca sempre faz: concordância com verbo "haver" impessoal (ex.: "haviam pessoas" = desvio), concordância sujeito-verbo distante, regência ("assistir o" = desvio; correto: assistir A), formas inexistentes ("menas"), grafia e junções indevidas ("porisso", "concerteza"), vírgula entre sujeito e verbo, crase.
PONTUE PELA CONTAGEM: 0-2 desvios = 12; 3-5 desvios = 9; 6+ desvios OU desvios recorrentes com predominância de sintaxe simples = 6; desvios que comprometem o sentido global = 3; generalizados = 0.

5. LEITURA DOS TEXTOS MOTIVADORES E REPERTÓRIO (8 pts) — faixas: 8 | 6 | 4 | 2 | 0
8: leitura CRÍTICA + diálogo real com os motivadores + repertório cultural pertinente e FUNCIONAL no argumento.
6: leitura satisfatória mas só PARÁFRASE + repertório pertinente.
4: leitura superficial, simples menções genéricas ("dados mostram que...") + repertório DE BOLSO.
2: leitura equivocada + repertório de bolso.
0: sem diálogo, sem repertório, com cópia de trechos.
DEFINIÇÃO DE REPERTÓRIO DE BOLSO: citação célebre decorada (Mandela, Einstein, "frase de efeito") que NÃO sustenta o argumento específico do parágrafo — poderia ser removida sem perda lógica. Repertório de bolso → máximo 4. Menção vaga a "dados/estudos" sem especificar também NÃO é diálogo com motivadores.
ATENÇÃO: se a proposta/textos motivadores não foram informados, avalie o diálogo com a temática e o repertório, e registre essa limitação em "alertas".

═══ FORMATO DE RESPOSTA (JSON puro) ═══
{
  "eliminado": boolean,
  "motivosEliminacao": ["..."] ,
  "alertas": ["risco próximo de zero ou limitação da correção, se houver"],
  "criterios": [
    {
      "id": "proposta_tematica" (e os demais, NESTA ordem: proposta_tematica, genero_discurso, coesao_coerencia, convencoes_escrita, leitura_motivadores),
      "pontos": number (APENAS valores da faixa),
      "faixa": "rótulo oficial da faixa atribuída",
      "justificativa": "por que caiu nesta faixa e não na de cima — 2-3 frases diretas",
      "evidencias": ["trecho literal da redação que comprova", "..."] (1-3 trechos),
      "comoSubirUmaFaixa": "o que exatamente faltou pra faixa seguinte, acionável"
    }
  ],
  "totalScore": number (soma, 0-80),
  "desviosContados": ["desvio 1: trecho → correção", "..."] (para convenções; liste até 8),
  "feedbackGeral": "3-4 frases: diagnóstico honesto + a UMA prioridade de maior impacto",
  "prioridadeUnica": "se o aluno só melhorar UMA coisa na próxima redação, qual"
}`;

const calculateCost = (p: number, c: number) =>
  (p * INPUT_COST_PER_MILLION) / 1_000_000 +
  (c * OUTPUT_COST_PER_MILLION) / 1_000_000;

function estimarLinhas(texto: string): number {
  return texto.split("\n").reduce((total, par) => {
    const t = par.trim();
    if (!t) return total;
    return total + Math.max(1, Math.ceil(t.length / 70));
  }, 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth (mesmo padrão do analyze-essay) ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autorizado. Faça login para continuar." }, 401);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseClient.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return json({ error: "Sessão inválida. Faça login novamente." }, 401);
    }
    const user = claimsData.user;

    // ── Quota (mesmo pool de essays do fluxo ENEM) ──
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("plan_type, flexible_quota, created_at")
      .eq("id", user.id)
      .single();
    const rawPlan = profile?.plan_type || "free";
    const planType = rawPlan === "basic" ? "pro" : rawPlan;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (planType === "free") {
      const isWelcomeBonus = profile?.created_at
        ? new Date(profile.created_at) >= sevenDaysAgo
        : false;
      const weeklyLimit = isWelcomeBonus ? 2 : 1;
      const { count: weeklyCount } = await supabaseClient
        .from("essays")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("analyzed_at", "is", null)
        .gte("analyzed_at", sevenDaysAgo.toISOString());
      if ((weeklyCount ?? 0) >= weeklyLimit) {
        return json(
          {
            error: "Cota semanal de correções atingida.",
            code: "QUOTA_EXCEEDED",
            limit_type: "weekly",
          },
          403,
        );
      }
    }

    // ── Input ──
    const { text, theme, genreId, genreLabel, genreElementos, proposta } =
      await req.json();
    if (!text?.trim()) return json({ error: "Envie o texto da redação." }, 400);
    if (!genreId || !genreLabel) {
      return json(
        { error: "Informe o gênero solicitado pela proposta (obrigatório na UFU)." },
        400,
      );
    }

    const linhasEstimadas = estimarLinhas(text);

    const userPrompt = `Corrija esta redação do Vestibular UFU.

GÊNERO SOLICITADO PELA PROPOSTA: ${genreLabel}
ELEMENTOS CONSTITUTIVOS ESPERADOS: ${(genreElementos ?? []).join("; ") || "os canônicos do gênero"}
${theme ? `TEMA/RECORTE DA PROPOSTA: ${theme}` : "TEMA: não informado (registre em alertas)"}
${proposta ? `ENUNCIADO DA PROPOSTA: ${proposta}` : ""}
LINHAS ESTIMADAS NA FOLHA OFICIAL: ${linhasEstimadas} (mínimo 15, máximo 34)

REDAÇÃO DO CANDIDATO:
"""
${text}
"""

Aplique a ETAPA 0 primeiro, depois a rubrica. Responda APENAS com o JSON.`;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

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
        temperature: 0.2, // correção: consistência > criatividade
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      if (response.status === 429) {
        return json({ error: "Limite de requisições. Tente em alguns segundos." }, 429);
      }
      throw new Error("Erro ao processar correção");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const usage = data.usage;
    if (!content) throw new Error("Resposta vazia da IA");

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Resposta da IA em formato inválido");
    }

    if (!Array.isArray(result.criterios) || result.criterios.length !== 5) {
      console.error("Incomplete response:", result);
      throw new Error("Resposta da IA incompleta");
    }

    // ── Enforcement da rubrica (server-side) ──
    const eliminado = result.eliminado === true || linhasEstimadas < 15;
    if (linhasEstimadas < 15) {
      result.motivosEliminacao = [
        ...(result.motivosEliminacao ?? []),
        `Texto com ${linhasEstimadas} linhas estimadas (mínimo oficial: 15)`,
      ];
    }

    const byId = new Map(
      result.criterios.map((cr: { id: string }) => [cr.id, cr]),
    );
    const criterios = ORDEM_CRITERIOS.map((id) => {
      const cr = (byId.get(id) ?? { id }) as Record<string, unknown>;
      const faixas = FAIXAS_VALIDAS[id];
      let pontos = Number(cr.pontos ?? 0);
      // trava na faixa válida mais próxima (pra baixo em empate — banca rigorosa)
      pontos = faixas.reduce(
        (best, f) =>
          Math.abs(f - pontos) < Math.abs(best - pontos) ||
          (Math.abs(f - pontos) === Math.abs(best - pontos) && f < best)
            ? f
            : best,
        faixas[0],
      );
      if (eliminado) pontos = 0;
      return { ...cr, id, pontos };
    });

    const totalScore = eliminado
      ? 0
      : criterios.reduce((s, cr) => s + (cr.pontos as number), 0);

    // ── Token log (mesmo padrão) ──
    let tokenUsage = null;
    if (usage) {
      const estimatedCost = calculateCost(
        usage.prompt_tokens,
        usage.completion_tokens,
      );
      tokenUsage = { ...usage, estimated_cost_usd: estimatedCost };
      try {
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (serviceKey) {
          const admin = createClient(supabaseUrl, serviceKey);
          await admin.from("token_usage").insert({
            operation_type: "analyze-essay-ufu",
            block_type: genreId,
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
            estimated_cost_usd: estimatedCost,
          });
        }
      } catch (dbError) {
        console.error("Failed to log token usage:", dbError);
      }
    }

    return json({
      banca: "ufu",
      eliminado,
      motivosEliminacao: result.motivosEliminacao ?? [],
      alertas: result.alertas ?? [],
      criterios,
      totalScore,
      linhasEstimadas,
      desviosContados: result.desviosContados ?? [],
      feedbackGeral: result.feedbackGeral ?? "",
      prioridadeUnica: result.prioridadeUnica ?? "",
      usage: tokenUsage,
    });
  } catch (error) {
    console.error("analyze-essay-ufu error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
