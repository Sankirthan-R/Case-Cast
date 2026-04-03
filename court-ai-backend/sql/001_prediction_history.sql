create table if not exists public.prediction_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_payload jsonb not null,
  output_payload jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  source text not null default 'model',
  outcome text not null,
  confidence double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_prediction_history_user_id on public.prediction_history(user_id);
create index if not exists idx_prediction_history_created_at on public.prediction_history(created_at desc);
create index if not exists idx_prediction_history_model_used on public.prediction_history((metadata->>'model_used'));

alter table public.prediction_history enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'prediction_history'
      and policyname = 'users_can_select_own_history'
  ) then
    create policy users_can_select_own_history
      on public.prediction_history
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'prediction_history'
      and policyname = 'users_can_insert_own_history'
  ) then
    create policy users_can_insert_own_history
      on public.prediction_history
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end$$;
