-- Enable daily history for ad-account metrics tables (today/yesterday/range filters)

alter table public.facebook_dashboard_ad_account_metrics
  drop constraint if exists facebook_dashboard_ad_account_metrics_user_id_facebook_ad_account_id_key;

alter table public.facebook_dashboard_ad_account_metrics
  add constraint facebook_dashboard_ad_account_metrics_user_account_source_date_key
  unique (user_id, facebook_ad_account_id, source_date);

create index if not exists idx_facebook_dashboard_ad_account_metrics_user_source_date
  on public.facebook_dashboard_ad_account_metrics (user_id, source_date);

alter table public.facebook_messages_ad_account_metrics
  drop constraint if exists facebook_messages_ad_account_metrics_user_id_facebook_ad_account_id_key;

alter table public.facebook_messages_ad_account_metrics
  add constraint facebook_messages_ad_account_metrics_user_account_source_date_key
  unique (user_id, facebook_ad_account_id, source_date);

create index if not exists idx_facebook_messages_ad_account_metrics_user_source_date
  on public.facebook_messages_ad_account_metrics (user_id, source_date);

alter table public.facebook_leads_ad_account_metrics
  drop constraint if exists facebook_leads_ad_account_metrics_user_id_facebook_ad_account_id_key;

alter table public.facebook_leads_ad_account_metrics
  add constraint facebook_leads_ad_account_metrics_user_account_source_date_key
  unique (user_id, facebook_ad_account_id, source_date);

create index if not exists idx_facebook_leads_ad_account_metrics_user_source_date
  on public.facebook_leads_ad_account_metrics (user_id, source_date);

alter table public.facebook_branding_ad_account_metrics
  drop constraint if exists facebook_branding_ad_account_metrics_user_id_facebook_ad_account_id_key;

alter table public.facebook_branding_ad_account_metrics
  add constraint facebook_branding_ad_account_metrics_user_account_source_date_key
  unique (user_id, facebook_ad_account_id, source_date);

create index if not exists idx_facebook_branding_ad_account_metrics_user_source_date
  on public.facebook_branding_ad_account_metrics (user_id, source_date);

alter table public.facebook_sales_ad_account_metrics
  drop constraint if exists facebook_sales_ad_account_metrics_user_id_facebook_ad_account_id_key;

alter table public.facebook_sales_ad_account_metrics
  add constraint facebook_sales_ad_account_metrics_user_account_source_date_key
  unique (user_id, facebook_ad_account_id, source_date);

create index if not exists idx_facebook_sales_ad_account_metrics_user_source_date
  on public.facebook_sales_ad_account_metrics (user_id, source_date);
