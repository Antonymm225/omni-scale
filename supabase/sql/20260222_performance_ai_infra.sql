-- AI + monitoring infrastructure for performance state/snapshots.

create table if not exists public.facebook_ai_runs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_ai_run_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.facebook_ai_runs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_ai_runs'
      and policyname = 'facebook_ai_runs_owner_select'
  ) then
    create policy facebook_ai_runs_owner_select
      on public.facebook_ai_runs
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_ai_runs'
      and policyname = 'facebook_ai_runs_owner_insert'
  ) then
    create policy facebook_ai_runs_owner_insert
      on public.facebook_ai_runs
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_ai_runs'
      and policyname = 'facebook_ai_runs_owner_update'
  ) then
    create policy facebook_ai_runs_owner_update
      on public.facebook_ai_runs
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

alter table public.facebook_performance_snapshots
  add column if not exists cpc_usd numeric(14,4),
  add column if not exists ai_recommendation text,
  add column if not exists ai_reason_short text,
  add column if not exists ai_action text,
  add column if not exists ai_analyzed_at timestamptz,
  add column if not exists ai_model text;

alter table public.facebook_performance_state
  add column if not exists cpc_usd numeric(14,4),
  add column if not exists ai_recommendation text,
  add column if not exists ai_reason_short text,
  add column if not exists ai_action text,
  add column if not exists ai_analyzed_at timestamptz,
  add column if not exists ai_model text;

alter table public.facebook_performance_snapshots
  drop constraint if exists facebook_performance_snapshots_entity_type_check;
alter table public.facebook_performance_snapshots
  add constraint facebook_performance_snapshots_entity_type_check
  check (entity_type = any (array['account'::text, 'campaign'::text, 'adset'::text, 'ad'::text]));

alter table public.facebook_performance_state
  drop constraint if exists facebook_performance_state_entity_type_check;
alter table public.facebook_performance_state
  add constraint facebook_performance_state_entity_type_check
  check (entity_type = any (array['account'::text, 'campaign'::text, 'adset'::text, 'ad'::text]));

alter table public.facebook_performance_snapshots
  drop constraint if exists facebook_performance_snapshots_ai_recommendation_check;
alter table public.facebook_performance_snapshots
  add constraint facebook_performance_snapshots_ai_recommendation_check
  check (
    ai_recommendation is null
    or ai_recommendation = any (array['improving'::text, 'stable'::text, 'scale'::text, 'worsening'::text])
  );

alter table public.facebook_performance_state
  drop constraint if exists facebook_performance_state_ai_recommendation_check;
alter table public.facebook_performance_state
  add constraint facebook_performance_state_ai_recommendation_check
  check (
    ai_recommendation is null
    or ai_recommendation = any (array['improving'::text, 'stable'::text, 'scale'::text, 'worsening'::text])
  );

alter table public.facebook_performance_snapshots
  drop constraint if exists facebook_performance_snapshots_ai_action_check;
alter table public.facebook_performance_snapshots
  add constraint facebook_performance_snapshots_ai_action_check
  check (
    ai_action is null
    or ai_action = any (
      array['none'::text, 'scale_up'::text, 'pause_ad'::text, 'pause_adset'::text, 'pause_campaign'::text, 'pause_account'::text]
    )
  );

alter table public.facebook_performance_state
  drop constraint if exists facebook_performance_state_ai_action_check;
alter table public.facebook_performance_state
  add constraint facebook_performance_state_ai_action_check
  check (
    ai_action is null
    or ai_action = any (
      array['none'::text, 'scale_up'::text, 'pause_ad'::text, 'pause_adset'::text, 'pause_campaign'::text, 'pause_account'::text]
    )
  );

create index if not exists idx_facebook_performance_state_ai
  on public.facebook_performance_state(user_id, entity_type, ai_recommendation);

create index if not exists idx_facebook_performance_snapshots_ai
  on public.facebook_performance_snapshots(user_id, source_date, entity_type, ai_recommendation);

