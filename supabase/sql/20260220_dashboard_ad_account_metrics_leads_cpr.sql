-- Extend per ad account metrics with leads + cost per result

alter table public.facebook_dashboard_ad_account_metrics
  add column if not exists leads_count integer not null default 0,
  add column if not exists cost_per_result_usd numeric(14,2);
