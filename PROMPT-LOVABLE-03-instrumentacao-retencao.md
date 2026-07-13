# Prompt para Lovable — Instrumentação de retenção (a máquina de medir)

Colar DEPOIS dos prompts 01 e 02 (mede o que eles criaram). Pode ser colado
no mesmo dia — é pequeno.

Contexto de negócio: Memrise e Busuu tinham streak e morreram; o fosso do
Duolingo é a máquina que MEDE cada mecânica. Sem isso, celebração e push são
fé. Reusar a infra que já existe (`ufu_events` + `trackUfu` em lib/ufu/track)
— NÃO adicionar PostHog nem lib nova.

## 1. Eventos novos (via trackUfu, mesmo padrão dos existentes)

No player (TrilhaNo.tsx):
- `trilha_sessao_inicio` { no_id, disciplina, nivel_inicial }
- `trilha_sessao_fim` { no_id, itens, pct_primeira, tempo_s, dourado }
- `trilha_sessao_abandono` { no_id, idx, total } — disparar no X do header
  e em beforeunload/pagehide se sessão incompleta
- `celebracao_vista` { tela: 'perfeito'|'streak'|'placar', duracao_ms }
- `celebracao_pulada` { tela } — toque antes de 500ms conta como pulo
- `combo_atingido` { valor }

No push (edge function do prompt 02): já grava em `push_log`; adicionar
`push_click` { tipo } via query param no link (`/hoje?from=push-streak` →
trackUfu no mount do Today).

No placar: `placar_atualizado` { fonte, antes, depois }.

## 2. Views de retenção (SQL, mesmo padrão da ufu_share_rate)

- `ufu_retencao_d1`: % de usuários com `trilha_sessao_fim` no dia D que têm
  qualquer sessão em D+1. Colunas: dia, usuarios, retornaram, pct.
- `ufu_retencao_d7`: idem pra janela D+7.
- `ufu_funil_sessao`: por dia — inicios, fins, abandonos, pct_conclusao,
  media_pct_primeira (a janela saudável é 70–90% de acerto; fora dela o
  compositor está mal calibrado).
- `ufu_celebracao`: por tela — vistas, puladas, pct_pulo (tela com >60% de
  pulo em 2 semanas = candidata a remoção).
- `ufu_push_eficacia`: por tipo — enviados, cliques, sessões no mesmo dia.

## 3. Verificação

1. Completar 1 nó gera inicio + fim + 2-4 celebracao_vista em ufu_events.
2. Sair no meio pelo X gera trilha_sessao_abandono com idx correto.
3. `select * from ufu_retencao_d1` roda sem erro e mostra o dia de teste.
4. Clique no push aparece em ufu_push_eficacia.
5. Nenhum evento dispara mais de 1x por ação (sem duplicata por re-render).

## Fora deste prompt
- Ritual de sexta (Cowork): ler as 5 views e decidir — é o §9 do espec.
- Session replay / heatmap: só se o qualitativo com alunos reais não bastar.
