// ============================================================
// Atlas Inteligência — Taxonomia canônica de questões ENEM
// IDs estáveis em snake_case. Formato: {disciplina}__{topico}
// Skills universais: sem prefixo.
// ============================================================

// ---------- DISCIPLINAS ----------

export interface Disciplina {
  id: string;
  label: string;
  area: string;
}

export const DISCIPLINAS: Record<string, Disciplina[]> = {
  humanas: [
    { id: 'historia', label: 'História', area: 'humanas' },
    { id: 'geografia', label: 'Geografia', area: 'humanas' },
    { id: 'sociologia', label: 'Sociologia', area: 'humanas' },
    { id: 'filosofia', label: 'Filosofia', area: 'humanas' },
  ],
  natureza: [
    { id: 'quimica', label: 'Química', area: 'natureza' },
    { id: 'fisica', label: 'Física', area: 'natureza' },
    { id: 'biologia', label: 'Biologia', area: 'natureza' },
  ],
  linguagens: [
    { id: 'lingua_portuguesa', label: 'Língua Portuguesa', area: 'linguagens' },
    { id: 'literatura', label: 'Literatura', area: 'linguagens' },
    { id: 'artes', label: 'Artes', area: 'linguagens' },
    { id: 'ingles', label: 'Inglês', area: 'linguagens' },
  ],
  matematica: [
    { id: 'matematica', label: 'Matemática', area: 'matematica' },
  ],
};

// ---------- TÓPICOS ----------

export interface Topic {
  id: string;
  label: string;
  disciplina: string;
  area: string;
}

