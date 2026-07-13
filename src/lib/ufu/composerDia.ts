// Compositor da sessão diária. Regra: o aluno escolhe o quanto (meta),
// o sistema escolhe o quê. Retorna uma lista de segmentos (URLs) que o
// orquestrador `/trilha/dia` percorre em sequência.
//
// v0 pragmático: cada segmento é uma tela existente (flashcards, nó da
// trilha, corretor de redação). Sem reescrever players. As telas já sabem
// voltar a `/hoje`; o orquestrador intercepta e avança.
import { supabase } from '@/integrations/supabase/client';

type SegKind = 'flashcards' | 'no' | 'redacao';
export type Segmento = {
  kind: SegKind;
  url: string;
  rotulo: string; // 1 palavra pro preview honesto
  estimMin: number; // pra somar tempo total
};

export type PlanoDia = {
  data: string; // yyyy-mm-dd — se mudou o dia, plano expira
  segmentos: Segmento[];
  cursor: number;
};

const untypedSupabase = supabase as unknown as { from: (t: string) => any };

async function contarFlashcardsVencidos(userId: string): Promise<number> {
  const nowIso = new Date().toISOString();
  const { count } = await untypedSupabase
    .from('flashcards')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_at', nowIso);
  return count ?? 0;
}

async function proxNoAtivo(userId: string): Promise<{ id: string; disciplina: string; titulo: string } | null> {
  // Busca todos os nós ativos (por disciplina/ordem) e o progresso do user.
  // Escolhe o primeiro não-dourado — mesmo cadeado linear usado em /hoje.
  const [{ data: nos }, { data: prog }] = await Promise.all([
    untypedSupabase
      .from('trilha_nos')
      .select('id,disciplina,titulo,ordem')
      .eq('ativo', true)
      .order('disciplina')
      .order('ordem'),
    untypedSupabase
      .from('trilha_progresso')
      .select('no_id,dourado')
      .eq('user_id', userId),
  ]);
  const douradosSet = new Set(
    ((prog as { no_id: string; dourado: boolean }[]) ?? [])
      .filter((r) => r.dourado)
      .map((r) => r.no_id),
  );
  const lista = ((nos as { id: string; disciplina: string; titulo: string; ordem: number }[]) ?? []);
  return lista.find((n) => !douradosSet.has(n.id)) ?? null;
}

async function temaSemanaAtivo(): Promise<{ proposta_id: string; titulo: string } | null> {
  try {
    const mod = await import('@/lib/ufu/temaSemana');
    const t = await mod.getTemaSemana();
    return t ? { proposta_id: t.proposta_id, titulo: t.titulo } : null;
  } catch {
    return null;
  }
}

export async function comporPlanoDia(params: {
  userId: string;
  diaRedacao: number; // 0-6
}): Promise<PlanoDia> {
  const hoje = new Date();
  const isEssayDay = hoje.getDay() === params.diaRedacao;
  const hojeStr = hoje.toISOString().slice(0, 10);

  const [flashDue, noAtivo, tema] = await Promise.all([
    contarFlashcardsVencidos(params.userId),
    proxNoAtivo(params.userId),
    isEssayDay ? temaSemanaAtivo() : Promise.resolve(null),
  ]);

  const segs: Segmento[] = [];

  // 1) Aquecimento: flashcards vencidos (só se houver)
  if (flashDue > 0) {
    segs.push({
      kind: 'flashcards',
      url: '/flashcards',
      rotulo: `${flashDue} revisões`,
      estimMin: Math.min(3, Math.ceil(flashDue * 0.3)),
    });
  }

  // 2) Núcleo: o nó atual, se houver
  if (noAtivo) {
    segs.push({
      kind: 'no',
      url: `/ufu/no/${noAtivo.id}`,
      rotulo: noAtivo.disciplina === 'redacao' ? 'redação' : noAtivo.disciplina,
      estimMin: 8,
    });
  }

  // 3) Chefe da semana: se for dia de redação e existe tema
  if (isEssayDay && tema) {
    segs.push({
      kind: 'redacao',
      url: `/redacao-ufu?proposta=${encodeURIComponent(tema.proposta_id)}`,
      rotulo: 'chefe da semana',
      estimMin: 30,
    });
  }

  // Fallback: sem nada agendado, manda pra revisão livre
  if (segs.length === 0) {
    segs.push({
      kind: 'flashcards',
      url: '/flashcards',
      rotulo: 'revisão livre',
      estimMin: 5,
    });
  }

  return { data: hojeStr, segmentos: segs, cursor: 0 };
}

// ── Persistência do plano no sessionStorage ──────────────────────────────
const PLAN_KEY = 'ufu_dia_plan';

export function lerPlanoDia(): PlanoDia | null {
  try {
    const raw = sessionStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PlanoDia;
    const hojeStr = new Date().toISOString().slice(0, 10);
    if (p.data !== hojeStr) {
      sessionStorage.removeItem(PLAN_KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function salvarPlanoDia(p: PlanoDia): void {
  try {
    sessionStorage.setItem(PLAN_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function limparPlanoDia(): void {
  try {
    sessionStorage.removeItem(PLAN_KEY);
  } catch {
    /* ignore */
  }
}

// Preview honesto de 1 linha: "hoje: 3 revisões + matemática + chefe da semana"
export function preview(plano: PlanoDia): string {
  return 'hoje: ' + plano.segmentos.map((s) => s.rotulo).join(' + ');
}

export function tempoTotalMin(plano: PlanoDia): number {
  return plano.segmentos.reduce((acc, s) => acc + s.estimMin, 0);
}
