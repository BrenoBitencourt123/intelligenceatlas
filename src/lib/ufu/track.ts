import { supabase } from "@/integrations/supabase/client";

// Instrumentação de share do card — regra do projeto: medir desde o dia 1.
// Métrica-mãe: share_rate = card_shared / calc_completed (meta ≥ 10%).
// Sem cadastro: sessão anônima via localStorage.

export type UfuEvent =
  | "calc_completed"   // usuário viu um resultado
  | "card_generated"   // PNG gerado
  | "card_shared"      // Web Share disparado com sucesso
  | "card_downloaded"; // fallback de download usado

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

export function trackUfu(event: UfuEvent, payload: Record<string, unknown> = {}): void {
  // fire-and-forget; nunca quebra a UX se a tabela não existir ainda
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("ufu_events")
      .insert({ event, payload, session_id: sessionId() })
      .then(({ error }: { error: unknown }) => {
        if (error) console.warn("[ufu_events]", error);
      });
  } catch (e) {
    console.warn("[ufu_events]", e);
  }
}
