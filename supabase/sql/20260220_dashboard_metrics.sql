-- Dashboard metrics cache (synced from Meta every 10 min)

create table if not exists public.facebook_dashboard_metrics (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_accounts_count integer not null default 0,
  active_ads_count integer not null default 0,
  total_spend_usd numeric(14,2) not null default 0,
  total_leads integer not null default 0,
  cost_per_result_usd numeric(14,2),
  source_date date not null default current_date,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.facebook_dashboard_metrics enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_dashboard_metrics'
      and policyname = 'facebook_dashboard_metrics_owner_select'
  ) then
    create policy facebook_dashboard_metrics_owner_select
      on public.facebook_dashboard_metrics for select
      using (auth.uid() = user_id);
  end if;
end $$;
