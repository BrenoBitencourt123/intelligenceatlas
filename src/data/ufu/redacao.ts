// ============================================================
// Redação UFU — modelo oficial da banca (Edital DIRPS 18/2026, seção 6.3)
// 5 critérios, 80 pontos, notas por FAIXA (não contínuas).
// Nota zero ELIMINA o candidato do certame.
// ============================================================

export const REDACAO_TOTAL = 80;
export const LINHAS_MIN = 15;
export const LINHAS_MAX = 34;
/** Largura aproximada da folha oficial, usada pra estimar linhas a partir do texto digitado. */
export const CHARS_POR_LINHA = 70;

export interface GeneroUfu {
  id: string;
  label: string;
  /** Elementos constitutivos que a banca procura (critério "Gênero do discurso"). */
  elementos: string[];
}

export const GENEROS_UFU: GeneroUfu[] = [
  {
    id: "carta_solicitacao",
    label: "Carta de solicitação",
    elementos: [
      "Local e data",
      "Vocativo adequado ao destinatário (autoridade/instituição)",
      "Apresentação de quem escreve e do motivo da carta",
      "Pedido explícito e justificado (o que se solicita e por quê)",
      "Argumentação que sustenta a solicitação",
      "Fecho de despedida formal + assinatura genérica (sem identificação real)",
      "Registro formal e interlocução constante com o destinatário",
    ],
  },
  {
    id: "carta_reclamacao",
    label: "Carta de reclamação",
    elementos: [
      "Local e data",
      "Vocativo adequado ao destinatário",
      "Identificação do problema/objeto da reclamação",
      "Relato objetivo do ocorrido com argumentação",
      "Exigência ou expectativa de providência",
      "Fecho formal + assinatura genérica",
      "Registro formal e interlocução com o destinatário",
    ],
  },
  {
    id: "carta_aberta",
    label: "Carta aberta",
    elementos: [
      "Vocativo/destinatário coletivo ou público",
      "Explicitação do papel de quem assina (voz coletiva ou cidadã)",
      "Tese/posicionamento público sobre a questão",
      "Argumentação dirigida ao interlocutor coletivo",
      "Apelo ou convocação à ação",
      "Fecho + assinatura genérica",
    ],
  },
  {
    id: "artigo_opiniao",
    label: "Artigo de opinião",
    elementos: [
      "Título (recomendado)",
      "Tese clara sobre a questão polêmica",
      "Argumentos que sustentam a tese (dados, exemplos, causa-consequência)",
      "Consideração/refutação de contra-argumento (fortalece)",
      "Conclusão que retoma a tese",
      "3ª pessoa ou 1ª pessoa autoral; registro formal; SEM elementos de carta",
    ],
  },
  {
    id: "noticia",
    label: "Notícia",
    elementos: [
      "Título (manchete) e, se possível, linha fina",
      "Lide: o quê, quem, quando, onde, como, por quê",
      "Progressão do mais ao menos importante (pirâmide invertida)",
      "Impessoalidade — SEM opinião do autor",
      "Uso de fontes/falas (discurso direto ou indireto)",
      "Verbos predominantemente no passado; registro formal",
    ],
  },
  {
    id: "resenha_critica",
    label: "Resenha crítica",
    elementos: [
      "Identificação da obra/objeto resenhado (título, autoria, contexto)",
      "Síntese/descrição do conteúdo",
      "Avaliação crítica explícita (juízo de valor fundamentado)",
      "Recomendação (ou não) ao leitor",
      "Equilíbrio entre resumo e crítica; registro formal",
    ],
  },
  {
    id: "relato",
    label: "Relato",
    elementos: [
      "Narrador em 1ª pessoa (experiência vivida ou testemunhada)",
      "Situação inicial, desenvolvimento e desfecho",
      "Marcadores de tempo e espaço",
      "Verbos predominantemente no passado",
      "Reflexão/avaliação sobre a experiência (relato ≠ mera lista de fatos)",
    ],
  },
];

export interface FaixaCriterio {
  pontos: number;
  rotulo: string;
  descricao: string;
}

export interface CriterioUfu {
  id: string;
  nome: string;
  max: number;
  faixas: FaixaCriterio[]; // da maior pra menor
}

