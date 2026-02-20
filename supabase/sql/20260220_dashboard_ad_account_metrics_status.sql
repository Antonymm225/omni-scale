-- Add account_status to cached ad account metrics used by dashboard status dot.

alter table public.facebook_dashboard_ad_account_metrics
  add column if not exists account_status integer;
