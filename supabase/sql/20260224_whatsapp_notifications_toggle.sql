alter table public.user_integrations
  add column if not exists whatsapp_notifications_enabled boolean not null default true;