export const TOPICS: Record<string, Topic[]> = {
  // ── HISTÓRIA ──────────────────────────────────────────
  historia: [
    { id: 'historia__brasil_colonia', label: 'Brasil Colônia', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__brasil_imperio', label: 'Brasil Império', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__republica_velha', label: 'República Velha', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__era_vargas', label: 'Era Vargas', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__ditadura_militar', label: 'Ditadura Militar', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__redemocratizacao', label: 'Redemocratização', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__brasil_contemporaneo', label: 'Brasil Contemporâneo', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__antiguidade', label: 'Antiguidade (Grécia e Roma)', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__idade_media', label: 'Idade Média', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__idade_moderna', label: 'Idade Moderna', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__iluminismo_revolucoes', label: 'Iluminismo e Revoluções', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__imperialismo_nacionalismos', label: 'Imperialismo e Nacionalismos', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__guerras_mundiais', label: '1ª e 2ª Guerras Mundiais', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__guerra_fria', label: 'Guerra Fria', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__descolonizacao', label: 'Descolonização (África/Ásia)', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__movimentos_sociais', label: 'Movimentos Sociais e Trabalhistas', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__cultura_memoria', label: 'Cultura, Memória e Patrimônio', disciplina: 'historia', area: 'humanas' },
    { id: 'historia__globalizacao_conflitos', label: 'Globalização e Conflitos Atuais', disciplina: 'historia', area: 'humanas' },
  ],

  // ── GEOGRAFIA ──────────────────────────────────────────
  geografia: [
    { id: 'geografia__cartografia', label: 'Cartografia', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__clima', label: 'Climatologia', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__relevo', label: 'Geomorfologia e Relevo', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__hidrografia', label: 'Hidrografia', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__biomas', label: 'Biomas e Vegetação', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__impactos_ambientais', label: 'Impactos Ambientais', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__mudancas_climaticas', label: 'Mudanças Climáticas', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__energia', label: 'Recursos Energéticos', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__populacao', label: 'População e Demografia', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__migracoes', label: 'Migrações', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__urbanizacao', label: 'Urbanização e Metropolização', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__agropecuaria', label: 'Agropecuária', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__industria', label: 'Industrialização', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__globalizacao', label: 'Globalização', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__geopolitica', label: 'Geopolítica e Blocos Econômicos', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__desigualdades_regionais', label: 'Desigualdades Regionais', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__brasil_regional', label: 'Geografia do Brasil', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__questao_agraria', label: 'Questão Agrária', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__fusos_horarios', label: 'Fusos Horários e Coordenadas', disciplina: 'geografia', area: 'humanas' },
    { id: 'geografia__recursos_naturais', label: 'Recursos Naturais', disciplina: 'geografia', area: 'humanas' },
  ],

  // ── SOCIOLOGIA ─────────────────────────────────────────
  sociologia: [
    { id: 'sociologia__cultura_identidade', label: 'Cultura e Identidade', disciplina: 'sociologia', area: 'humanas' },
    { id: 'sociologia__desigualdade', label: 'Estratificação e Desigualdade', disciplina: 'sociologia', area: 'humanas' },
    { id: 'sociologia__trabalho', label: 'Trabalho e Economia', disciplina: 'sociologia', area: 'humanas' },
    { id: 'sociologia__estado_poder', label: 'Estado, Poder e Democracia', disciplina: 'sociologia', area: 'humanas' },
    { id: 'sociologia__violencia', label: 'Violência e Controle Social', disciplina: 'sociologia', area: 'humanas' },
    { id: 'sociologia__midia_redes', label: 'Mídia e Redes Sociais', disciplina: 'sociologia', area: 'humanas' },
    { id: 'sociologia__movimentos_sociais', label: 'Movimentos Sociais', disciplina: 'sociologia', area: 'humanas' },
  ],

  // ── FILOSOFIA ──────────────────────────────────────────
  filosofia: [
    { id: 'filosofia__etica', label: 'Ética e Moral', disciplina: 'filosofia', area: 'humanas' },
    { id: 'filosofia__politica', label: 'Filosofia Política', disciplina: 'filosofia', area: 'humanas' },
    { id: 'filosofia__conhecimento', label: 'Teoria do Conhecimento', disciplina: 'filosofia', area: 'humanas' },
    { id: 'filosofia__iluminismo_ideologia', label: 'Iluminismo e Ideologia', disciplina: 'filosofia', area: 'humanas' },
    { id: 'filosofia__democracia_cidadania', label: 'Democracia e Cidadania', disciplina: 'filosofia', area: 'humanas' },
    { id: 'filosofia__ciencia_metodo', label: 'Ciência e Método', disciplina: 'filosofia', area: 'humanas' },
    { id: 'filosofia__existencialismo_linguagem', label: 'Existencialismo e Linguagem', disciplina: 'filosofia', area: 'humanas' },
  ],

  // ── QUÍMICA ────────────────────────────────────────────
  quimica: [
    { id: 'quimica__atomistica', label: 'Modelos Atômicos', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__tabela_periodica', label: 'Tabela Periódica', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__ligacoes', label: 'Ligações Químicas', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__forcas_inter', label: 'Forças Intermoleculares', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__funcoes_inorganicas', label: 'Funções Inorgânicas (ácidos, bases, sais, óxidos)', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__estequiometria', label: 'Estequiometria', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__solucoes', label: 'Soluções e Concentração', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__termoquimica', label: 'Termoquímica', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__cinetica', label: 'Cinética Química', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__equilibrio', label: 'Equilíbrio Químico', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__eletroquimica', label: 'Eletroquímica', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__organica_funcoes', label: 'Química Orgânica — Funções', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__reacoes_organicas', label: 'Reações Orgânicas', disciplina: 'quimica', area: 'natureza' },
    { id: 'quimica__quimica_ambiental', label: 'Química Ambiental e Aplicada', disciplina: 'quimica', area: 'natureza' },
  ],

  // ── FÍSICA ─────────────────────────────────────────────
  fisica: [
    { id: 'fisica__cinematica', label: 'Cinemática', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__dinamica', label: 'Dinâmica (Leis de Newton)', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__energia_trabalho_potencia', label: 'Trabalho, Energia e Potência', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__impulso_colisoes', label: 'Impulso e Colisões', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__hidrostatica', label: 'Hidrostática', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__termologia', label: 'Termologia e Calorimetria', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__ondulatoria', label: 'Ondulatória e Som', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__optica', label: 'Óptica', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__eletrostatica', label: 'Eletrostática', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__eletrodinamica', label: 'Eletrodinâmica e Circuitos', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__consumo_kwh', label: 'Potência e Consumo Elétrico (kWh)', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__inducao', label: 'Magnetismo e Indução', disciplina: 'fisica', area: 'natureza' },
    { id: 'fisica__radioatividade', label: 'Radioatividade e Física Moderna', disciplina: 'fisica', area: 'natureza' },
  ],

  // ── BIOLOGIA ───────────────────────────────────────────
  biologia: [
    { id: 'biologia__ecologia', label: 'Ecologia', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__ciclos_biogeoquimicos', label: 'Ciclos Biogeoquímicos', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__genetica', label: 'Genética Clássica', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__biotecnologia', label: 'Biotecnologia', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__evolucao', label: 'Evolução', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__citologia', label: 'Citologia e Bioquímica', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__metabolismo', label: 'Metabolismo (respiração/fotossíntese)', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__fisiologia_humana', label: 'Fisiologia Humana', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__microbiologia', label: 'Microbiologia e Parasitologia', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__botanica', label: 'Botânica', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__zoologia', label: 'Zoologia', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__saude_doencas', label: 'Saúde, Doenças e Epidemiologia', disciplina: 'biologia', area: 'natureza' },
    { id: 'biologia__impactos_ambientais', label: 'Impactos Ambientais e Conservação', disciplina: 'biologia', area: 'natureza' },
  ],

  // ── LÍNGUA PORTUGUESA ──────────────────────────────────
  lingua_portuguesa: [
    { id: 'lingua_portuguesa__interpretacao_textual', label: 'Interpretação Textual', disciplina: 'lingua_portuguesa', area: 'linguagens' },
    { id: 'lingua_portuguesa__generos_textuais', label: 'Gêneros Textuais', disciplina: 'lingua_portuguesa', area: 'linguagens' },
    { id: 'lingua_portuguesa__intertextualidade', label: 'Intertextualidade e Interdiscursividade', disciplina: 'lingua_portuguesa', area: 'linguagens' },
    { id: 'lingua_portuguesa__recursos_linguisticos', label: 'Recursos Linguísticos e Estilísticos', disciplina: 'lingua_portuguesa', area: 'linguagens' },
    { id: 'lingua_portuguesa__variacao_linguistica', label: 'Variação Linguística', disciplina: 'lingua_portuguesa', area: 'linguagens' },
    { id: 'lingua_portuguesa__argumentacao', label: 'Argumentação e Discurso', disciplina: 'lingua_portuguesa', area: 'linguagens' },
    { id: 'lingua_portuguesa__gramatica_morfologia', label: 'Morfologia', disciplina: 'lingua_portuguesa', area: 'linguagens' },
    { id: 'lingua_portuguesa__gramatica_sintaxe', label: 'Sintaxe', disciplina: 'lingua_portuguesa', area: 'linguagens' },
    { id: 'lingua_portuguesa__semantica', label: 'Semântica e Coesão', disciplina: 'lingua_portuguesa', area: 'linguagens' },
    { id: 'lingua_portuguesa__publicidade_propaganda', label: 'Publicidade e Propaganda', disciplina: 'lingua_portuguesa', area: 'linguagens' },
  ],

  // ── LITERATURA ─────────────────────────────────────────
  literatura: [
    { id: 'literatura__modernismo_brasileiro', label: 'Modernismo Brasileiro', disciplina: 'literatura', area: 'linguagens' },
    { id: 'literatura__pre_modernismo', label: 'Pré-Modernismo', disciplina: 'literatura', area: 'linguagens' },
    { id: 'literatura__romantismo_brasileiro', label: 'Romantismo Brasileiro', disciplina: 'literatura', area: 'linguagens' },
    { id: 'literatura__realismo_naturalismo', label: 'Realismo e Naturalismo', disciplina: 'literatura', area: 'linguagens' },
    { id: 'literatura__parnasianismo_simbolismo', label: 'Parnasianismo e Simbolismo', disciplina: 'literatura', area: 'linguagens' },
    { id: 'literatura__barroco_arcadismo', label: 'Barroco e Arcadismo', disciplina: 'literatura', area: 'linguagens' },
    { id: 'literatura__contemporaneidade', label: 'Literatura Contemporânea', disciplina: 'literatura', area: 'linguagens' },
    { id: 'literatura__generos_literarios', label: 'Gêneros Literários (poesia, prosa, drama)', disciplina: 'literatura', area: 'linguagens' },
    { id: 'literatura__cronica_conto', label: 'Crônica e Conto', disciplina: 'literatura', area: 'linguagens' },
    { id: 'literatura__literatura_africana_lusofona', label: 'Literatura Africana e Lusófona', disciplina: 'literatura', area: 'linguagens' },
  ],

  // ── ARTES ──────────────────────────────────────────────
  artes: [
    { id: 'artes__expressoes_artisticas', label: 'Expressões Artísticas (música, dança, teatro)', disciplina: 'artes', area: 'linguagens' },
    { id: 'artes__arte_brasileira', label: 'Arte Brasileira', disciplina: 'artes', area: 'linguagens' },
    { id: 'artes__movimentos_artisticos', label: 'Movimentos Artísticos', disciplina: 'artes', area: 'linguagens' },
    { id: 'artes__patrimonio_cultural', label: 'Patrimônio e Diversidade Cultural', disciplina: 'artes', area: 'linguagens' },
  ],

  // ── INGLÊS ─────────────────────────────────────────────
  ingles: [
    { id: 'ingles__interpretacao_texto', label: 'Interpretação de Texto em Inglês', disciplina: 'ingles', area: 'linguagens' },
    { id: 'ingles__vocabulario_contexto', label: 'Vocabulário em Contexto', disciplina: 'ingles', area: 'linguagens' },
    { id: 'ingles__gramatica_basica', label: 'Gramática Básica', disciplina: 'ingles', area: 'linguagens' },
  ],

  // ── MATEMÁTICA ─────────────────────────────────────────
  matematica: [
    { id: 'matematica__proporcionalidade', label: 'Proporcionalidade e Regra de Três', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__porcentagem', label: 'Porcentagem e Juros', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__estatistica_probabilidade', label: 'Estatística e Probabilidade', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__funcoes', label: 'Funções (1º, 2º grau, exponencial, logarítmica)', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__equacoes_inequacoes', label: 'Equações e Inequações', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__geometria_plana', label: 'Geometria Plana', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__geometria_espacial', label: 'Geometria Espacial', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__geometria_analitica', label: 'Geometria Analítica', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__trigonometria', label: 'Trigonometria', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__progressoes', label: 'Progressões (PA e PG)', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__logaritmos_exponenciais', label: 'Logaritmos e Exponenciais', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__analise_combinatoria', label: 'Análise Combinatória', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__financeira', label: 'Matemática Financeira', disciplina: 'matematica', area: 'matematica' },
    { id: 'matematica__matrizes_determinantes', label: 'Matrizes e Determinantes', disciplina: 'matematica', area: 'matematica' },
  ],
};

// ---------- HABILIDADES UNIVERSAIS ----------

export interface Skill {
  id: string;
  label: string;
}

export const SKILLS: Skill[] = [
  // Leitura e interpretação
  { id: 'interpretacao_texto_cientifico', label: 'Interpretação de Texto Científico' },
  { id: 'interpretacao_fonte_historica', label: 'Interpretação de Fonte Histórica (charge, cartaz, documento)' },
  { id: 'interpretacao_grafico', label: 'Interpretação de Gráfico' },
  { id: 'interpretacao_tabela', label: 'Interpretação de Tabela' },
  { id: 'interpretacao_mapa', label: 'Interpretação de Mapa' },
  { id: 'leitura_infografico', label: 'Leitura de Infográfico' },
  // Raciocínio e método
  { id: 'relacao_causa_consequencia', label: 'Relação Causa-Consequência' },
  { id: 'comparacao_processos', label: 'Comparação de Processos' },
  { id: 'identificacao_argumento', label: 'Identificação de Argumento' },
  { id: 'inferencias_implicitas', label: 'Inferências Implícitas' },
  { id: 'avaliacao_evidencias', label: 'Avaliação de Evidências' },
  { id: 'correlacao_variaveis', label: 'Correlação de Variáveis' },
  // Matemática aplicada
  { id: 'proporcionalidade', label: 'Proporcionalidade' },
  { id: 'conversao_unidades', label: 'Conversão de Unidades' },
  { id: 'estimativa_ordem_grandeza', label: 'Estimativa e Ordem de Grandeza' },
  { id: 'aplicacao_formula', label: 'Aplicação de Fórmula' },
  { id: 'balanco_massa_energia', label: 'Balanço de Massa ou Energia' },
  // Contexto e interdisciplinaridade
  { id: 'aplicacao_situacao_real', label: 'Aplicação em Situação Real' },
  { id: 'impacto_socioambiental', label: 'Impacto Socioambiental' },
  { id: 'tecnologia_e_sociedade', label: 'Tecnologia e Sociedade' },
  { id: 'ciencia_no_cotidiano', label: 'Ciência no Cotidiano' },
];

// ---------- MAPAS DE LOOKUP (internos) ----------

/** Flat map: topicId → Topic */
const _TOPIC_MAP = new Map<string, Topic>();
/** Flat map: skillId → Skill */
const _SKILL_MAP = new Map<string, Skill>();
/** Flat map: disciplinaId → Disciplina */
const _DISCIPLINA_MAP = new Map<string, Disciplina>();

for (const topics of Object.values(TOPICS)) {
  for (const t of topics) {
    _TOPIC_MAP.set(t.id, t);
  }
}
for (const s of SKILLS) {
  _SKILL_MAP.set(s.id, s);
}
for (const disc of Object.values(DISCIPLINAS)) {
  for (const d of disc) {
    _DISCIPLINA_MAP.set(d.id, d);
  }
}

// ---------- FUNÇÕES HELPER ----------

/** Returns true if ALL ids are valid topic IDs from the dictionary. */
export function validateTopicIds(ids: string[]): boolean {
  return ids.every((id) => _TOPIC_MAP.has(id));
}

/** Returns true if ALL ids are valid skill IDs from the dictionary. */
export function validateSkillIds(ids: string[]): boolean {
  return ids.every((id) => _SKILL_MAP.has(id));
}

/** Returns true if the disciplina ID exists in the dictionary. */
export function validateDisciplinaId(id: string): boolean {
  return _DISCIPLINA_MAP.has(id);
}

/** Returns all topics for a given area. */
export function getTopicsForArea(area: string): Topic[] {
  const disciplinas = DISCIPLINAS[area] ?? [];
  return disciplinas.flatMap((d) => TOPICS[d.id] ?? []);
}

/** Returns all topic IDs for a given area (for prompts). */
export function getTopicIdsForArea(area: string): string[] {
  return getTopicsForArea(area).map((t) => t.id);
}

/** Returns all topic IDs for a given disciplina. */
export function getTopicIdsForDisciplina(disciplinaId: string): string[] {
  return (TOPICS[disciplinaId] ?? []).map((t) => t.id);
}

/** Returns all skill IDs. */
export function getAllSkillIds(): string[] {
  return SKILLS.map((s) => s.id);
}

/** Returns label for a topic ID, or undefined if not found. */
export function getTopicLabel(id: string): string | undefined {
  return _TOPIC_MAP.get(id)?.label;
}

/** Returns label for a skill ID, or undefined if not found. */
export function getSkillLabel(id: string): string | undefined {
  return _SKILL_MAP.get(id)?.label;
}

/** Returns label for a disciplina ID, or undefined if not found. */
export function getDisciplinaLabel(id: string): string | undefined {
  return _DISCIPLINA_MAP.get(id)?.label;
}

/** Returns all disciplinas for a given area. */
export function getDisciplinasForArea(area: string): Disciplina[] {
  return DISCIPLINAS[area] ?? [];
}

/**
 * Filters a list of topic IDs, removing any that don't exist in the dictionary.
 * Returns [validIds, removedCount].
 */
export function filterValidTopicIds(ids: string[]): [string[], number] {
  const valid = ids.filter((id) => _TOPIC_MAP.has(id));
  return [valid, ids.length - valid.length];
}

/**
 * Filters a list of skill IDs, removing any that don't exist in the dictionary.
 * Returns [validIds, removedCount].
 */
export function filterValidSkillIds(ids: string[]): [string[], number] {
  const valid = ids.filter((id) => _SKILL_MAP.has(id));
  return [valid, ids.length - valid.length];
}

/** Removes duplicate IDs and trims to maxLength. */
export function normalizeIds(ids: string[], maxLength: number): string[] {
  return [...new Set(ids)].slice(0, maxLength);
}

// ---------- CLASSIFIER OUTPUT TYPE ----------

export interface ClassificationOutput {
  disciplina: string;
  topics: string[];
  skills: string[];
  difficulty: 1 | 2 | 3;
  cognitive_level: 'recordacao' | 'compreensao' | 'aplicacao' | 'analise';
  confidence: number;
  rationale: string;
  needs_review: boolean;
}
