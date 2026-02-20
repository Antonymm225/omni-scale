-- Facebook connection + assets schema for onboarding
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.facebook_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  facebook_user_id text not null,
  access_token text not null,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  facebook_name text,
  facebook_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facebook_business_managers (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.facebook_connections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_business_id text not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, facebook_business_id)
);

create table if not exists public.facebook_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.facebook_connections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_ad_account_id text not null,
  account_id text,
  name text,
  currency text,
  timezone_name text,
  business_id text,
  business_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, facebook_ad_account_id)
);

create table if not exists public.facebook_pages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.facebook_connections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_page_id text not null,
  name text,
  category text,
  page_access_token text,
  tasks text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, facebook_page_id)
);

create table if not exists public.facebook_instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.facebook_connections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_page_id text not null,
  instagram_account_id text not null,
  username text,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, instagram_account_id)
);

create table if not exists public.facebook_pixels (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.facebook_connections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_ad_account_id text not null,
  facebook_pixel_id text not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, facebook_pixel_id)
);

create table if not exists public.facebook_adsets (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.facebook_connections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_ad_account_id text not null,
  facebook_adset_id text not null,
  campaign_id text,
  campaign_name text,
  name text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, facebook_adset_id)
);

alter table public.facebook_connections enable row level security;
alter table public.facebook_business_managers enable row level security;
alter table public.facebook_ad_accounts enable row level security;
alter table public.facebook_pages enable row level security;
alter table public.facebook_instagram_accounts enable row level security;
alter table public.facebook_pixels enable row level security;
alter table public.facebook_adsets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_connections'
      and policyname = 'facebook_connections_owner_select'
  ) then
    create policy facebook_connections_owner_select
      on public.facebook_connections for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_business_managers'
      and policyname = 'facebook_business_managers_owner_select'
  ) then
    create policy facebook_business_managers_owner_select
      on public.facebook_business_managers for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_ad_accounts'
      and policyname = 'facebook_ad_accounts_owner_select'
  ) then
    create policy facebook_ad_accounts_owner_select
      on public.facebook_ad_accounts for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_pages'
      and policyname = 'facebook_pages_owner_select'
  ) then
    create policy facebook_pages_owner_select
      on public.facebook_pages for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_instagram_accounts'
      and policyname = 'facebook_instagram_accounts_owner_select'
  ) then
    create policy facebook_instagram_accounts_owner_select
      on public.facebook_instagram_accounts for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_pixels'
      and policyname = 'facebook_pixels_owner_select'
  ) then
    create policy facebook_pixels_owner_select
      on public.facebook_pixels for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_adsets'
      and policyname = 'facebook_adsets_owner_select'
  ) then
    create policy facebook_adsets_owner_select
      on public.facebook_adsets for select
      using (auth.uid() = user_id);
  end if;
end $$;

