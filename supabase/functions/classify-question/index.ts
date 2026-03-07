import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CLASSIFIER_VERSION = "v1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Embedded taxonomy (IDs only — mirror of src/taxonomy/taxonomy.ts) ──────

const DISCIPLINAS_BY_AREA: Record<string, string[]> = {
  humanas:    ["historia", "geografia", "sociologia", "filosofia"],
  natureza:   ["quimica", "fisica", "biologia"],
  linguagens: ["lingua_portuguesa", "literatura", "artes", "ingles"],
  matematica: ["matematica"],
};

const TOPIC_IDS_BY_DISCIPLINA: Record<string, string[]> = {
  historia: [
    "historia__brasil_colonia","historia__brasil_imperio","historia__republica_velha",
    "historia__era_vargas","historia__ditadura_militar","historia__redemocratizacao",
    "historia__brasil_contemporaneo","historia__antiguidade","historia__idade_media",
    "historia__idade_moderna","historia__iluminismo_revolucoes",
    "historia__imperialismo_nacionalismos","historia__guerras_mundiais",
    "historia__guerra_fria","historia__descolonizacao","historia__movimentos_sociais",
    "historia__cultura_memoria","historia__globalizacao_conflitos",
  ],
  geografia: [
    "geografia__cartografia","geografia__clima","geografia__relevo","geografia__hidrografia",
    "geografia__biomas","geografia__impactos_ambientais","geografia__mudancas_climaticas",
    "geografia__energia","geografia__populacao","geografia__migracoes",
    "geografia__urbanizacao","geografia__agropecuaria","geografia__industria",
    "geografia__globalizacao","geografia__geopolitica","geografia__desigualdades_regionais",
    "geografia__brasil_regional","geografia__questao_agraria",
    "geografia__fusos_horarios","geografia__recursos_naturais",
  ],
  sociologia: [
    "sociologia__cultura_identidade","sociologia__desigualdade","sociologia__trabalho",
    "sociologia__estado_poder","sociologia__violencia","sociologia__midia_redes",
    "sociologia__movimentos_sociais",
  ],
  filosofia: [
    "filosofia__etica","filosofia__politica","filosofia__conhecimento",
    "filosofia__iluminismo_ideologia","filosofia__democracia_cidadania",
    "filosofia__ciencia_metodo","filosofia__existencialismo_linguagem",
  ],
  quimica: [
    "quimica__atomistica","quimica__tabela_periodica","quimica__ligacoes",
    "quimica__forcas_inter","quimica__funcoes_inorganicas","quimica__estequiometria",
    "quimica__solucoes","quimica__termoquimica","quimica__cinetica",
    "quimica__equilibrio","quimica__eletroquimica","quimica__organica_funcoes",
    "quimica__reacoes_organicas","quimica__quimica_ambiental",
  ],
  fisica: [
    "fisica__cinematica","fisica__dinamica","fisica__energia_trabalho_potencia",
    "fisica__impulso_colisoes","fisica__hidrostatica","fisica__termologia",
    "fisica__ondulatoria","fisica__optica","fisica__eletrostatica",
    "fisica__eletrodinamica","fisica__consumo_kwh","fisica__inducao",
    "fisica__radioatividade",
  ],
  biologia: [
    "biologia__ecologia","biologia__ciclos_biogeoquimicos","biologia__genetica",
    "biologia__biotecnologia","biologia__evolucao","biologia__citologia",
    "biologia__metabolismo","biologia__fisiologia_humana","biologia__microbiologia",
    "biologia__botanica","biologia__zoologia","biologia__saude_doencas",
    "biologia__impactos_ambientais",
  ],
  lingua_portuguesa: [
    "lingua_portuguesa__interpretacao_textual","lingua_portuguesa__generos_textuais",
    "lingua_portuguesa__intertextualidade","lingua_portuguesa__recursos_linguisticos",
    "lingua_portuguesa__variacao_linguistica","lingua_portuguesa__argumentacao",
    "lingua_portuguesa__gramatica_morfologia","lingua_portuguesa__gramatica_sintaxe",
    "lingua_portuguesa__semantica","lingua_portuguesa__publicidade_propaganda",
  ],
  literatura: [
    "literatura__modernismo_brasileiro","literatura__pre_modernismo",
    "literatura__romantismo_brasileiro","literatura__realismo_naturalismo",
    "literatura__parnasianismo_simbolismo","literatura__barroco_arcadismo",
    "literatura__contemporaneidade","literatura__generos_literarios",
    "literatura__cronica_conto","literatura__literatura_africana_lusofona",
  ],
  artes: [
    "artes__expressoes_artisticas","artes__arte_brasileira",
    "artes__movimentos_artisticos","artes__patrimonio_cultural",
  ],
  ingles: [
    "ingles__interpretacao_texto","ingles__vocabulario_contexto","ingles__gramatica_basica",
  ],
  matematica: [
    "matematica__proporcionalidade","matematica__porcentagem",
    "matematica__estatistica_probabilidade","matematica__funcoes",
    "matematica__equacoes_inequacoes","matematica__geometria_plana",
    "matematica__geometria_espacial","matematica__geometria_analitica",
    "matematica__trigonometria","matematica__progressoes",
    "matematica__logaritmos_exponenciais","matematica__analise_combinatoria",
    "matematica__financeira","matematica__matrizes_determinantes",
  ],
};

