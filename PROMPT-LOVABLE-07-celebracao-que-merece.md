# Prompt para Lovable — a celebração que se merece (consertos pós-teste real)

Colar depois do 06. Origem: primeiro teste real do nó de redação (11/07).
A cascata funciona, mas comete dois anti-padrões e tem 1 bug visível.

## 1. BUG: tela de streak mostra 7 dias carimbados com streak = 2

Na StreakScreen da cascata, o calendário marcou TODOS os dias da semana
apesar do streak ser 2. Investigar: se o componente pinta os dias
decorativamente (sem dados), é dado falso numa tela de verdade — corrigir
pra usar os MESMOS dias ativos do calendário do /hoje (helper unificado
`activeDays` do prompt 06 §2). Dias sem atividade ficam vazios; dia coberto
por freeze mostra gelo. O número e os carimbos nunca podem discordar.

## 2. Resultado: mostrar o ganho, não a nota (anti-padrão Duolingo)

A tela de resultado estampa "58% · 1ª tentativa" — número ruim no meio da
festa. Ninguém celebra um 58%. Trocar os 3 cards por contagens POSITIVAS:
- "{primeira} acertos de primeira" (número grande)
- "{total} degraus subidos"
- "{tempo}"
O % de primeira continua indo pros eventos (`trilha_sessao_fim`,
pct_primeira) — é métrica de calibração do compositor, não conteúdo de
celebração. Regra geral pra qualquer tela festiva: só números que crescem.

## 3. A coroação do nó (o clímax que hoje acontece fora da tela)

Hoje o nó doura no banco e o aluno só vê o resultado pronto no /hoje.
Adicionar tela de coroação na cascata (entre wrap e result) QUANDO
`dourado === true`:
- O círculo do nó (mesmo visual da trilha) entra cinza/atual e vira dourado
  na frente do aluno: transição de cor + escala + burst único de confetti
  dourado + vibração. Título do nó embaixo, "PRIMEIRA QUESTÃO REAL VENCIDA"
  ou equivalente quando o nível 5 era questão DIRPS.
- ≤2s, pulável com toque, evento `celebracao_vista {tela:'coroacao'}`.
- No retorno ao /hoje após coroação, o nó recém-dourado faz um pulso único
  (scale 1→1.15→1) pra costurar a memória.

## 4. Medalha do wrap: viva, não estática

Emoji parado não é celebração. Na tela "Nó completo": medalha entra com
spring (scale 0→1.1→1) + 1 burst curto de confetti. Nada de loop infinito.

## 5. Conferir pendência do prompt 06 §4 (horizonte)

O print do /hoje pós-sessão mostra 1 nó sozinho, sem os "Em breve:
{disciplina}". Se não foi implementado, implementar agora; se foi, verificar
por que não renderiza com 1 nó só no banco.

## 6. Vocabulário: "nó" morre na interface (vira "fase")

"Nó" é jargão interno e tem conotação negativa em português (nó na cabeça,
nó cego). O usuário nunca deve ler "nó".
- Criar `src/lib/vocab.ts` com as strings da trilha num lugar só e trocar
  TODA copy visível: "Nó completo" → "Fase completa" · "nó dourado" →
  "fase dourada" · toasts ("Termine o nó anterior" → "Termine a fase
  anterior") · títulos e labels no /hoje e no player.
- NÃO renomear tabelas, colunas, rotas nem tipos (`trilha_nos`,
  `no_id`, `/ufu/no/:id` ficam como estão) — só texto de interface.

## Verificação
1. Completar nó com dias reais sex+sáb → StreakScreen mostra exatamente 2
   carimbos e 🔥2.
0. `grep -ri "nó" src/pages src/components` não retorna nenhuma string
   visível ao usuário (comentários de código podem ficar).
2. Resultado não contém nenhum percentual; os 3 números só crescem.
3. Dourar um nó → tela de coroação com transição cinza→dourado; pular com
   toque funciona; evento registrado.
4. /hoje mostra ≥2 nós futuros apagados mesmo com 1 nó ativo no banco.

## Fora deste prompt (lado Cowork/Breno — conteúdo, não código)
- Densidade do nó: 16 itens em ~1 min = degraus fáceis demais. Regra de
  curadoria pros próximos nós: níveis 3-5 devem exigir raciocínio (alvo:
  ≥20s/item no nível 3+, medível via tempo_s/itens no trilha_sessao_fim).
  O nó de redação atual ganha itens de nível 4 ("a jogada da prova") na
  próxima revisão de conteúdo.
