// Config central UFU.
export const UFU_CONFIG = {
  // Suporte / liberação rápida (formato E.164 sem +, ex.: "5534999999999")
  WHATSAPP_BRENO: "5534999999999",

  // Grupo público do Placar UFU (deixe "" para não renderizar convite)
  GRUPO_WHATSAPP_URL: "",

  CORRECOES_GRATIS: 1,

  // Pix de contingência via link de pagamento (Mercado Pago) enquanto o
  // Pix da Stripe não é liberado (é por convite + 60 dias de histórico).
  // Deixe "" para esconder o bloco no paywall. Liberação manual:
  // insert into ufu_creditos (user_id, qtd, motivo) values ('<id>', 1, 'pix');
  PIX_LINK_AVULSA: "",
  PIX_LINK_PACOTE5: "",
} as const;

/** URL wa.me com mensagem pré-preenchida (encodeURIComponent aplicado). */
export function whatsappBrenoUrl(mensagem: string): string {
  const numero = UFU_CONFIG.WHATSAPP_BRENO.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
