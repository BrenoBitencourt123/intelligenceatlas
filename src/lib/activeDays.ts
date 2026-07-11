import { supabase } from '@/integrations/supabase/client';

// Fonte única de verdade pro que conta como "dia ativo". Streak (useStudyStats)
// e calendário (Today) precisam concordar — sem isso, o carimbo aparece na
// semana mas o fogo não conta, ou vice-versa.
//
// Definição: qualquer dia em que existiu ao menos um dos abaixo,
//   • study_sessions com is_extra=false,
//   • essays,
//   • trilha_respostas,
//   • question_attempts com extra_session=false.
// Freezes ficam por fora — só o useStudyStats trata deles pra manter o streak.

export type DayISO = string; // "YYYY-MM-DD"

const isoDay = (isoTs: string): DayISO => isoTs.split('T')[0];

interface Options {
  sinceIso?: string; // ISO timestamp — filtro inferior (inclusive)
  untilIso?: string; // ISO timestamp — filtro superior (exclusivo)
  limit?: number;    // limite por fonte, útil pro streak
}

export async function fetchActiveDays(
  userId: string,
  opts: Options = {},
): Promise<Set<DayISO>> {
  const { sinceIso, untilIso, limit } = opts;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anySb = supabase as any;

  const applyRange = (q: any, col: string) => {
    let out = q;
    if (sinceIso) out = out.gte(col, sinceIso);
    if (untilIso) out = out.lt(col, untilIso);
    if (limit) out = out.order(col, { ascending: false }).limit(limit);
    return out;
  };

  const [sessionsRes, essaysRes, trilhaRes, attemptsRes] = await Promise.all([
    applyRange(
      anySb.from('study_sessions').select('session_date').eq('user_id', userId).eq('is_extra', false),
      'session_date',
    ),
    applyRange(
      anySb.from('essays').select('created_at').eq('user_id', userId),
      'created_at',
    ),
    applyRange(
      anySb.from('trilha_respostas').select('created_at').eq('user_id', userId),
      'created_at',
    ),
    applyRange(
      anySb.from('question_attempts').select('created_at').eq('user_id', userId).eq('extra_session', false),
      'created_at',
    ),
  ]);

  const active = new Set<DayISO>();
  (sessionsRes.data ?? []).forEach((r: { session_date: string }) => active.add(r.session_date));
  (essaysRes.data ?? []).forEach((r: { created_at: string }) => active.add(isoDay(r.created_at)));
  (trilhaRes.data ?? []).forEach((r: { created_at: string }) => active.add(isoDay(r.created_at)));
  (attemptsRes.data ?? []).forEach((r: { created_at: string }) => active.add(isoDay(r.created_at)));

  return active;
}

// Marca dias com redação — usado pelo calendário pra mostrar o ícone da caneta.
export async function fetchEssayDays(
  userId: string,
  opts: Options = {},
): Promise<Set<DayISO>> {
  const { sinceIso, untilIso } = opts;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anySb = supabase as any;
  let q = anySb.from('essays').select('created_at').eq('user_id', userId);
  if (sinceIso) q = q.gte('created_at', sinceIso);
  if (untilIso) q = q.lt('created_at', untilIso);
  const { data } = await q;
  const out = new Set<DayISO>();
  (data ?? []).forEach((r: { created_at: string }) => out.add(isoDay(r.created_at)));
  return out;
}
