create table if not exists public.comment_automation_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_page_id text not null,
  keyword text not null,
  keyword_normalized text not null,
  reply_message text not null,
  send_dm boolean not null default false,
  dm_message text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comment_automation_rules_user_active
  on public.comment_automation_rules(user_id, is_active);

create index if not exists idx_comment_automation_rules_user_page
  on public.comment_automation_rules(user_id, facebook_page_id);

create table if not exists public.comment_automation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_id uuid not null references public.comment_automation_rules(id) on delete cascade,
  facebook_page_id text not null,
  facebook_post_id text,
  facebook_comment_id text not null,
  comment_message text,
  matched_keyword text not null,
  public_reply_sent boolean not null default false,
  public_reply_comment_id text,
  dm_sent boolean not null default false,
  dm_error text,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comment_automation_events_unique unique (user_id, rule_id, facebook_comment_id)
);

create index if not exists idx_comment_automation_events_user_processed
  on public.comment_automation_events(user_id, processed_at desc);

create table if not exists public.comment_automation_cursors (
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_page_id text not null,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, facebook_page_id)
);

alter table public.comment_automation_rules enable row level security;
alter table public.comment_automation_events enable row level security;
alter table public.comment_automation_cursors enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comment_automation_rules' and policyname = 'comment_automation_rules_owner_select'
  ) then
    create policy comment_automation_rules_owner_select
      on public.comment_automation_rules for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comment_automation_rules' and policyname = 'comment_automation_rules_owner_insert'
  ) then
    create policy comment_automation_rules_owner_insert
      on public.comment_automation_rules for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comment_automation_rules' and policyname = 'comment_automation_rules_owner_update'
  ) then
    create policy comment_automation_rules_owner_update
      on public.comment_automation_rules for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comment_automation_rules' and policyname = 'comment_automation_rules_owner_delete'
  ) then
    create policy comment_automation_rules_owner_delete
      on public.comment_automation_rules for delete
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comment_automation_events' and policyname = 'comment_automation_events_owner_select'
  ) then
    create policy comment_automation_events_owner_select
      on public.comment_automation_events for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comment_automation_cursors' and policyname = 'comment_automation_cursors_owner_select'
  ) then
    create policy comment_automation_cursors_owner_select
      on public.comment_automation_cursors for select
      using (auth.uid() = user_id);
  end if;
end $$;

grant all on table public.comment_automation_rules to authenticated, service_role;
grant all on table public.comment_automation_events to authenticated, service_role;
grant all on table public.comment_automation_cursors to authenticated, service_role;

