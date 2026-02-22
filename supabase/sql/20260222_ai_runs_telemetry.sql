alter table public.facebook_ai_runs
  add column if not exists last_status text,
  add column if not exists last_error text,
  add column if not exists last_openai_entities integer not null default 0,
  add column if not exists last_total_entities integer not null default 0,
  add column if not exists last_slot_at timestamptz,
  add column if not exists last_model text;

alter table public.facebook_ai_runs
  drop constraint if exists facebook_ai_runs_last_status_check;
alter table public.facebook_ai_runs
  add constraint facebook_ai_runs_last_status_check
  check (
    last_status is null
    or last_status = any (array['idle'::text, 'running'::text, 'completed'::text, 'skipped'::text, 'error'::text])
  );

