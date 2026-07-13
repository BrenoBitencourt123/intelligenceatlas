// Tema da semana — a proposta que orbita todos os degraus da semana.
// Semana ISO no formato "YYYY-Www" (segunda a domingo).
import { supabase } from '@/integrations/supabase/client';
import { PROPOSTAS_UFU } from '@/data/ufu/redacao';

export function isoWeek(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export type TemaSemana = {
  semana_iso: string;
  proposta_id: string;
  titulo: string;
  enunciado?: string;
};

// Deterministic fallback so, mesmo sem curadoria, a semana já tem tema.
function fallbackProposta(semana: string): { id: string; titulo: string; enunciado?: string } {
  let hash = 0;
  for (const ch of semana) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const p = PROPOSTAS_UFU[hash % PROPOSTAS_UFU.length];
  return { id: p.id, titulo: (p as any).tema ?? (p as any).titulo ?? p.id, enunciado: (p as any).enunciado };
}

export async function getTemaSemana(when: Date = new Date()): Promise<TemaSemana> {
  const semana = isoWeek(when);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data } = await sb
    .from('temas_semana')
    .select('semana_iso, proposta_id, titulo')
    .eq('semana_iso', semana)
    .maybeSingle();
  if (data?.proposta_id) {
    const p = PROPOSTAS_UFU.find((pp) => pp.id === data.proposta_id);
    return {
      semana_iso: semana,
      proposta_id: data.proposta_id,
      titulo: data.titulo ?? (p as any)?.tema ?? (p as any)?.titulo ?? data.proposta_id,
      enunciado: (p as any)?.enunciado,
    };
  }
  const fb = fallbackProposta(semana);
  return { semana_iso: semana, proposta_id: fb.id, titulo: fb.titulo, enunciado: fb.enunciado };
}

export const DIAS_SEMANA = [
  { id: 0, label: 'Dom', long: 'Domingo' },
  { id: 1, label: 'Seg', long: 'Segunda' },
  { id: 2, label: 'Ter', long: 'Terça' },
  { id: 3, label: 'Qua', long: 'Quarta' },
  { id: 4, label: 'Qui', long: 'Quinta' },
  { id: 5, label: 'Sex', long: 'Sexta' },
  { id: 6, label: 'Sáb', long: 'Sábado' },
];
