-- ============================================================
-- Regra "apresenta antes de cobrar" (achado do playtest do Breno,
-- item 7/14): fato arbitrário nunca aparece primeiro como pergunta.
-- Novo tipo 'info' (card de apresentação) + 2 cards no nó de redação.
-- ============================================================

ALTER TABLE public.trilha_itens DROP CONSTRAINT IF EXISTS trilha_itens_tipo_check;
ALTER TABLE public.trilha_itens ADD CONSTRAINT trilha_itens_tipo_check
  CHECK (tipo IN ('tocar','ligar','ordenar','completar','multipla','info'));

-- Card 1: os 7 gêneros, ANTES do primeiro exercício (nivel 0, ordem 0)
INSERT INTO public.trilha_itens (no_id, nivel, ordem, tipo, payload, needs_review) VALUES
('red-generos-zeros', 0, 0, 'info', $j${
  "enunciado": "Primeiro, o mapa: os 7 gêneros que a UFU pode pedir",
  "corpo": "✉️ 3 cartas: solicitação · reclamação · aberta\n📰 Notícia (manchete + lide)\n💬 Artigo de opinião (tese sobre polêmica)\n📚 Resenha crítica\n🧍 Relato (1ª pessoa)\n\nGuarda isso: NÃO existe 'dissertação do ENEM' na UFU — quem escreve ela, zera por fuga de gênero.",
  "gabarito": [],
  "feedback_erro": "",
  "feedback_acerto": "Agora é com você."
}$j$, false),

-- Card 2: a tabela de pesos, ANTES do ligar critério↔peso (nivel 1, ordem 0)
('red-generos-zeros', 1, 0, 'info', $j${
  "enunciado": "Os 5 critérios da banca — e quanto cada um vale (total 80)",
  "corpo": "🎯 Proposta temática — 20\n🏷️ Gênero/discurso — 20\n🔗 Coesão/coerência — 20\n✍️ Convenções da escrita — 12\n📖 Leitura dos motivadores — 8\n\nRepara: 60 dos 80 pontos estão nos três primeiros — e os três se decidem ANTES da primeira linha, no planejamento.",
  "gabarito": [],
  "feedback_erro": "",
  "feedback_acerto": "Agora liga cada um ao seu peso."
}$j$, false)
ON CONFLICT (no_id, nivel, ordem) DO NOTHING;
