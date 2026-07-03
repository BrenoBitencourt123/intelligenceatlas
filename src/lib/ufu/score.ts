import {
  CURSOS_UFU, DISCIPLINAS_UFU, TOTAL_QUESTOES,
  type CotaId, type CursoUfu,
} from "@/data/ufu/vestibular";

export type AcertosPorDisciplina = Record<string, number>;

export interface ResultadoCalculo {
  curso: CursoUfu;
  cota: CotaId;
  totalAcertos: number;       // 0-65
  corte: number | null;       // acertos brutos p/ 2ª fase (2026/2), null se cota sem corte publicado
  delta: number | null;       // totalAcertos - corte
  status: "acima" | "no_corte" | "abaixo" | "sem_referencia";
  pontosPonderados: number;   // Σ acertos × peso do curso (mostra onde a prova pesa)
  pontosPonderadosMax: number;
  /** disciplinas ordenadas por "pontos deixados na mesa" (erros × peso) */
  ondeInvestir: { disciplinaId: string; label: string; perdidos: number; peso: number }[];
}

export function calcularResultado(
  cursoId: string,
  cota: CotaId,
  acertos: AcertosPorDisciplina,
): ResultadoCalculo | null {
  const curso = CURSOS_UFU.find((cu) => cu.id === cursoId);
  if (!curso) return null;

  let totalAcertos = 0;
  let pontosPonderados = 0;
  let pontosPonderadosMax = 0;
  const ondeInvestir: ResultadoCalculo["ondeInvestir"] = [];

  DISCIPLINAS_UFU.forEach((d, i) => {
    const a = clamp(acertos[d.id] ?? 0, 0, d.questoes);
    const peso = curso.pesos[i];
    totalAcertos += a;
    pontosPonderados += a * peso;
    pontosPonderadosMax += d.questoes * peso;
    const perdidos = (d.questoes - a) * peso;
    if (perdidos > 0) ondeInvestir.push({ disciplinaId: d.id, label: d.label, perdidos, peso });
  });

  ondeInvestir.sort((x, y) => y.perdidos - x.perdidos);

  const corte = curso.cortes[cota] ?? null;
  const delta = corte === null ? null : totalAcertos - corte;
  const status: ResultadoCalculo["status"] =
    corte === null ? "sem_referencia"
    : delta! > 0 ? "acima"
    : delta! === 0 ? "no_corte"
    : "abaixo";

  return {
    curso, cota,
    totalAcertos: clamp(totalAcertos, 0, TOTAL_QUESTOES),
    corte, delta, status,
    pontosPonderados, pontosPonderadosMax,
    ondeInvestir: ondeInvestir.slice(0, 3),
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(v)));
}
