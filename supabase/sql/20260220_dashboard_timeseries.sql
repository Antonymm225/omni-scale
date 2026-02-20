-- Intraday time series snapshots for dashboard chart (every 10 min sync)

create table if not exists public.facebook_dashboard_timeseries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_time timestamptz not null,
  source_date date not null default current_date,
  spend_usd numeric(14,2) not null default 0,
  leads_count integer not null default 0,
  cost_per_result_usd numeric(14,2),
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_time)
);

alter table public.facebook_dashboard_timeseries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_dashboard_timeseries'
      and policyname = 'facebook_dashboard_timeseries_owner_select'
  ) then
    create policy facebook_dashboard_timeseries_owner_select
      on public.facebook_dashboard_timeseries for select
      using (auth.uid() = user_id);
  end if;
end $$;
