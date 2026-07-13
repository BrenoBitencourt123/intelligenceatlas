import { supabase } from "@/integrations/supabase/client";

// Regras de negócio do "placar vivo" — a bolinha nunca nasce em zero.
export const META_TOTAL = 65;

export type PlacarFonte = "quiz" | "autoavaliacao" | "trilha" | "simulado";

// Fallback conservador do diagnóstico. Só pode subir a partir daí.
export const AUTOAVALIACAO_FALLBACK: Record<string, number> = {
  nada: 0,
  basico: 18,
  bastante: 30,
};

// Prioridade de fontes: simulado > trilha > quiz > autoavaliacao.
const PRIORIDADE: Record<PlacarFonte, number> = {
  simulado: 4,
  trilha: 3,
  quiz: 2,
  autoavaliacao: 1,
};

export function fonteVence(nova: PlacarFonte, atual: PlacarFonte | null): boolean {
  if (!atual) return true;
  return PRIORIDADE[nova] >= PRIORIDADE[atual];
}

// Recalcula placar a partir de respostas reais DIRPS (nível 5 multipla) + questões UFU do banco.
// Só ativa com ≥ 8 respostas reais.
export async function recomputePlacarTrilha(userId: string): Promise<number | null> {
  // Trilha: itens nivel 5 tipo multipla
  const { data: itens } = await (supabase as any)
    .from("trilha_itens")
    .select("id")
    .eq("nivel", 5)
    .eq("tipo", "multipla");
  const itemIds = ((itens as { id: string }[]) ?? []).map((i) => i.id);

  let respRows: { acertou_primeira: boolean }[] = [];
  if (itemIds.length > 0) {
    const { data } = await (supabase as any)
      .from("trilha_respostas")
      .select("acertou_primeira")
      .eq("user_id", userId)
      .in("item_id", itemIds);
    respRows = (data as { acertou_primeira: boolean }[]) ?? [];
  }

  // Questões UFU do banco (question_attempts joined via inner on questions.exam='ufu')
  let attRows: { is_correct: boolean }[] = [];
  const { data: attData } = await (supabase as any)
    .from("question_attempts")
    .select("is_correct, questions!inner(exam)")
    .eq("user_id", userId)
    .eq("questions.exam", "ufu");
  attRows = ((attData as { is_correct: boolean }[]) ?? []);

  const total = respRows.length + attRows.length;
  if (total < 8) return null;

  const acertos =
    respRows.filter((r) => r.acertou_primeira).length +
    attRows.filter((a) => a.is_correct).length;

  return Math.round((acertos / total) * META_TOTAL);
}

// Atualiza placar respeitando a prioridade da fonte. Devolve o novo valor (ou null se não atualizou).
export async function atualizarPlacar(
  userId: string,
  novoValor: number,
  fonte: PlacarFonte,
  fonteAtual: PlacarFonte | null,
): Promise<number | null> {
  if (!fonteVence(fonte, fonteAtual)) return null;
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ placar_estimado: novoValor, placar_fonte: fonte })
    .eq("id", userId);
  if (error) {
    console.error("Falha ao gravar placar", error);
    return null;
  }
  return novoValor;
}
