create table if not exists question_pre_lesson (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade not null,
  items jsonb not null,
  generated_at timestamptz default now(),
  unique(question_id)
);

alter table question_pre_lesson enable row level security;

create policy "Autenticados podem ler pre-lesson" on question_pre_lesson
  for select using (auth.role() = 'authenticated');
