-- Per ad account cached metrics for dashboard

create table if not exists public.facebook_dashboard_ad_account_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_ad_account_id text not null,
  account_id text,
  account_name text,
  active_ads_count integer not null default 0,
  is_active_account boolean not null default false,
  spend_original numeric(14,2) not null default 0,
  currency text,
  spend_usd numeric(14,2) not null default 0,
  source_date date not null default current_date,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, facebook_ad_account_id)
);

alter table public.facebook_dashboard_ad_account_metrics enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_dashboard_ad_account_metrics'
      and policyname = 'facebook_dashboard_ad_account_metrics_owner_select'
  ) then
    create policy facebook_dashboard_ad_account_metrics_owner_select
      on public.facebook_dashboard_ad_account_metrics for select
      using (auth.uid() = user_id);
  end if;
end $$;
