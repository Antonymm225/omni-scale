-- Add active campaigns count per ad account cache row

alter table public.facebook_dashboard_ad_account_metrics
  add column if not exists active_campaigns_count integer not null default 0;

alter table public.facebook_messages_ad_account_metrics
  add column if not exists active_campaigns_count integer not null default 0;

