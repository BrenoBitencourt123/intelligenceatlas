// Config central UFU.
export const UFU_CONFIG = {
  // Suporte / liberação rápida (formato E.164 sem +, ex.: "5534999999999")
  WHATSAPP_BRENO: "5534999999999",

  // Grupo público do Placar UFU (deixe "" para não renderizar convite)
  GRUPO_WHATSAPP_URL: "",

  CORRECOES_GRATIS: 1,
} as const;

/** URL wa.me com mensagem pré-preenchida (encodeURIComponent aplicado). */
export function whatsappBrenoUrl(mensagem: string): string {
  const numero = UFU_CONFIG.WHATSAPP_BRENO.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
