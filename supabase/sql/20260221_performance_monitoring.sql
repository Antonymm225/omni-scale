-- Performance monitoring infrastructure (campaign/adset/ad)

create table if not exists public.facebook_performance_monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monitor_name text not null default 'Default Monitor',
  enabled boolean not null default true,
  target_scope text not null default 'all',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, monitor_name)
);

alter table public.facebook_performance_monitors enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_performance_monitors'
      and policyname = 'facebook_performance_monitors_owner_select'
  ) then
    create policy facebook_performance_monitors_owner_select
      on public.facebook_performance_monitors for select
      using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.facebook_performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_ad_account_id text not null,
  account_id text,
  account_name text,
  entity_type text not null check (entity_type in ('campaign','adset','ad')),
  entity_id text not null,
  entity_name text,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text,
  ad_name text,
  configured_status text,
  effective_status text,
  spend_original numeric(14,2) not null default 0,
  currency text,
  spend_usd numeric(14,2) not null default 0,
  results_count integer not null default 0,
  cost_per_result_usd numeric(14,2),
  impressions integer not null default 0,
  clicks integer not null default 0,
  ctr numeric(10,4),
  cpm numeric(14,4),
  frequency numeric(10,4),
  trend text not null check (trend in ('improving','stable','worsening')),
  health text not null check (health in ('good','watch','bad')),
  source_date date not null default current_date,
  snapshot_time timestamptz not null,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id, snapshot_time)
);

create index if not exists idx_facebook_performance_snapshots_user_date
  on public.facebook_performance_snapshots (user_id, source_date, entity_type);

alter table public.facebook_performance_snapshots enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_performance_snapshots'
      and policyname = 'facebook_performance_snapshots_owner_select'
  ) then
    create policy facebook_performance_snapshots_owner_select
      on public.facebook_performance_snapshots for select
      using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.facebook_performance_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_ad_account_id text not null,
  account_id text,
  account_name text,
  entity_type text not null check (entity_type in ('campaign','adset','ad')),
  entity_id text not null,
  entity_name text,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text,
  ad_name text,
  configured_status text,
  effective_status text,
  spend_original numeric(14,2) not null default 0,
  currency text,
  spend_usd numeric(14,2) not null default 0,
  results_count integer not null default 0,
  cost_per_result_usd numeric(14,2),
  impressions integer not null default 0,
  clicks integer not null default 0,
  ctr numeric(10,4),
  cpm numeric(14,4),
  frequency numeric(10,4),
  trend text not null check (trend in ('improving','stable','worsening')),
  health text not null check (health in ('good','watch','bad')),
  source_date date not null default current_date,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create index if not exists idx_facebook_performance_state_user_type
  on public.facebook_performance_state (user_id, entity_type, health, trend);

alter table public.facebook_performance_state enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_performance_state'
      and policyname = 'facebook_performance_state_owner_select'
  ) then
    create policy facebook_performance_state_owner_select
      on public.facebook_performance_state for select
      using (auth.uid() = user_id);
  end if;
end $$;

