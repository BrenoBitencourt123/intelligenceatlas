import { supabase } from "@/integrations/supabase/client";

// Instrumentação de eventos UFU — regra: medir desde o dia 1.
// Identidade: session_id (localStorage) sempre; user_id quando logado.
// Views devem usar coalesce(user_id::text, session_id) — trocar de aparelho
// ou limpar storage quebra a série sem o user_id.

export type UfuEvent =
  | "calc_completed"
  | "card_generated"
  | "card_shared"
  | "card_downloaded"
  | "trilha_sessao_inicio"
  | "trilha_sessao_fim"
  | "trilha_sessao_abandono"
  | "celebracao_vista"
  | "celebracao_pulada"
  | "combo_atingido"
  | "placar_atualizado"
  | "push_click";


const SESSION_KEY = "ufu_calc_session";

function sessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

// Cache do user_id atual — atualizado via listener de auth.
let currentUserId: string | null = null;
supabase.auth.getSession().then(({ data }) => {
  currentUserId = data.session?.user?.id ?? null;
});
supabase.auth.onAuthStateChange((_evt, session) => {
  currentUserId = session?.user?.id ?? null;
});

export function trackUfu(event: UfuEvent, payload: Record<string, unknown> = {}): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("ufu_events")
      .insert({
        event,
        payload,
        session_id: sessionId(),
        user_id: currentUserId,
      })
      .then(({ error }: { error: unknown }) => {
        if (error) console.warn("[ufu_events]", error);
      });
  } catch (e) {
    console.warn("[ufu_events]", e);
  }
}
