-- Sales-only metrics cache (summary per user)

create table if not exists public.facebook_sales_metrics (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_accounts_count integer not null default 0,
  active_ads_count integer not null default 0,
  total_spend_usd numeric(14,2) not null default 0,
  total_results integer not null default 0,
  cost_per_result_usd numeric(14,2),
  source_date date not null default current_date,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.facebook_sales_metrics enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_sales_metrics'
      and policyname = 'facebook_sales_metrics_owner_select'
  ) then
    create policy facebook_sales_metrics_owner_select
      on public.facebook_sales_metrics for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- Sales-only metrics cache by ad account
create table if not exists public.facebook_sales_ad_account_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_ad_account_id text not null,
  account_id text,
  account_name text,
  active_campaigns_count integer not null default 0,
  active_ads_count integer not null default 0,
  is_active_account boolean not null default false,
  account_status integer,
  spend_original numeric(14,2) not null default 0,
  currency text,
  spend_usd numeric(14,2) not null default 0,
  results_count integer not null default 0,
  cost_per_result_usd numeric(14,2),
  source_date date not null default current_date,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, facebook_ad_account_id)
);

alter table public.facebook_sales_ad_account_metrics enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_sales_ad_account_metrics'
      and policyname = 'facebook_sales_ad_account_metrics_owner_select'
  ) then
    create policy facebook_sales_ad_account_metrics_owner_select
      on public.facebook_sales_ad_account_metrics for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- Sales intraday timeseries (every 10min snapshot)
create table if not exists public.facebook_sales_timeseries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_time timestamptz not null,
  source_date date not null default current_date,
  spend_usd numeric(14,2) not null default 0,
  results_count integer not null default 0,
  cost_per_result_usd numeric(14,2),
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_time)
);

alter table public.facebook_sales_timeseries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_sales_timeseries'
      and policyname = 'facebook_sales_timeseries_owner_select'
  ) then
    create policy facebook_sales_timeseries_owner_select
      on public.facebook_sales_timeseries for select
      using (auth.uid() = user_id);
  end if;
end $$;

