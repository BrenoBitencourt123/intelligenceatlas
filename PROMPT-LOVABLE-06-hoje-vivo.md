# Prompt para Lovable — /hoje vivo (consertos + emoção da tela principal)

Colar depois do prompt 05. Contexto: a estrutura do /hoje está certa (1
decisão, missão única, calendário), mas a tela pune em cinza. Print de
referência: Duolingo usa cor como informação e mostra o horizonte da trilha.

## 1. BUG: backfill do placar (bolinha em zero pra contas antigas)

Contas que fizeram o diagnóstico antes do placar vivo têm `placar_estimado
null` → tela mostra "0/46". O diagnóstico não guardou as respostas de nível,
então inferir do que temos:
- Migration/backfill: usuários com `diagnostico_feito_at` preenchido e
  `placar_estimado null` → contar nós dourados em `trilha_progresso`:
  0 dourados → 8 · 1-2 → 18 · 3+ → 30. Fonte 'autoavaliacao'.
- Daqui em diante: `TrilhaDiagnostico` passa a GRAVAR as respostas de nível
  (nova coluna `profiles.diagnostico_niveis jsonb` — ex.:
  `{"matematica":"basico",...}`) pra nunca mais precisar inferir.

## 2. BUG: streak e calendário discordam na mesma tela

O calendário da semana (Today) conta `question_attempts` mas o streak não;
o streak conta `study_sessions` mas o calendário não. Unificar a definição
de "dia ativo" num helper único (`src/lib/activeDays.ts`) usado pelos dois:
`study_sessions (is_extra=false) ∪ essays ∪ trilha_respostas ∪
question_attempts (extra_session=false)`. Streak e calendário passam a ler
do mesmo lugar. (Manter a lógica de freeze do useStudyStats por cima.)

## 3. A zona ganha cor (a cor É a informação)

No placar compacto e no GoalCard, as 3 zonas com identidade fixa:
- fora do corte → texto e pill âmbar-escuro/vermelho suave (não cinza)
- zona de risco → âmbar
- zona segura → verde
Copy de distância, nunca só sentença: "0/46 · faltam {corte} pra zona de
risco" / "faltam {meta-acertos} pra zona segura" / "folga de {acertos-meta}".
Dark mode incluso. O fogo do streak: laranja com número quando ≥1, cinza só
quando 0; streak ≥3 ganha pulso sutil.

## 4. A trilha ganha horizonte (mapa vivo, não botão solitário)

- O nó ATUAL: círculo maior, cor primária cheia, anel pulsante (o código já
  tenta — conferir por que renderiza cinza; provável token de tema) +
  micro-label "COMEÇAR AQUI" na primeira visita.
- SEMPRE mostrar os próximos 2-3 nós da disciplina apagados (cadeado), com
  título visível — é a promessa de amanhã. Se só existe 1 nó no banco,
  mostrar 2 placeholders "Em breve: {disciplina}" (sem link), até o conteúdo
  real existir.
- Nós dourados: dourado de verdade (âmbar), com brilho leve. Conexão entre
  nós: linha que fica sólida quando o de cima está dourado.

## 5. Missão de redação sem esconder a trilha

Em dia de redação, o card-missão continua sendo redação, mas adicionar
linha secundária discreta abaixo do botão: "ou continuar a trilha →" (link
pro nó atual). Nunca beco sem saída.

## Verificação
1. Conta antiga (diagnóstico feito, placar null) → após backfill mostra
   8/18/30 conforme dourados, com "estimado".
2. Dia com atividade só em question_attempts → carimbo no calendário E
   streak contam igual.
3. As 3 zonas renderizam nas 3 cores (testar mudando placar_estimado).
4. Trilha mostra nó atual pulsando colorido + ≥2 nós futuros apagados.
5. Sábado: card de redação com link secundário pra trilha.
