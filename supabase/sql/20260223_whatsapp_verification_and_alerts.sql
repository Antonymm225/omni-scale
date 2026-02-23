alter table public.user_integrations
  add column if not exists whatsapp_verified boolean not null default false,
  add column if not exists whatsapp_verified_at timestamptz,
  add column if not exists whatsapp_verification_code text,
  add column if not exists whatsapp_verification_expires_at timestamptz,
  add column if not exists whatsapp_verification_attempts integer not null default 0,
  add column if not exists whatsapp_last_error text;

create table if not exists public.user_whatsapp_alert_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_date date not null,
  entity_type text not null check (entity_type in ('campaign', 'adset', 'ad')),
  entity_id text not null,
  severity text not null check (severity in ('good', 'bad')),
  recommendation text,
  message text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_whatsapp_alert_events_user_source_date
  on public.user_whatsapp_alert_events (user_id, source_date);

alter table public.user_whatsapp_alert_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_whatsapp_alert_events'
      and policyname = 'user_whatsapp_alert_events_owner_select'
  ) then
    create policy user_whatsapp_alert_events_owner_select
      on public.user_whatsapp_alert_events
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.set_user_whatsapp_alert_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_whatsapp_alert_events_updated_at on public.user_whatsapp_alert_events;
create trigger trg_user_whatsapp_alert_events_updated_at
before update on public.user_whatsapp_alert_events
for each row execute function public.set_user_whatsapp_alert_events_updated_at();
