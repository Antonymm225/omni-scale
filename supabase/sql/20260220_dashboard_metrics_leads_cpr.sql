-- Extend dashboard summary metrics with leads + cost per result in USD

alter table public.facebook_dashboard_metrics
  add column if not exists total_leads integer not null default 0,
  add column if not exists cost_per_result_usd numeric(14,2);
