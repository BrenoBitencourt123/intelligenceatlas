-- Instrumentação da calculadora UFU (pública, sem cadastro).
-- Eventos anônimos: calc_completed, card_generated, card_shared, card_downloaded.
-- Métrica-mãe: share_rate = card_shared / calc_completed (meta ≥ 10%).

create table if not exists public.ufu_events (
  id uuid primary key default gen_random_uuid(),
  event text not null check (event in ('calc_completed','card_generated','card_shared','card_downloaded')),
  payload jsonb not null default '{}'::jsonb,
  session_id text,
  created_at timestamptz not null default now()
);

alter table public.ufu_events enable row level security;

-- Qualquer visitante (anon) pode inserir; ninguém lê via API pública.
create policy "ufu_events_insert_anon"
  on public.ufu_events for insert
  to anon, authenticated
  with check (true);

create index if not exists ufu_events_event_created_idx
  on public.ufu_events (event, created_at);

-- View de acompanhamento (só via service role / SQL editor)
create or replace view public.ufu_share_rate as
select
  date_trunc('day', created_at) as dia,
  count(*) filter (where event = 'calc_completed') as calculos,
  count(*) filter (where event = 'card_generated') as cards_gerados,
  count(*) filter (where event = 'card_shared') as shares,
  count(*) filter (where event = 'card_downloaded') as downloads,
  round(
    count(*) filter (where event in ('card_shared','card_downloaded'))::numeric
    / nullif(count(*) filter (where event = 'calc_completed'), 0) * 100, 1
  ) as share_rate_pct
from public.ufu_events
group by 1
order by 1 desc;
