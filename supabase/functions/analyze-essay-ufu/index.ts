import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// Corretor de redação — modelo VESTIBULAR UFU (banca DIRPS)
// ARQUITETURA v4 (detetive + juiz):
//   1) A IA NÃO dá nota. Ela só coleta EVIDÊNCIAS (achados) do texto.
//   2) Código determinístico mapeia achados → faixas oficiais do
//      Quadro 2 do Edital DIRPS 18/2026. Rigor vira regra, não opinião.
// Espelho da rubrica em src/data/ufu/redacao.ts — manter em sincronia.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// gpt-4.1-mini
const INPUT_COST_PER_MILLION = 0.4;
const OUTPUT_COST_PER_MILLION = 1.6;

// ─────────────────────────────────────────────────────────────
// PROMPT: só extração de evidências. Nenhuma nota é pedida.
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é um analista linguístico da banca DIRPS/UFU. Sua função NÃO é dar nota — é fazer um LEVANTAMENTO COMPLETO E IMPIEDOSO de evidências no texto do candidato. Outro sistema aplicará a rubrica sobre seus achados. Seja exaustivo: evidência não registrada = evidência que não existe. Na dúvida se algo é falha, REGISTRE (com o trecho literal).

Analise o texto e responda APENAS com este JSON:

{
  "eliminatorias": {
    "fugaTotalDoTema": boolean,        // texto NÃO trata da proposta temática
    "fugaTotalDoGenero": boolean,      // gênero irreconhecível
    "copiaTotalDosMotivadores": boolean,
    "linguaEstrangeira": boolean,      // trechos relevantes em outra língua
    "desrespeitoDireitosHumanos": boolean,
    "identificacaoDoCandidato": boolean, // nome/assinatura/sinal identificador
    "justificativa": "se alguma for true, explique qual e por quê; senão string vazia"
  },

  "proposta": {
    "compreensaoGlobal": "adequada" | "pouco_adequada" | "equivocada",
    "focoNoTemaAmploSemRecorte": boolean, // trata só do tema geral, nunca do recorte específico
    "paragrafosForaDoRecorte": [ { "trecho": "início literal do parágrafo", "motivo": "por que escapa do recorte específico da proposta" } ]
    // Um parágrafo que discute assunto vizinho (ex.: tema amplo 'abandono infantil' quando o recorte é 'desafios da adoção') SEM conectar de volta ao recorte = fora do recorte.
  },

  "genero": {
    "elementosAusentes": ["elemento constitutivo esperado que falta, ex.: título, tese explícita, refutação, fecho"],
    "falhasComposicionais": [ { "trecho": "...", "motivo": "estrutura/parte do gênero incompleta ou mal construída" } ],
    "falhasDeEstilo": [ { "trecho": "...", "motivo": "registro, pessoa do discurso, interlocução ou tom inadequados ao gênero" } ]
    // ex. CLÁSSICO de falha de estilo: 'Caro leitor, pense comigo' / 2ª pessoa / tom de carta num artigo de opinião; informalidade em gênero formal. SEMPRE registre aqui, nunca ignore.
  },

  "coesaoCoerencia": {
    "cliches": ["trecho literal de cada clichê/fórmula pronta, ex.: 'desde os primórdios', 'a sociedade como um todo', 'nos dias de hoje'"],
    "contradicoes": [ { "afirmacao1": "trecho", "afirmacao2": "trecho", "explicacao": "por que se contradizem" } ],
    "repeticoesSemRetomada": ["palavra/ideia repetida sem pronome ou sinônimo, com trecho"],
    "paragrafosSemProgressao": ["parágrafo que não adiciona informação nova, com trecho inicial"],
    "falhasDeCoesaoLeves": ["conectivo mal usado / retomada falha que NÃO compromete o sentido, com trecho"],
    "falhasConceituaisGraves": ["incoerência que compromete significativamente o sentido, com trecho"]
  },

  "convencoes": {
    "desvios": [ { "trecho": "literal", "correcao": "forma correta", "tipo": "concordância|regência|grafia|pontuação|crase|forma inexistente" } ],
    // VARRA FRASE A FRASE. Checagens obrigatórias: 'haver' impessoal ("haviam pessoas"), concordância com sujeito distante, regência (assistir A, "assistir o sofrimento" = desvio), formas inexistentes ("menas"), junções ("porisso", "concerteza"), vírgula entre sujeito e verbo ("As famílias que esperam, desistem"), crase.
    "sintaxePredominante": "simples" | "variada",
    "desviosComprometemSentidoGlobal": boolean
  },

  "leitura": {
    "dialogoComTema": "critico" | "parafrase" | "mencao_generica" | "equivocado" | "ausente",
    // critico = analisa/problematiza dados ou ideias dos motivadores/tema; parafrase = reformula sem analisar; mencao_generica = "dados oficiais mostram" sem especificar nada
    "repertorios": [ { "trecho": "citação/referência usada", "sustentaOArgumento": boolean, "porque": "teste: removendo, o argumento muda? Se não muda, é decorativo (false)" } ],
    "copiaDeTrechosDosMotivadores": boolean
  },

  "feedbackGeral": "3-4 frases honestas: diagnóstico do texto + a UMA prioridade de maior impacto",
  "prioridadeUnica": "se o aluno melhorar UMA coisa na próxima redação, qual",
  "alertas": ["limitações desta análise (ex.: proposta não informada) ou riscos próximos de eliminação"]
}`;

// ─────────────────────────────────────────────────────────────
// JUIZ: achados → faixas oficiais (determinístico)
// ─────────────────────────────────────────────────────────────
interface Achados {
  eliminatorias: {
    fugaTotalDoTema: boolean; fugaTotalDoGenero: boolean;
    copiaTotalDosMotivadores: boolean; linguaEstrangeira: boolean;
    desrespeitoDireitosHumanos: boolean; identificacaoDoCandidato: boolean;
    justificativa: string;
  };
  proposta: {
    compreensaoGlobal: string; focoNoTemaAmploSemRecorte: boolean;
    paragrafosForaDoRecorte: { trecho: string; motivo: string }[];
  };
  genero: {
    elementosAusentes: string[];
    falhasComposicionais: { trecho: string; motivo: string }[];
    falhasDeEstilo: { trecho: string; motivo: string }[];
  };
  coesaoCoerencia: {
    cliches: string[]; contradicoes: { afirmacao1: string; afirmacao2: string; explicacao: string }[];
    repeticoesSemRetomada: string[]; paragrafosSemProgressao: string[];
    falhasDeCoesaoLeves: string[]; falhasConceituaisGraves: string[];
  };
  convencoes: {
    desvios: { trecho: string; correcao: string; tipo: string }[];
    sintaxePredominante: string; desviosComprometemSentidoGlobal: boolean;
  };
  leitura: {
    dialogoComTema: string;
    repertorios: { trecho: string; sustentaOArgumento: boolean; porque: string }[];
    copiaDeTrechosDosMotivadores: boolean;
  };
  feedbackGeral: string; prioridadeUnica: string; alertas: string[];
}

interface CriterioJulgado {
  id: string; pontos: number; faixa: string;
  justificativa: string; evidencias: string[]; comoSubirUmaFaixa: string;
}

const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

function julgarProposta(a: Achados): CriterioJulgado {
  const fora = arr(a.proposta?.paragrafosForaDoRecorte);
  const comp = a.proposta?.compreensaoGlobal ?? "adequada";
  let pontos: number, faixa: string, justificativa: string;

  if (comp === "equivocada") {
    pontos = 5; faixa = "Tangenciamento do tema";
    justificativa = "Compreensão equivocada da proposta: o texto orbita o assunto sem desenvolver o recorte exigido.";
  } else if (a.proposta?.focoNoTemaAmploSemRecorte) {
    pontos = 5; faixa = "Tangenciamento do tema";
    justificativa = "O texto trata do tema amplo sem desenvolver o recorte específico exigido pela proposta.";
  } else if (fora.length >= 2 || comp === "pouco_adequada") {
    pontos = 10; faixa = "Atendimento parcial à proposta";
    justificativa = `Falhas que comprometem o atendimento: ${fora.length} parágrafo(s) fora do recorte específico.`;
  } else if (fora.length === 1) {
    pontos = 15; faixa = "Atendimento satisfatório à proposta";
    justificativa = `Compreensão adequada, mas um parágrafo escapa do recorte: ${fora[0].motivo}`;
  } else {
    pontos = 20; faixa = "Atendimento total à proposta";
    justificativa = "Todos os parágrafos desenvolvem o recorte específico da proposta.";
  }
  return {
    id: "proposta_tematica", pontos, faixa, justificativa,
    evidencias: fora.map((f) => f.trecho).slice(0, 3),
    comoSubirUmaFaixa: pontos >= 20 ? "Critério no teto — mantenha todos os parágrafos amarrados ao recorte."
      : "Amarre cada parágrafo explicitamente ao recorte da proposta: ao abrir um exemplo ou causa, feche mostrando o que ele diz sobre o recorte específico.",
  };
}

function julgarGenero(a: Achados): CriterioJulgado {
  const estilo = arr(a.genero?.falhasDeEstilo);
  const compos = [...arr(a.genero?.falhasComposicionais)];
  const ausentes = arr(a.genero?.elementosAusentes);
  const temCompos = compos.length > 0 || ausentes.length > 0;
  const temEstilo = estilo.length > 0;
  let pontos: number, faixa: string, justificativa: string;

  if (temEstilo && temCompos) {
    pontos = 5; faixa = "Produção insatisfatória do gênero";
    justificativa = `Falhas de composição (${[...ausentes, ...compos.map((c) => c.motivo)].slice(0, 2).join("; ")}) E de estilo (${estilo[0].motivo}).`;
  } else if (temEstilo) {
    pontos = 10; faixa = "Produção parcialmente satisfatória (falhas no estilo)";
    justificativa = `Falha de estilo no gênero: ${estilo.map((e) => e.motivo).slice(0, 2).join("; ")}.`;
  } else if (temCompos) {
    pontos = 15; faixa = "Produção parcialmente satisfatória (falhas na composição)";
    justificativa = `Falhas composicionais: ${[...ausentes, ...compos.map((c) => c.motivo)].slice(0, 3).join("; ")}.`;
  } else {
    pontos = 20; faixa = "Produção totalmente satisfatória do gênero";
    justificativa = "Todos os elementos constitutivos do gênero presentes, com estilo adequado.";
  }
  return {
    id: "genero_discurso", pontos, faixa, justificativa,
    evidencias: [...estilo.map((e) => e.trecho), ...compos.map((c) => c.trecho)].filter(Boolean).slice(0, 3),
    comoSubirUmaFaixa: temEstilo
      ? "Elimine as marcas de estilo alheias ao gênero (registro, pessoa do discurso, interlocução) — é a falha mais barata de corrigir."
      : temCompos
        ? `Complete a estrutura do gênero: ${ausentes.slice(0, 2).join(", ") || "revise as partes apontadas"}.`
        : "Critério no teto.",
  };
}

function julgarCoesao(a: Achados): CriterioJulgado {
  const c = a.coesaoCoerencia ?? ({} as Achados["coesaoCoerencia"]);
  const cliches = arr(c.cliches), contra = arr(c.contradicoes),
    repet = arr(c.repeticoesSemRetomada), semProg = arr(c.paragrafosSemProgressao),
    leves = arr(c.falhasDeCoesaoLeves), graves = arr(c.falhasConceituaisGraves);
  const tiposCoerencia =
    (cliches.length ? 1 : 0) + (contra.length ? 1 : 0) + (repet.length ? 1 : 0) + (semProg.length ? 1 : 0);
  let pontos: number, faixa: string, justificativa: string;

  if (graves.length > 0) {
    pontos = 5; faixa = "Texto pouco coerente e pouco coeso";
    justificativa = `Falhas conceituais que comprometem o sentido: ${graves[0]}`;
  } else if (contra.length > 0 || tiposCoerencia >= 2) {
    pontos = 10; faixa = "Texto coeso, com falhas na coerência";
    const partes: string[] = [];
    if (contra.length) partes.push(`contradição (${contra[0].explicacao})`);
    if (cliches.length) partes.push(`${cliches.length} clichê(s)`);
    if (repet.length) partes.push("repetição sem retomada");
    if (semProg.length) partes.push("baixa progressão");
    justificativa = `Falhas de coerência: ${partes.join("; ")}.`;
  } else if (tiposCoerencia === 1 || leves.length > 0) {
    pontos = 15; faixa = "Texto coerente, com falhas de coesão";
    justificativa = cliches.length
      ? `Coerente, mas com fórmulas prontas que empobrecem a articulação: ${cliches.slice(0, 2).join("; ")}.`
      : `Falhas leves de coesão que não comprometem o sentido: ${leves[0] ?? repet[0] ?? semProg[0] ?? ""}`;
  } else {
    pontos = 20; faixa = "Texto totalmente coeso e coerente";
    justificativa = "Articulação referencial e sequencial adequadas, sem clichês, contradições ou repetições.";
  }
  return {
    id: "coesao_coerencia", pontos, faixa, justificativa,
    evidencias: [...contra.map((x) => `"${x.afirmacao1}" × "${x.afirmacao2}"`), ...cliches].slice(0, 3),
    comoSubirUmaFaixa: contra.length
      ? "Resolva a contradição: decida qual é a tese e alinhe os parágrafos a ela."
      : cliches.length
        ? "Troque as fórmulas prontas por afirmações específicas do seu recorte — clichê é espaço perdido."
        : "Varie retomadas com pronomes e sinônimos e garanta que cada parágrafo adicione informação nova.",
  };
}

function julgarConvencoes(a: Achados): CriterioJulgado {
  const desvios = arr(a.convencoes?.desvios);
  const simples = a.convencoes?.sintaxePredominante === "simples";
  const n = desvios.length;
  let pontos: number, faixa: string;

  if (a.convencoes?.desviosComprometemSentidoGlobal) {
    pontos = 3; faixa = "Domínio insatisfatório da norma-padrão";
  } else if (n >= 6 || (n >= 3 && simples)) {
    pontos = 6; faixa = "Pouco domínio da norma-padrão";
  } else if (n >= 3 || (n > 0 && simples)) {
    pontos = 9; faixa = "Bom domínio da norma-padrão";
  } else if (n <= 2 && !simples) {
    pontos = 12; faixa = "Pleno domínio da norma-padrão";
  } else {
    pontos = 9; faixa = "Bom domínio da norma-padrão";
  }
  return {
    id: "convencoes_escrita", pontos, faixa,
    justificativa: `${n} desvio(s) identificado(s)${simples ? ", com predominância de construções sintáticas simples" : ""}. A banca admite no máximo 2 desvios para a faixa plena.`,
    evidencias: desvios.slice(0, 3).map((d) => `${d.trecho} → ${d.correcao}`),
    comoSubirUmaFaixa: n > 0
      ? `Corrija os padrões apontados (${[...new Set(desvios.map((d) => d.tipo))].join(", ")}) e varie a construção das frases (subordinação, inversões).`
      : "Varie mais a sintaxe: períodos compostos, subordinação, inversões.",
  };
}

function julgarLeitura(a: Achados): CriterioJulgado {
  const dialogo = a.leitura?.dialogoComTema ?? "ausente";
  const reps = arr(a.leitura?.repertorios);
  const temBolso = reps.some((r) => !r.sustentaOArgumento);
  const temFuncional = reps.some((r) => r.sustentaOArgumento);
  const copia = a.leitura?.copiaDeTrechosDosMotivadores === true;
  let pontos: number, faixa: string, justificativa: string;

  if (copia && dialogo === "ausente") {
    pontos = 0; faixa = "Uso totalmente inadequado";
    justificativa = "Cópia de trechos sem diálogo próprio com o tema.";
  } else if (dialogo === "equivocado") {
    pontos = 2; faixa = "Uso inadequado";
    justificativa = "Leitura equivocada do tema/motivadores.";
  } else if (dialogo === "mencao_generica" || dialogo === "ausente" || temBolso) {
    pontos = 4; faixa = "Uso pouco adequado";
    const partes: string[] = [];
    if (dialogo === "mencao_generica") partes.push("menções genéricas sem especificar dados");
    if (temBolso) {
      const bolso = reps.find((r) => !r.sustentaOArgumento);
      partes.push(`repertório de bolso ("${bolso?.trecho.slice(0, 60)}..." — ${bolso?.porque})`);
    }
    justificativa = `Leitura superficial: ${partes.join("; ")}.`;
  } else if (dialogo === "parafrase") {
    pontos = 6; faixa = "Uso adequado";
    justificativa = "Leitura satisfatória, mas em nível de paráfrase, com repertório pertinente.";
  } else {
    pontos = temFuncional ? 8 : 6;
    faixa = pontos === 8 ? "Uso totalmente adequado" : "Uso adequado";
    justificativa = pontos === 8
      ? "Leitura crítica com repertório que trabalha a favor do argumento."
      : "Leitura crítica, mas sem repertório cultural que agregue.";
  }
  return {
    id: "leitura_motivadores", pontos, faixa, justificativa,
    evidencias: reps.map((r) => r.trecho).slice(0, 3),
    comoSubirUmaFaixa: temBolso
      ? "Troque a citação decorativa por repertório que sustente o argumento — ou conecte-a explicitamente à sua tese (o teste: se removê-la, o parágrafo deve perder força)."
      : "Vá além da paráfrase: analise, problematize ou refute uma ideia dos textos motivadores.",
  };
}

const calculateCost = (p: number, c: number) =>
  (p * INPUT_COST_PER_MILLION) / 1_000_000 + (c * OUTPUT_COST_PER_MILLION) / 1_000_000;

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
    // ── Auth ──
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
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return json({ error: "Sessão inválida. Faça login novamente." }, 401);
    }
    const user = claimsData.user;

    // ── Quota (mesmo pool de essays) ──
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
        ? new Date(profile.created_at) >= sevenDaysAgo : false;
      const weeklyLimit = isWelcomeBonus ? 2 : 1;
      const { count: weeklyCount } = await supabaseClient
        .from("essays")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("analyzed_at", "is", null)
        .gte("analyzed_at", sevenDaysAgo.toISOString());
      if ((weeklyCount ?? 0) >= weeklyLimit) {
        return json({ error: "Cota semanal de correções atingida.", code: "QUOTA_EXCEEDED", limit_type: "weekly" }, 403);
      }
    }

    // ── Input ──
    const { text, theme, genreId, genreLabel, genreElementos, proposta } = await req.json();
    if (!text?.trim()) return json({ error: "Envie o texto da redação." }, 400);
    if (!genreId || !genreLabel) {
      return json({ error: "Informe o gênero solicitado pela proposta (obrigatório na UFU)." }, 400);
    }

    const linhasEstimadas = estimarLinhas(text);

    const userPrompt = `Faça o levantamento de evidências desta redação do Vestibular UFU.

