# Prompt para Lovable — Placar vivo + cascata de celebração (P0 do loop Duolingo)

Colar PRIMEIRO desta série de 4. Os outros três dependem deste.

Contexto de negócio: hoje o app pune no primeiro segundo ("0/52 · fora do
corte" — o `acertos = 0 // TODO` no Today.tsx) e não recompensa no último
(fim de sessão = 1 tela seca). No Duolingo, ~40% da sessão é celebração.
Este prompt conserta as duas pontas: a bolinha nunca nasce em zero, e toda
sessão termina em colheita.

## 1. Placar vivo (mata o TODO do Today.tsx)

- Nova coluna em `profiles`: `placar_estimado int null` + `placar_fonte text
  null` ('quiz' | 'autoavaliacao' | 'trilha' | 'simulado').
- Regra de alimentação, por prioridade (a fonte mais forte vence):
  1. **Simulado** (quando existir): acertos reais /65.
  2. **Trilha**: recalcular após cada resposta a questão DIRPS real (itens
     `multipla` de nível 5 e questões do banco `exam='ufu'`): taxa de acerto
     × 65, arredondado. Só ativa com ≥8 questões reais respondidas.
  3. **Quiz /placar** (10 questões): `round(acertos/10*65)`.
  4. **Autoavaliação do diagnóstico** (fallback pra nunca nascer em zero):
     nada=8, básico=18, bastante=30 (valores conservadores de propósito —
     o placar só pode subir a partir daí, nunca decepcionar pra baixo).
- `TrilhaDiagnostico.tsx`: ao finalizar, gravar o fallback (fonte
  'autoavaliacao') se `placar_estimado` ainda é null.
- `Today.tsx`: trocar `const acertos = 0` por `profile.placar_estimado ?? 0`;
  se fonte = 'autoavaliacao', mostrar sufixo "estimado" discreto no placar
  compacto.

## 2. Cascata de celebração no fim do nó (TrilhaNo.tsx)

Substituir o par wrap→result por uma SEQUÊNCIA de telas (avança com toque em
qualquer lugar; toda animação ≤1,5s e pulável):

1. **Resultado** (existente, manter): 3 números + frase da subida.
2. **Selo PERFEITO** (condicional): se `stats.primeira === stats.total`,
   tela própria — "PERFEITO — {n} de {n} na primeira" com animação (confete
   via canvas-confetti + vibração `navigator.vibrate(50)` se suportado).
   O dado `acertou_primeira` já é gravado; é só usar.
3. **Streak**: "🔥 {streak} dias" grande + o calendário da semana (mesmo
   visual do Today) com o carimbo de HOJE animando ao entrar (scale + check).
   Reusar useStudyStats.
4. **Bolinha andou** (condicional): se `placar_estimado` mudou nesta sessão,
   mostrar "{antes} → {depois} de {meta}" com a bolinha deslizando na barra
   de zonas (mesmas 3 zonas do GoalCard) + frase "faltam {meta-depois} pra
   zona segura". Esta é a tela do share: botão "Compartilhar" reusando o
   gerador de card do placar (PlacarShareCard).
5. Volta pro /hoje.

## 3. Combo dentro da sessão (TrilhaNo.tsx)

- Contador de acertos de primeira consecutivos (zera ao errar).
- Em 5, 10, 15…: micro-celebração inline não-bloqueante (badge "combo x5"
  pulsando no header por 2s + vibração curta). Sem tela cheia, sem pausar.

## 4. Verificação

1. Usuário novo faz diagnóstico marcando "sei o básico" em tudo → /hoje
   mostra placar ~18/meta (nunca 0) com "estimado".
2. Fechar um nó com 100% de primeira → aparecem 4 telas na ordem; com 1 erro
   → 3 telas (sem PERFEITO).
3. Responder 8+ questões DIRPS reais muda a fonte pra 'trilha' e o placar
   recalcula.
4. Toque pula qualquer animação; nada trava atrás de timer.
5. Mobile: confete não derruba FPS (máx ~150 partículas, 1 disparo).

## Fora deste prompt
- Push/streak freeze (prompt 02). Eventos de medição (prompt 03) — mas JÁ
  deixar os pontos de disparo comentados (`// evento: celebracao_vista`).
- Curadoria dos valores 8/18/30 (Cowork calibra com dados reais depois).
