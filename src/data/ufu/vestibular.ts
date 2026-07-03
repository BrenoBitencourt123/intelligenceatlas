// ============================================================
// Vestibular UFU 2026/2 — dados oficiais DIRPS
// Fontes:
// - Pesos: "Quadro de pesos das disciplinas por Curso - RETIFICADO"
//   (portalselecao.ufu.br, 16/03/2026)
// - Cortes: "Nota de Corte - Classificados para Segunda Fase"
//   (portalselecao.ufu.br, 12/06/2026) — em ACERTOS BRUTOS (0-65)
// - Estrutura da prova: Edital DIRPS 18/2026
// ============================================================

export const EDICAO = "2026/2";

// 11 disciplinas da prova objetiva, na ordem do quadro de pesos
export interface DisciplinaUfu {
  id: string;
  label: string;
  labelCurto: string;
  questoes: number; // nº de questões na prova objetiva
}

export const DISCIPLINAS_UFU: DisciplinaUfu[] = [
  { id: "portugues", label: "Língua Portuguesa", labelCurto: "Port", questoes: 10 },
  { id: "literatura", label: "Literatura", labelCurto: "Lit", questoes: 5 },
  { id: "lingua_estrangeira", label: "Língua Estrangeira", labelCurto: "LE", questoes: 5 },
  { id: "matematica", label: "Matemática", labelCurto: "Mat", questoes: 10 },
  { id: "fisica", label: "Física", labelCurto: "Fís", questoes: 5 },
  { id: "quimica", label: "Química", labelCurto: "Quí", questoes: 5 },
  { id: "biologia", label: "Biologia", labelCurto: "Bio", questoes: 5 },
  { id: "geografia", label: "Geografia", labelCurto: "Geo", questoes: 5 },
  { id: "historia", label: "História", labelCurto: "His", questoes: 5 },
  { id: "filosofia", label: "Filosofia", labelCurto: "Fil", questoes: 5 },
  { id: "sociologia", label: "Sociologia", labelCurto: "Soc", questoes: 5 },
];

export const TOTAL_QUESTOES = 65;
export const REDACAO_MAX = 80;
export const REDACAO_PESO = 3; // peso 3 em todos os cursos (quadro oficial)

// Perfis de peso (ordem = DISCIPLINAS_UFU): [Port, Lit, LE, Mat, Fís, Quí, Bio, Geo, His, Fil, Soc]
const PESOS = {
  exatas:   [1, 1, 1, 3, 2, 2, 2, 1, 1, 1, 1],
  humanas:  [2, 2, 2, 1, 1, 1, 1, 3, 3, 3, 3],
  bio:      [1, 1, 1, 2, 3, 3, 3, 1, 1, 1, 1],
  dados:    [2, 2, 2, 3, 1, 1, 1, 1, 1, 1, 1],
  gestao:   [1, 1, 1, 3, 1, 1, 1, 2, 2, 2, 2],
  linguagens: [3, 3, 3, 1, 1, 1, 1, 2, 2, 2, 2],
  edfisica: [1, 1, 1, 1, 3, 3, 3, 2, 2, 2, 2],
  si_mc:    [3, 3, 3, 2, 1, 1, 1, 1, 1, 1, 1],
} as const;

export type CotaId =
  | "AC" | "LI_EP" | "LI_PCD" | "LI_PPI" | "LI_Q"
  | "LB_EP" | "LB_PCD" | "LB_PPI" | "LB_Q";

export const COTAS: { id: CotaId; label: string; descricao: string }[] = [
  { id: "AC", label: "Ampla concorrência", descricao: "Sem reserva de vagas" },
  { id: "LI_EP", label: "LI • Escola pública", descricao: "Escola pública, independente de renda" },
  { id: "LI_PCD", label: "LI • Escola pública + PcD", descricao: "Escola pública + pessoa com deficiência, indep. de renda" },
  { id: "LI_PPI", label: "LI • Escola pública + PPI", descricao: "Escola pública + pretos, pardos e indígenas, indep. de renda" },
  { id: "LI_Q", label: "LI • Escola pública + Quilombola", descricao: "Escola pública + quilombola, indep. de renda" },
  { id: "LB_EP", label: "LB • Escola pública + renda", descricao: "Escola pública + renda ≤ 1,5 salário mínimo per capita" },
  { id: "LB_PCD", label: "LB • Renda + PcD", descricao: "Escola pública + baixa renda + pessoa com deficiência" },
  { id: "LB_PPI", label: "LB • Renda + PPI", descricao: "Escola pública + baixa renda + pretos, pardos e indígenas" },
  { id: "LB_Q", label: "LB • Renda + Quilombola", descricao: "Escola pública + baixa renda + quilombola" },
];