GÊNERO SOLICITADO PELA PROPOSTA: ${genreLabel}
ELEMENTOS CONSTITUTIVOS ESPERADOS DO GÊNERO: ${(genreElementos ?? []).join("; ") || "os canônicos do gênero"}
${theme ? `TEMA/RECORTE ESPECÍFICO DA PROPOSTA: ${theme}` : "TEMA: não informado (registre em alertas)"}
${proposta ? `ENUNCIADO DA PROPOSTA: ${proposta}` : ""}
LINHAS ESTIMADAS NA FOLHA OFICIAL: ${linhasEstimadas}

TEXTO DO CANDIDATO:
"""
${text}
"""

Responda APENAS com o JSON de achados.`;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
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

    let achados: Achados;
    try {
      achados = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Resposta da IA em formato inválido");
    }

    // ── JUIZ: eliminatórias ──
    const el = achados.eliminatorias ?? ({} as Achados["eliminatorias"]);
    const motivosEliminacao: string[] = [];
    if (el.fugaTotalDoTema) motivosEliminacao.push("Não atendimento à proposta temática (fuga ao tema)");
    if (el.fugaTotalDoGenero) motivosEliminacao.push("Não atendimento ao gênero solicitado (fuga ao gênero)");
    if (el.copiaTotalDosMotivadores) motivosEliminacao.push("Cópia total dos textos motivadores");
    if (el.linguaEstrangeira) motivosEliminacao.push("Texto total/parcialmente em língua estrangeira");
    if (el.desrespeitoDireitosHumanos) motivosEliminacao.push("Desrespeito aos direitos humanos");
    if (el.identificacaoDoCandidato) motivosEliminacao.push("Identificação do candidato no texto");
    if (linhasEstimadas < 15) motivosEliminacao.push(`Texto com ${linhasEstimadas} linhas estimadas (mínimo oficial: 15)`);
    if (el.justificativa && motivosEliminacao.length > 0) motivosEliminacao.push(el.justificativa);
    const eliminado = motivosEliminacao.length > 0;

    // ── JUIZ: critérios ──
    let criterios: CriterioJulgado[] = [
      julgarProposta(achados),
      julgarGenero(achados),
      julgarCoesao(achados),
      julgarConvencoes(achados),
      julgarLeitura(achados),
    ];
    if (eliminado) criterios = criterios.map((c) => ({ ...c, pontos: 0 }));
    const totalScore = eliminado ? 0 : criterios.reduce((s, c) => s + c.pontos, 0);

    const desviosContados = arr(achados.convencoes?.desvios).map(
      (d, i) => `Desvio ${i + 1} (${d.tipo}): '${d.trecho}' → '${d.correcao}'`,
    );

    // ── Token log ──
    let tokenUsage = null;
    if (usage) {
      const estimatedCost = calculateCost(usage.prompt_tokens, usage.completion_tokens);
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
      motivosEliminacao,
      alertas: arr(achados.alertas),
      criterios,
      totalScore,
      linhasEstimadas,
      desviosContados,
      feedbackGeral: achados.feedbackGeral ?? "",
      prioridadeUnica: achados.prioridadeUnica ?? "",
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
