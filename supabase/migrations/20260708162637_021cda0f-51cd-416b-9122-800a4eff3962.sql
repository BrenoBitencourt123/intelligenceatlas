create table if not exists public.ufu_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  whatsapp text,
  curso text,
  origem text default 'pseo',
  created_at timestamptz not null default now()
);

create unique index if not exists ufu_leads_email_idx
  on public.ufu_leads (lower(email));

grant insert on public.ufu_leads to anon, authenticated;
grant all on public.ufu_leads to service_role;

alter table public.ufu_leads enable row level security;

create policy "ufu_leads_insert_anon"
  on public.ufu_leads for insert
  to anon, authenticated
  with check (true);

create or replace function public.ufu_leads_count()
  returns integer
  language sql security definer set search_path = public as $$
    select count(*)::int from public.ufu_leads;
  $$;

grant execute on function public.ufu_leads_count() to anon, authenticated;