// Rubrica oficial (Quadro 2 do edital) — faixas exatas
export const CRITERIOS_UFU: CriterioUfu[] = [
  {
    id: "proposta_tematica",
    nome: "Proposta temática",
    max: 20,
    faixas: [
      { pontos: 20, rotulo: "Atendimento total", descricao: "Compreensão totalmente adequada da proposta E plena obediência ao que se pede." },
      { pontos: 15, rotulo: "Atendimento satisfatório", descricao: "Compreensão adequada, com falhas pontuais que não comprometem o que se pede." },
      { pontos: 10, rotulo: "Atendimento parcial", descricao: "Compreensão pouco adequada, com falhas que comprometem significativamente o que se pede." },
      { pontos: 5, rotulo: "Tangenciamento do tema", descricao: "Trata de assunto relacionado sem desenvolver o recorte específico exigido; foco no tema amplo ou em aspectos periféricos." },
      { pontos: 0, rotulo: "Não atendimento", descricao: "Compreensão totalmente equivocada; desobediência ao que se pede. ZERA E ELIMINA." },
    ],
  },
  {
    id: "genero_discurso",
    nome: "Gênero do discurso",
    max: 20,
    faixas: [
      { pontos: 20, rotulo: "Produção totalmente satisfatória", descricao: "Contempla adequadamente todos os elementos constitutivos do gênero." },
      { pontos: 15, rotulo: "Parcialmente satisfatória (composição)", descricao: "Presença de falhas na construção composicional." },
      { pontos: 10, rotulo: "Parcialmente satisfatória (estilo)", descricao: "Presença de falhas no estilo." },
      { pontos: 5, rotulo: "Produção insatisfatória", descricao: "Falhas na construção composicional E no estilo." },
      { pontos: 0, rotulo: "Gênero não reconhecível", descricao: "Muitas falhas que impossibilitam o reconhecimento do gênero. ZERA E ELIMINA." },
    ],
  },
  {
    id: "coesao_coerencia",
    nome: "Coesão e coerência textuais",
    max: 20,
    faixas: [
      { pontos: 20, rotulo: "Totalmente coeso e coerente", descricao: "Fatores de coerência adequados E ótima articulação (coesão referencial e sequencial)." },
      { pontos: 15, rotulo: "Coerente, com falhas de coesão", descricao: "Falhas de coesão referencial/sequencial que não comprometem o sentido." },
      { pontos: 10, rotulo: "Coeso, com falhas na coerência", descricao: "Baixa informatividade, pouca progressão temática, contradições, clichês; comprometimento parcial do sentido." },
      { pontos: 5, rotulo: "Pouco coerente e pouco coeso", descricao: "Falhas conceituais E articulação inadequada que comprometem significativamente o sentido." },
      { pontos: 0, rotulo: "Incoeso e incoerente", descricao: "Muitas falhas conceituais E articulação totalmente inadequada." },
    ],
  },
  {
    id: "convencoes_escrita",
    nome: "Convenções de escrita",
    max: 12,
    faixas: [
      { pontos: 12, rotulo: "Pleno domínio da norma-padrão", descricao: "Uso adequado dos recursos gramaticais/ortográficos (admitem-se no máximo 2 desvios)." },
      { pontos: 9, rotulo: "Bom domínio", descricao: "Poucos desvios E presença de construções sintáticas simples." },
      { pontos: 6, rotulo: "Pouco domínio", descricao: "Predominância de sintaxe simples E recorrência de desvios." },
      { pontos: 3, rotulo: "Domínio insatisfatório", descricao: "Maioria de sintaxe simples E desvios que comprometem globalmente o sentido." },
      { pontos: 0, rotulo: "Sem domínio", descricao: "Desvios generalizados que impedem a compreensão." },
    ],
  },
  {
    id: "leitura_motivadores",
    nome: "Leitura dos textos motivadores e repertório",
    max: 8,
    faixas: [
      { pontos: 8, rotulo: "Uso totalmente adequado", descricao: "Leitura crítica, compreensão global, diálogo com os motivadores E repertório cultural pertinente." },
      { pontos: 6, rotulo: "Uso adequado", descricao: "Leitura satisfatória, mas apenas paráfrase E repertório pertinente." },
      { pontos: 4, rotulo: "Uso pouco adequado", descricao: "Leitura superficial, simples menções aos motivadores E repertório de bolso." },
      { pontos: 2, rotulo: "Uso inadequado", descricao: "Leitura equivocada, diálogo superficial E repertório de bolso." },
      { pontos: 0, rotulo: "Uso totalmente inadequado", descricao: "Ausência de diálogo e de repertório E presença de cópia de trechos. Cópia total ZERA E ELIMINA." },
    ],
  },
];

export const MOTIVOS_ZERO = [
  "Não atendimento à proposta temática (fuga ao tema)",
  "Não atendimento ao gênero solicitado (fuga ao gênero)",
  "Texto com menos de 15 linhas",
  "Cópia total dos textos motivadores",
  "Texto integral ou parcialmente em língua estrangeira",
  "Desrespeito aos direitos humanos; termos racistas, sexistas ou homofóbicos",
  "Assinatura, nome ou qualquer sinal que identifique o candidato",
];

// Propostas REAIS do Vestibular 2026/2 (pra treino imediato)
export interface PropostaUfu {
  id: string;
  generoId: string;
  titulo: string;
  enunciado: string;
}

export const PROPOSTAS_UFU: PropostaUfu[] = [
  {
    id: "2026_2_artigo_adocao",
    generoId: "artigo_opiniao",
    titulo: "Artigo de opinião — Adoção no Brasil (UFU 2026/2)",
    enunciado:
      "Escreva um artigo de opinião, para publicação em jornal de grande circulação, posicionando-se sobre os desafios da adoção no Brasil (fila de espera, perfil desejado pelos adotantes e adoção tardia).",
  },
  {
    id: "2026_2_carta_clima",
    generoId: "carta_solicitacao",
    titulo: "Carta de solicitação — Agenda climática (UFU 2026/2)",
    enunciado:
      "Escreva uma carta de solicitação ao Ministro do Meio Ambiente e Mudança do Clima, solicitando providências concretas relacionadas à agenda climática brasileira e justificando o pedido.",
  },
];

/** Estimativa de linhas na folha oficial (~70 caracteres por linha). */
export function estimarLinhas(texto: string): number {
  const paragrafos = texto.split("\n");
  return paragrafos.reduce((total, p) => {
    const t = p.trim();
    if (!t) return total; // linha em branco não existe na folha
    return total + Math.max(1, Math.ceil(t.length / CHARS_POR_LINHA));
  }, 0);
}