export interface CursoUfu {
  id: string;
  nome: string;
  campus: string;
  cidade: string;
  turno: string;
  pesos: readonly number[];
  /** Nota de corte 2026/2 para a 2ª fase (correção da redação), em acertos brutos (0-65), por cota. */
  cortes: Partial<Record<CotaId, number>>;
}

const c = (
  id: string, nome: string, campus: string, cidade: string, turno: string,
  pesos: readonly number[], cortes: Partial<Record<CotaId, number>>,
): CursoUfu => ({ id, nome, campus, cidade, turno, pesos, cortes });

export const CURSOS_UFU: CursoUfu[] = [
  // ── Campus Santa Mônica (Uberlândia) ──
  c("administracao_integral", "Administração", "Santa Mônica", "Uberlândia", "Integral", PESOS.humanas, { AC: 30, LI_EP: 16, LI_PPI: 28 }),
  c("administracao_noturno", "Administração", "Santa Mônica", "Uberlândia", "Noturno", PESOS.humanas, { AC: 29, LI_EP: 12, LI_PPI: 18, LB_EP: 27, LB_PCD: 26 }),
  c("ciberseguranca", "Cibersegurança", "Santa Mônica", "Uberlândia", "Noturno", PESOS.exatas, { AC: 26, LI_EP: 23, LI_PPI: 12, LB_EP: 25, LB_PPI: 19 }),
  c("ciencia_computacao", "Ciência da Computação", "Santa Mônica", "Uberlândia", "Integral", PESOS.exatas, { AC: 39, LI_EP: 34, LI_PCD: 0, LI_PPI: 14, LB_EP: 16, LB_PPI: 33 }),
  c("ciencia_dados", "Ciência de Dados e Estatística", "Santa Mônica", "Uberlândia", "Noturno", PESOS.dados, { AC: 15 }),
  c("contabeis_integral", "Ciências Contábeis", "Santa Mônica", "Uberlândia", "Integral", PESOS.humanas, { AC: 12 }),
  c("contabeis_noturno", "Ciências Contábeis", "Santa Mônica", "Uberlândia", "Noturno", PESOS.humanas, { AC: 10 }),
  c("economia", "Ciências Econômicas", "Santa Mônica", "Uberlândia", "Integral", PESOS.humanas, { AC: 35, LI_EP: 22 }),
  c("direito_matutino", "Direito", "Santa Mônica", "Uberlândia", "Matutino", PESOS.humanas, { AC: 45, LI_EP: 40, LI_PCD: 27, LI_PPI: 27, LB_EP: 30, LB_PCD: 35, LB_PPI: 15 }),
  c("direito_noturno", "Direito", "Santa Mônica", "Uberlândia", "Noturno", PESOS.humanas, { AC: 40, LI_EP: 36, LI_PCD: 17, LI_PPI: 24, LB_EP: 26, LB_Q: 23, LB_PPI: 16 }),
  c("eng_biomedica", "Engenharia Biomédica", "Santa Mônica", "Uberlândia", "Integral", PESOS.exatas, { AC: 25 }),
  c("eng_civil", "Engenharia Civil", "Santa Mônica", "Uberlândia", "Integral", PESOS.exatas, { AC: 36, LI_EP: 21, LI_PPI: 24, LB_EP: 22 }),
  c("eng_computacao_ia", "Engenharia de Computação com IA Aplicada", "Santa Mônica", "Uberlândia", "Vespertino", PESOS.exatas, { AC: 40, LI_EP: 36, LI_PCD: 31, LI_PPI: 20, LB_EP: 31 }),
  c("eng_controle_automacao", "Engenharia de Controle e Automação", "Santa Mônica", "Uberlândia", "Integral", PESOS.dados, { AC: 24, LI_EP: 17, LI_PPI: 12 }),
  c("eng_eletrica", "Engenharia Elétrica", "Santa Mônica", "Uberlândia", "Integral", PESOS.exatas, { AC: 36, LI_EP: 31, LB_EP: 19 }),
  c("eng_eletronica_sm", "Engenharia Eletrônica e de Telecomunicações", "Santa Mônica", "Uberlândia", "Integral", PESOS.exatas, { AC: 27 }),
  c("eng_quimica", "Engenharia Química", "Santa Mônica", "Uberlândia", "Integral", PESOS.exatas, { AC: 32, LI_EP: 18, LB_PPI: 24 }),
  c("gestao_informacao", "Gestão da Informação", "Santa Mônica", "Uberlândia", "Integral", PESOS.gestao, { AC: 11 }),
  c("inteligencia_artificial", "Inteligência Artificial", "Santa Mônica", "Uberlândia", "Matutino", PESOS.exatas, { AC: 32, LI_EP: 26, LI_PCD: 23, LI_PPI: 19 }),
  c("matematica_abi", "Matemática (ABI)", "Santa Mônica", "Uberlândia", "Integral", PESOS.exatas, { AC: 29, LI_EP: 12 }),
  c("musica_abi", "Música (ABI)", "Santa Mônica", "Uberlândia", "Integral", PESOS.linguagens, { AC: 24, LI_EP: 17 }),
  c("quimica_industrial", "Química Industrial", "Santa Mônica", "Uberlândia", "Integral", PESOS.exatas, { AC: 17 }),
  c("relacoes_internacionais", "Relações Internacionais", "Santa Mônica", "Uberlândia", "Integral", PESOS.humanas, { AC: 38, LI_EP: 33, LI_PCD: 30, LI_PPI: 18, LB_EP: 20 }),
  c("sistemas_informacao_sm", "Sistemas de Informação", "Santa Mônica", "Uberlândia", "Noturno", PESOS.exatas, { AC: 32, LI_EP: 28, LI_PCD: 24, LI_PPI: 11, LB_EP: 16, LB_PPI: 14 }),
  // ── Campus Umuarama (Uberlândia) ──
  c("biomedicina", "Biomedicina", "Umuarama", "Uberlândia", "Integral", PESOS.bio, { AC: 39, LI_EP: 37, LI_PCD: 23, LI_PPI: 28, LB_EP: 25, LB_PPI: 16 }),
  c("biotecnologia_umuarama", "Biotecnologia", "Umuarama", "Uberlândia", "Integral", PESOS.bio, { AC: 33, LI_EP: 30, LI_PCD: 24, LI_PPI: 27, LB_EP: 20 }),
  c("bio_bacharelado", "Ciências Biológicas (Bacharelado)", "Umuarama", "Uberlândia", "Integral", PESOS.bio, { AC: 36, LI_EP: 33, LI_PPI: 16, LB_EP: 17, LB_PPI: 24 }),
  c("bio_licenciatura_integral", "Ciências Biológicas (Licenciatura)", "Umuarama", "Uberlândia", "Integral", PESOS.bio, { AC: 25, LI_EP: 19 }),
  c("bio_licenciatura_noturno", "Ciências Biológicas (Licenciatura)", "Umuarama", "Uberlândia", "Noturno", PESOS.bio, { AC: 27, LI_EP: 25 }),
  c("enfermagem", "Enfermagem", "Umuarama", "Uberlândia", "Integral", PESOS.linguagens, { AC: 32, LI_EP: 29, LI_PCD: 25, LI_PPI: 15, LB_EP: 18, LB_PPI: 30 }),
  c("medicina", "Medicina", "Umuarama", "Uberlândia", "Integral", PESOS.bio, { AC: 57, LI_EP: 54, LI_PCD: 46, LI_PPI: 44, LB_EP: 48, LB_PCD: 38, LB_Q: 35, LB_PPI: 37 }),
  c("nutricao", "Nutrição", "Umuarama", "Uberlândia", "Integral", PESOS.bio, { AC: 36, LI_EP: 33, LI_PCD: 34, LI_PPI: 13, LB_EP: 12, LB_PPI: 27 }),
  c("odontologia", "Odontologia", "Umuarama", "Uberlândia", "Integral", PESOS.bio, { AC: 39, LI_EP: 36, LI_PCD: 26, LI_PPI: 13, LB_EP: 26 }),
  c("psicologia", "Psicologia", "Umuarama", "Uberlândia", "Integral", PESOS.humanas, { AC: 42, LI_EP: 40, LI_PCD: 11, LI_PPI: 26, LB_EP: 28, LB_PPI: 17 }),
  // ── Campus Glória (Uberlândia) ──
  c("agronomia_gloria", "Agronomia", "Glória", "Uberlândia", "Integral", PESOS.bio, { AC: 36, LI_EP: 31, LI_PCD: 15, LI_PPI: 15, LB_EP: 21 }),
  c("eng_aeronautica", "Engenharia Aeronáutica", "Glória", "Uberlândia", "Integral", PESOS.exatas, { AC: 44, LI_EP: 41, LI_PCD: 19, LI_PPI: 18, LB_EP: 26 }),
  c("eng_ambiental", "Engenharia Ambiental e Sanitária", "Glória", "Uberlândia", "Integral", PESOS.exatas, { AC: 15 }),
  c("eng_mecanica", "Engenharia Mecânica", "Glória", "Uberlândia", "Integral", PESOS.exatas, { AC: 38, LI_EP: 32, LI_PPI: 21, LB_EP: 12 }),
  c("eng_mecatronica", "Engenharia Mecatrônica", "Glória", "Uberlândia", "Integral", PESOS.exatas, { AC: 37, LI_EP: 29, LI_PCD: 28, LI_PPI: 16, LB_EP: 24 }),
  c("veterinaria", "Medicina Veterinária", "Glória", "Uberlândia", "Integral", PESOS.bio, { AC: 38, LI_EP: 33, LI_PCD: 18, LI_PPI: 18, LB_EP: 16, LB_PPI: 18 }),
  c("zootecnia", "Zootecnia", "Glória", "Uberlândia", "Integral", PESOS.bio, { AC: 25, LI_EP: 22 }),
  // ── Campus Educação Física (Uberlândia) ──
  c("educacao_fisica", "Educação Física", "Educação Física", "Uberlândia", "Integral", PESOS.edfisica, { AC: 30, LI_EP: 25, LI_PCD: 17, LI_PPI: 15, LB_EP: 17, LB_PPI: 25 }),
  c("fisioterapia", "Fisioterapia", "Educação Física", "Uberlândia", "Integral", PESOS.bio, { AC: 36, LI_EP: 35, LI_PCD: 24, LI_PPI: 19, LB_EP: 25, LB_PPI: 27 }),
  // ── Campus Pontal (Ituiutaba) ──
  c("eng_producao", "Engenharia de Produção", "Pontal", "Ituiutaba", "Integral", PESOS.exatas, { AC: 13 }),
  // ── Campus Monte Carmelo ──
  c("agronomia_mc", "Agronomia", "Monte Carmelo", "Monte Carmelo", "Integral", PESOS.bio, { AC: 14 }),
  c("eng_agrimensura", "Engenharia de Agrimensura e Cartográfica", "Monte Carmelo", "Monte Carmelo", "Integral", PESOS.exatas, { AC: 21 }),
  c("eng_florestal", "Engenharia Florestal", "Monte Carmelo", "Monte Carmelo", "Integral", PESOS.exatas, { AC: 15 }),
  c("sistemas_informacao_mc", "Sistemas de Informação", "Monte Carmelo", "Monte Carmelo", "Integral", PESOS.si_mc, { AC: 16 }),
  // ── Campus Patos de Minas ──
  c("biotecnologia_patos", "Biotecnologia", "Patos de Minas", "Patos de Minas", "Integral", PESOS.bio, { AC: 9 }),
  c("eng_alimentos", "Engenharia de Alimentos", "Patos de Minas", "Patos de Minas", "Integral", PESOS.bio, { AC: 14 }),
  c("eng_eletronica_patos", "Engenharia Eletrônica e de Telecomunicações", "Patos de Minas", "Patos de Minas", "Integral", PESOS.exatas, { AC: 12 }),
];

export function getCurso(id: string): CursoUfu | undefined {
  return CURSOS_UFU.find((cu) => cu.id === id);
}
