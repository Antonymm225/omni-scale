create table if not exists public.facebook_sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_source text not null default 'cron',
  scope text not null default 'all',
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  processed_accounts integer not null default 0,
  failed_accounts integer not null default 0,
  error_message text,
  summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint facebook_sync_runs_trigger_check check (trigger_source in ('cron', 'manual')),
  constraint facebook_sync_runs_status_check check (status in ('running', 'completed', 'error', 'locked'))
);

create index if not exists idx_facebook_sync_runs_user_started
  on public.facebook_sync_runs(user_id, started_at desc);

create table if not exists public.facebook_sync_locks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  scope text not null default 'all',
  lock_until timestamptz not null,
  run_id uuid references public.facebook_sync_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.acquire_facebook_sync_lock(
  p_user_id uuid,
  p_scope text default 'all',
  p_ttl_seconds integer default 900,
  p_run_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock_until timestamptz := now() + make_interval(secs => greatest(coalesce(p_ttl_seconds, 900), 30));
  v_ok boolean := false;
begin
  with upserted as (
    insert into public.facebook_sync_locks (user_id, scope, lock_until, run_id, created_at, updated_at)
    values (p_user_id, coalesce(p_scope, 'all'), v_lock_until, p_run_id, now(), now())
    on conflict (user_id) do update
      set scope = excluded.scope,
          lock_until = excluded.lock_until,
          run_id = excluded.run_id,
          updated_at = now()
      where public.facebook_sync_locks.lock_until < now()
    returning 1
  )
  select exists(select 1 from upserted) into v_ok;

  return v_ok;
end;
$$;

create or replace function public.release_facebook_sync_lock(
  p_user_id uuid,
  p_run_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  update public.facebook_sync_locks
  set lock_until = now() - interval '1 second',
      run_id = null,
      updated_at = now()
  where user_id = p_user_id
    and (p_run_id is null or run_id = p_run_id);

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

grant all on table public.facebook_sync_runs to authenticated, service_role;
grant all on table public.facebook_sync_locks to authenticated, service_role;
grant execute on function public.acquire_facebook_sync_lock(uuid, text, integer, uuid) to authenticated, service_role;
grant execute on function public.release_facebook_sync_lock(uuid, uuid) to authenticated, service_role;

