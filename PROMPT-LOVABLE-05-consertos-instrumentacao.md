# Prompt para Lovable — Consertos da instrumentação (auditoria 11/07)

Colar já. São 2 bugs pequenos que anulam parte da medição dos prompts 01-03.

## 1. Eventos de celebração nunca disparam (TrilhaNo.tsx)

`celebracao_vista` e `celebracao_pulada` existem só como COMENTÁRIO nas
linhas ~378/388/399 — a view `ufu_celebracao` vai ficar eternamente vazia e
o teste "celebração paga esforço" fica sem dado.

Fix — dentro de PerfectScreen, StreakScreen e PlacarScreen (ou num hook
compartilhado `useCelebracaoTracking(tela)`):
- registrar `mountedAt = Date.now()` ao montar;
- no avanço (toque/botão): se `Date.now() - mountedAt < 500` →
  `trackUfu('celebracao_pulada', { tela })`; senão →
  `trackUfu('celebracao_vista', { tela, duracao_ms })`.
- Disparar 1x por montagem (ref de guarda). Telas: 'perfeito' | 'streak' |
  'placar'. A tela 'result' também deve medir (tela: 'resultado').

## 2. Push nunca roda: falta o agendamento

`streak-risk-push` existe e o comentário diz "agendada via pg_cron", mas
NENHUMA migration cria o schedule → a função nunca é chamada.

Fix — migration nova:
```sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
select cron.schedule(
  'streak-risk-push-diario',
  '0 22 * * *', -- 22h UTC = 19h America/Sao_Paulo
  $$
  select net.http_post(
    url := '<SUPABASE_URL>/functions/v1/streak-risk-push',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer <SERVICE_ROLE_KEY via vault/secret>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```
Usar o padrão de secrets do projeto (não hardcodar a service key na
migration — vault ou config). Se o projeto já agendou manualmente no
dashboard, apenas confirmar e documentar no README da function.

## 3. Registrar limitação conhecida (só comentário, não código)

As views de retenção usam `session_id` do localStorage como identidade.
Funciona como proxy de device, mas: (a) trocar de aparelho quebra a série,
(b) limpar storage zera. Adicionar comentário na view + TODO: quando o
usuário está logado, gravar também `user_id` em ufu_events (coluna nullable,
backfill não necessário) e migrar as views pra `coalesce(user_id::text,
session_id)`. Pode fazer a coluna + coalesce já neste prompt se for rápido.

## Verificação
1. Completar um nó e tocar rápido na tela de streak → `celebracao_pulada`
   em ufu_events; deixar 3s e avançar → `celebracao_vista` com duracao_ms.
2. `select * from cron.job` mostra o job diário.
3. Rodar a function manualmente (invoke) → push chega e linha em push_log.
4. Logado, eventos novos têm user_id preenchido.