const ALL_SKILL_IDS = [
  "interpretacao_texto_cientifico","interpretacao_fonte_historica",
  "interpretacao_grafico","interpretacao_tabela","interpretacao_mapa",
  "leitura_infografico","relacao_causa_consequencia","comparacao_processos",
  "identificacao_argumento","inferencias_implicitas","avaliacao_evidencias",
  "correlacao_variaveis","proporcionalidade","conversao_unidades",
  "estimativa_ordem_grandeza","aplicacao_formula","balanco_massa_energia",
  "aplicacao_situacao_real","impacto_socioambiental","tecnologia_e_sociedade",
  "ciencia_no_cotidiano",
];

const ALL_SKILL_SET = new Set(ALL_SKILL_IDS);

// ── Heuristic keyword fallback ───────────────────────────────────────────────

const KEYWORD_MAP: Array<{ patterns: RegExp[]; topicId: string }> = [
  { patterns: [/fotoss[íi]ntese|cloroplasto|respira[çc][ãa]o celular/i], topicId: "biologia__metabolismo" },
  { patterns: [/genética|mend[ea]l|hereditariedade|cromossomo/i], topicId: "biologia__genetica" },
  { patterns: [/ecologia|cadeia alimentar|n[íi]vel trófico|bioma/i], topicId: "biologia__ecologia" },
  { patterns: [/vacina|bact[ée]ria|v[íi]rus|fungi|parasit/i], topicId: "biologia__microbiologia" },
  { patterns: [/fisiologia|sistema nervoso|hormônio|digestão|circulatório/i], topicId: "biologia__fisiologia_humana" },
  { patterns: [/cin[eé]tica|velocidade de rea[çc][ãa]o|catalisador/i], topicId: "quimica__cinetica" },
  { patterns: [/equil[íi]brio qu[íi]mico|le chatelier/i], topicId: "quimica__equilibrio" },
  { patterns: [/estequiometria|mol |massa molar|reagente limitante/i], topicId: "quimica__estequiometria" },
  { patterns: [/[óo]xido-redução|eletr[óo]lise|pilha|cuba eletrol[íi]tica/i], topicId: "quimica__eletroquimica" },
  { patterns: [/fun[çc][õo]es org[âa]nicas|hidrocarboneto|[áa]lcool|aldeído|cetona/i], topicId: "quimica__organica_funcoes" },
  { patterns: [/cinematica|velocidade|acelera[çc][ãa]o|mrv|mruv|queda livre/i], topicId: "fisica__cinematica" },
  { patterns: [/newton|for[çc]a resultante|din[âa]mica|atrito/i], topicId: "fisica__dinamica" },
  { patterns: [/energia cin[ée]tica|energia potencial|trabalho|pot[êe]ncia/i], topicId: "fisica__energia_trabalho_potencia" },
  { patterns: [/kwh|consumo de energia|pot[êe]ncia el[ée]trica|tarifa/i], topicId: "fisica__consumo_kwh" },
  { patterns: [/press[ãa]o|empuxo|arquimedes|hidrost[áa]tica/i], topicId: "fisica__hidrostatica" },
  { patterns: [/radioatividade|meia.vida|decaimento|nuclear/i], topicId: "fisica__radioatividade" },
  { patterns: [/cartografia|escala|coordenadas|latitude|longitude|projeção/i], topicId: "geografia__cartografia" },
  { patterns: [/bioma|cerrado|amaz[ôo]nia|caatinga|mata atl[âa]ntica|pampa/i], topicId: "geografia__biomas" },
  { patterns: [/urbaniza[çc][ãa]o|metrópole|favela|êxodo rural/i], topicId: "geografia__urbanizacao" },
  { patterns: [/clima|temperatura|precipita[çc][ãa]o|el ni[ñn]o|massa de ar/i], topicId: "geografia__clima" },
  { patterns: [/era vargas|estado novo|trabalhismo|1930/i], topicId: "historia__era_vargas" },
  { patterns: [/ditadura militar|ai.5|1964|redemocratiza[çc][ãa]o/i], topicId: "historia__ditadura_militar" },
  { patterns: [/coloni[sz]a[çc][ãa]o|capitanias|pacto colonial|escravi/i], topicId: "historia__brasil_colonia" },
  { patterns: [/guerra fria|urss|eua|capitalismo|socialismo|bipolaridade/i], topicId: "historia__guerra_fria" },
  { patterns: [/porcentagem|juros|desconto|propor[çc][ãa]o|regra de tr[êe]s/i], topicId: "matematica__proporcionalidade" },
  { patterns: [/probabilidade|estatística|média|mediana|desvio/i], topicId: "matematica__estatistica_probabilidade" },
  { patterns: [/fun[çc][ãa]o|par[áa]bola|assíntota|domínio|imagem/i], topicId: "matematica__funcoes" },
  { patterns: [/geometria plana|área|per[íi]metro|tri[âa]ngulo|c[íi]rculo/i], topicId: "matematica__geometria_plana" },
  { patterns: [/volume|geometria espacial|cubo|esfera|cilindro/i], topicId: "matematica__geometria_espacial" },
  { patterns: [/cultura|identidade|etnocentrismo|relativismo|diversidade/i], topicId: "sociologia__cultura_identidade" },
  { patterns: [/desigualdade|estratifica[çc][ãa]o|classes sociais|mobilidade/i], topicId: "sociologia__desigualdade" },
  { patterns: [/[ée]tica|moral|virtude|dever|consequencialismo/i], topicId: "filosofia__etica" },
  { patterns: [/democracia|cidadania|estado|governo|contrato social/i], topicId: "filosofia__politica" },
  { patterns: [/interpret.*texto|leitura|infer[êe]ncia|compreens[ãa]o/i], topicId: "lingua_portuguesa__interpretacao_textual" },
  { patterns: [/g[êe]nero textual|cr[ôo]nica|conto|poesia|romance|artigo/i], topicId: "lingua_portuguesa__generos_textuais" },
  { patterns: [/modernismo|semana de arte moderna|1922/i], topicId: "literatura__modernismo_brasileiro" },
  { patterns: [/romantismo|realismo|naturalismo|parnasianismo|simbolismo/i], topicId: "literatura__romantismo_brasileiro" },
];

