create table if not exists public.user_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  everflow_api_key text,
  everflow_region text check (everflow_region in ('US', 'EU')),
  everflow_access_type text check (everflow_access_type in ('Network', 'Affiliate', 'Advertiser')),
  openai_api_key text,
  whatsapp_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_user_integrations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_integrations_updated_at on public.user_integrations;
create trigger trg_user_integrations_updated_at
before update on public.user_integrations
for each row execute function public.set_user_integrations_updated_at();

alter table public.user_integrations enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_integrations'
      and policyname = 'user_integrations_owner_select'
  ) then
    create policy user_integrations_owner_select
      on public.user_integrations
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_integrations'
      and policyname = 'user_integrations_owner_insert'
  ) then
    create policy user_integrations_owner_insert
      on public.user_integrations
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_integrations'
      and policyname = 'user_integrations_owner_update'
  ) then
    create policy user_integrations_owner_update
      on public.user_integrations
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

