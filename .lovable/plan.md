Plano para fechar o funil do diagrama, respeitando o que já existe hoje e adiando o que você marcou como "depois".

## O que já está pronto (não mexo)
- Google pSEO: 51 páginas + último aprovado.
- Calculadora UFU (`/ufu/calculadora`).
- Captura de lead (`/ufu/lista`) — insert anônimo em `ufu_leads` corrigido.
- Corretor de redação (`/redacao-ufu`) com 1ª correção grátis.
- Compra 1 · correção: R$ 9,90 avulsa e R$ 39 pacote (Stripe Checkout + `verify-checkout-ufu`).
- Grupo WhatsApp e link do guia por e-mail já existem manualmente.

## O que este plano constrói (âmbar do diagrama)

### 1. Diagnóstico "seu placar" — `/ufu/diagnostico`
- 10 questões UFU curadas, embaralhadas por área com peso do curso escolhido (medicina, direito, etc.).
- Nova tabela `ufu_diagnostico_questoes` (statement, alternativas jsonb, correta, area, ano, prova) alimentada pelo admin (nada de script local).
- Sessão anônima: guarda respostas em `localStorage`; ao finalizar mostra "sua zona" (verde/amarelo/vermelho por área + nota estimada UFU) e força captura de e-mail+WhatsApp antes de liberar o gabarito comentado.
- Grava lead em `ufu_leads` com `origem='diagnostico'` + snapshot do resultado.
- CTA final: "Comece pelo corretor de redação — 1ª grátis" → `/signup?next=/redacao-ufu`.

### 2. Passe UFU — `/ufu/passe`
- Produto Stripe novo: **Passe UFU 2026 — Fundador**, R$ 149, one-time (não recorrente), preço lançamento; segundo preço R$ 249 arquivado como "após pré-venda".
- Entrega: acesso único até a data da prova UFU a:
  - Corretor de redação **ilimitado** (bypassa `ufu_correcoes_saldo`).
  - Trilha da folga + simulados (rota `/ufu/trilha`, ver item 4).
- Landing `/ufu/passe`: hero, o-que-inclui, prova social (contador de leads), FAQ, CTA único.
- Coluna nova em `profiles`: `ufu_passe_ativo boolean` + `ufu_passe_expira_em date` (setado por `verify-checkout-ufu` quando `metadata.plano='passe'`).
- `analyze-essay-ufu` passa a checar passe antes de consumir crédito.

### 3. Página `/passe` como oferta pós-pré-venda
- Mesma landing do item 2, mas com flag em `ufu_config` (`passe_disponivel boolean`). Enquanto false: mostra "abre em breve" + captura. Depois da pré-venda: libera o botão de checkout.

### 4. Pós-compra — Trilha da folga + Simulados (`/ufu/trilha`)
- Só acessível com `ufu_passe_ativo`.
- Reaproveita motor de sessões objetivas já existente, filtrado por `ufu_topico`.
- 3 simulados UFU (2h cada) montados a partir do banco `ufu_diagnostico_questoes` + questões UFU já classificadas em `questions`.

### 5. Card "meu placar subiu"
- Componente `PlacarShareCard` renderizado em canvas (1080x1350) com nome, área que mais subiu e delta de acertos.
- Botão "Baixar imagem" + "Compartilhar" (Web Share API com fallback download).
- Aparece no fim do Diagnóstico (após 2ª rodada) e no dashboard do passe.
- **Sem cupom nesta fase** — só o card visual, como você pediu.

## O que fica de fora (marcado no diagrama, adiado)
- Sequência automática de 7 e-mails — adiado.
- Cupom de amigo com tracking — adiado, entra depois do card visual provar tração.
- Reels/TikTok: fora do escopo de código, é conteúdo.

## Migrations (uma só, aprovada antes do código)
1. `ufu_diagnostico_questoes` (+ GRANTs + RLS: select público, insert/update só admin).
2. `ufu_config` (chave/valor, uma linha `passe_disponivel`).
3. `profiles.ufu_passe_ativo` + `ufu_passe_expira_em`.
4. Índice em `ufu_leads(origem)` para separar diagnóstico de lista.

## Stripe (via ferramenta, não SQL)
- Criar produto "Passe UFU 2026 — Fundador" R$ 149,00 BRL, one-time.
- `create-checkout-ufu` passa a aceitar `plano: 'passe' | 'avulsa' | 'pacote'` e roteia para o price_id certo.
- `verify-checkout-ufu` grava passe em `profiles` quando `plano='passe'`, senão continua creditando `ufu_creditos`.

## Ordem de entrega
1. Migration (tabelas + colunas).
2. Produto Stripe do passe + edge functions atualizadas.
3. `/ufu/passe` (landing + checkout).
4. `/ufu/diagnostico` (quiz + captura + resultado).
5. `PlacarShareCard`.
6. `/ufu/trilha` (gating por passe + reaproveitamento do motor de sessões).
7. Ajuste `analyze-essay-ufu` para respeitar passe.

## Detalhes técnicos
- Tudo em rotas `/ufu/*` já registradas em `App.tsx`.
- Nenhuma edição em `src/integrations/supabase/client.ts` ou `.env`.
- Sem cron, sem webhook Stripe (mantém o padrão `verify-*` on-return).
- Curadoria das 10 questões UFU: você popula pelo admin depois que a tabela subir; o Diagnóstico só ativa quando tiver ≥10 registros (feature flag em `ufu_config`).
