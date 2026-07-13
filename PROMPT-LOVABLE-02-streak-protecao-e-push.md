# Prompt para Lovable — Streak: bug fix, proteção e push de perda

Colar DEPOIS do prompt 01 (a tela de streak da cascata usa o cálculo daqui).

Contexto de negócio: o streak é o mecanismo de retenção nº 1 do Duolingo, e o
que retém não é o fogo aceso — é o medo de apagar. Mas streak quebrado sem
perdão = churn (o próprio Duolingo vende freeze). Três entregas: consertar o
cálculo, perdoar 1x/semana, avisar antes de apagar.

## 1. BUG: trilha não conta pro streak (useStudyStats.ts)

O streak hoje soma dias de `study_sessions` + `essays`. **Dias com atividade
só em `trilha_respostas` não contam** — estudar na trilha não mantém o fogo.
Fix: incluir `trilha_respostas` (select created_at, mesmos 60 dias) no set
`activeDays`. Manter o resto do algoritmo.

## 2. Congelamento automático (o sistema que perdoa)

- Nova tabela `streak_freezes`: `user_id, used_on date, created_at` +
  RLS por user.
- Regra no cálculo do streak: ao encontrar um dia sem atividade, se (a) é o
  único buraco na semana ISO dele e (b) não existe freeze usado naquela
  semana → considerar o dia coberto e gravar o freeze (upsert idempotente).
  Máximo 1/semana, automático, sem UI de compra.
- Na tela de streak da cascata (prompt 01), quando um freeze foi usado na
  semana: mostrar o dia coberto com ícone de gelo + linha "Te segurei na
  {dia}. Tamo junto." (1x, sem culpa).

## 3. Push de streak em risco

- Edge function `streak-risk-push` agendada (pg_cron, diário ~19h
  America/Sao_Paulo): seleciona usuários com streak ≥3 E sem atividade hoje
  E com subscription de push ativa (infra do useNotifications/PWA já
  existente) → envia web push:
  - título: "🔥 {streak} dias em risco"
  - corpo: "Seu fogo apaga à meia-noite. 10 minutos salvam."
  - clique abre `/hoje`.
- Uma por dia no máximo; não enviar pra quem tem streak <3 (não há perda que
  doa). Registrar envio em tabela `push_log` (user_id, tipo, sent_at) pra
  medição posterior.
- Fallback e-mail: NÃO fazer neste prompt (fica pro Cowork avaliar volume).

## 4. Verificação

1. Responder só itens da trilha hoje → streak conta o dia (bug corrigido).
2. Simular buraco de 1 dia na semana → streak sobrevive e `streak_freezes`
   tem 1 linha; segundo buraco na mesma semana → streak zera.
3. Usuário com streak 5 e sem atividade: push chega ~19h, clique abre /hoje,
   linha em `push_log`.
4. Usuário com streak 1 não recebe push.

## Fora deste prompt
- A/B do texto do push (perda vs convite) — Cowork alterna por semana e
  compara via push_log × atividade (prompt 03 dá a medição).
- Marcos de streak (7/30 dias) com cerimônia própria — v2, depois de medir.