function heuristicFallback(text: string, area: string): Partial<{
  disciplina: string; topics: string[]; skills: string[];
  difficulty: number; cognitive_level: string; confidence: number; rationale: string;
}> {
  const matched: string[] = [];
  for (const entry of KEYWORD_MAP) {
    if (entry.patterns.some((p) => p.test(text))) {
      matched.push(entry.topicId);
    }
  }
  const validForArea = matched.filter((id) => {
    const disc = id.split("__")[0];
    return (DISCIPLINAS_BY_AREA[area] ?? []).includes(disc);
  });
  const topics = [...new Set(validForArea)].slice(0, 3);
  const disciplina = topics[0]?.split("__")[0] ?? (DISCIPLINAS_BY_AREA[area]?.[0] ?? "");
  return {
    disciplina,
    topics,
    skills: text.match(/gráfico|tabela|mapa/i) ? ["interpretacao_grafico"] : [],
    difficulty: 2,
    cognitive_level: "aplicacao",
    confidence: 0.45,
    rationale: "Fallback heurístico por keywords.",
  };
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(statement: string, alternatives: string, area: string): string {
  const disciplinas = DISCIPLINAS_BY_AREA[area] ?? [];
  const topicIds = disciplinas.flatMap((d) => TOPIC_IDS_BY_DISCIPLINA[d] ?? []);

  return `Você é um classificador especializado em questões do ENEM.
Classifique a questão abaixo usando APENAS os IDs fornecidos. NÃO invente IDs.

ÁREA DA QUESTÃO: ${area}

DISCIPLINAS DISPONÍVEIS (para a área "${area}"):
${disciplinas.join(", ")}

TÓPICOS DISPONÍVEIS (IDs — escolha 1 a 4):
${topicIds.join(", ")}

HABILIDADES DISPONÍVEIS (IDs — escolha 1 a 3):
${ALL_SKILL_IDS.join(", ")}

QUESTÃO:
${statement.slice(0, 900)}
${alternatives ? `Alternativas:\n${alternatives}` : ""}

Responda SOMENTE com JSON válido (sem markdown, sem texto extra):
{"disciplina":"ID_DA_DISCIPLINA","topics":["ID1","ID2"],"skills":["ID1"],"difficulty":2,"cognitive_level":"aplicacao","confidence":0.85,"rationale":"1 frase curta"}

REGRAS:
- difficulty: 1=fácil, 2=médio, 3=difícil (para o ENEM)
- cognitive_level: "recordacao" (lembrar), "compreensao" (entender), "aplicacao" (usar), "analise" (avaliar/comparar)
- confidence: 0.0–1.0; se inseguro, use menos tags e confidence < 0.75
- NÃO use IDs fora das listas acima`;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseAndValidate(content: string, area: string): {
  disciplina: string; topics: string[]; skills: string[];
  difficulty: 1 | 2 | 3; cognitive_level: string;
  confidence: number; rationale: string; needs_review: boolean;
} {
  const jsonMatch = content.match(/\{[\s\S]*"disciplina"[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in LLM response");

  const raw = JSON.parse(jsonMatch[0]);

  const disciplinas = DISCIPLINAS_BY_AREA[area] ?? [];
  const allTopicIds = new Set(disciplinas.flatMap((d) => TOPIC_IDS_BY_DISCIPLINA[d] ?? []));

  // Validate and filter topics
  const rawTopics: string[] = Array.isArray(raw.topics) ? raw.topics : [];
  const [validTopics, removedTopics] = (() => {
    const v = rawTopics.filter((id: string) => allTopicIds.has(id));
    return [v, rawTopics.length - v.length];
  })();

  // Validate and filter skills
  const rawSkills: string[] = Array.isArray(raw.skills) ? raw.skills : [];
  const validSkills = rawSkills.filter((id: string) => ALL_SKILL_SET.has(id));
  const removedSkills = rawSkills.length - validSkills.length;

  // Validate disciplina
  const disciplina = typeof raw.disciplina === "string" && disciplinas.includes(raw.disciplina)
    ? raw.disciplina
    : (disciplinas[0] ?? "");

  // Clamp confidence
  let confidence = Number(raw.confidence ?? 0.5);
  if (!isFinite(confidence)) confidence = 0.5;
  confidence = Math.max(0, Math.min(1, confidence));

  // Penalise for removed IDs
  confidence = Math.max(0, confidence - removedTopics * 0.1 - removedSkills * 0.05);

  // Normalise difficulty
  const rawDiff = Number(raw.difficulty ?? 2);
  const difficulty = (rawDiff === 1 || rawDiff === 3 ? rawDiff : 2) as 1 | 2 | 3;

  // Validate cognitive_level
  const validLevels = ["recordacao", "compreensao", "aplicacao", "analise"];
  const cognitive_level = validLevels.includes(raw.cognitive_level)
    ? raw.cognitive_level
    : "aplicacao";

  return {
    disciplina,
    topics: [...new Set(validTopics)].slice(0, 4),
    skills: [...new Set(validSkills)].slice(0, 3),
    difficulty,
    cognitive_level,
    confidence: Math.round(confidence * 100) / 100,
    rationale: String(raw.rationale ?? "").slice(0, 200),
    needs_review: confidence < 0.75 || validTopics.length === 0,
  };
}

// ── Response helper ───────────────────────────────────────────────────────────

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify admin
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user?.id) return jsonResponse({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return jsonResponse({ error: "Admin only" }, 403);

    const body = await req.json().catch(() => ({}));

    // Accept either inline question data or a questionId to fetch
    let statement: string;
    let alternatives: string;
    let area: string;
    let questionId: string | null = null;

    if (body.questionId) {
      questionId = body.questionId;
      const { data: q, error } = await supabase
        .from("questions")
        .select("id, statement, alternatives, area")
        .eq("id", questionId)
        .single();
      if (error || !q) return jsonResponse({ error: "Question not found" }, 404);
      statement = q.statement ?? "";
      area = q.area ?? "humanas";
      const alts = Array.isArray(q.alternatives) ? q.alternatives as { letter: string; text: string }[] : [];
      alternatives = alts.map((a) => `${a.letter}) ${a.text}`).join("\n");
    } else {
      statement = String(body.statement ?? "");
      area = String(body.area ?? "humanas");
      const alts = Array.isArray(body.alternatives) ? body.alternatives as { letter: string; text: string }[] : [];
      alternatives = alts.map((a) => `${a.letter}) ${a.text}`).join("\n");
    }

    if (!statement) return jsonResponse({ error: "Missing statement" }, 400);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    let result: ReturnType<typeof parseAndValidate>;

    if (apiKey) {
      try {
        const prompt = buildPrompt(statement, alternatives, area);
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "gemini-2.5-flash-lite",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.2,
              max_tokens: 300,
            }),
          }
        );
        if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
        const data = await response.json();
        const content: string = data.choices?.[0]?.message?.content ?? "";
        result = parseAndValidate(content, area);
      } catch (llmErr) {
        console.warn("[classify-question] LLM failed, using fallback:", llmErr);
        const fallback = heuristicFallback(statement, area);
        result = {
          disciplina: fallback.disciplina ?? "",
          topics: fallback.topics ?? [],
          skills: fallback.skills ?? [],
          difficulty: (fallback.difficulty ?? 2) as 1 | 2 | 3,
          cognitive_level: fallback.cognitive_level ?? "aplicacao",
          confidence: fallback.confidence ?? 0.45,
          rationale: fallback.rationale ?? "Fallback heurístico.",
          needs_review: true,
        };
      }
    } else {
      // No API key — always use fallback
      const fallback = heuristicFallback(statement, area);
      result = {
        disciplina: fallback.disciplina ?? "",
        topics: fallback.topics ?? [],
        skills: fallback.skills ?? [],
        difficulty: 2,
        cognitive_level: "aplicacao",
        confidence: 0.45,
        rationale: "Fallback heurístico (sem GEMINI_API_KEY).",
        needs_review: true,
      };
    }

    // If called with questionId, persist to DB immediately
    if (questionId) {
      // Derive topic/subtopic from the first topics[] entry (format: "disciplina__topico")
      let topic = "Geral";
      let subtopic = "";
      if (result.topics.length > 0) {
        const parts = result.topics[0].split("__");
        if (parts.length === 2) {
          topic = parts[1].replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
          subtopic = result.topics.length > 1
            ? result.topics[1].split("__")[1]?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? ""
            : "";
        }
      }

      const { error: updateError } = await supabase
        .from("questions")
        .update({
          disciplina: result.disciplina,
          topic,
          subtopic,
          topics: result.topics,
          skills: result.skills,
          difficulty: result.difficulty,
          cognitive_level: result.cognitive_level,
          confidence: result.confidence,
          needs_review: result.needs_review,
          classifier_version: CLASSIFIER_VERSION,
          classified_at: new Date().toISOString(),
        })
        .eq("id", questionId);
      if (updateError) {
        console.error("[classify-question] DB update error:", updateError);
      }
    }

    return jsonResponse({ ...result, classifier_version: CLASSIFIER_VERSION });
  } catch (err) {
    console.error("[classify-question] error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
