alter table public.facebook_performance_state
  add column if not exists ai_confidence_score integer,
  add column if not exists ai_feature_summary text;

alter table public.facebook_performance_state
  drop constraint if exists facebook_performance_state_ai_confidence_score_check;
alter table public.facebook_performance_state
  add constraint facebook_performance_state_ai_confidence_score_check
  check (ai_confidence_score is null or (ai_confidence_score >= 0 and ai_confidence_score <= 100));

alter table public.facebook_performance_snapshots
  add column if not exists ai_confidence_score integer,
  add column if not exists ai_feature_summary text;

alter table public.facebook_performance_snapshots
  drop constraint if exists facebook_performance_snapshots_ai_confidence_score_check;
alter table public.facebook_performance_snapshots
  add constraint facebook_performance_snapshots_ai_confidence_score_check
  check (ai_confidence_score is null or (ai_confidence_score >= 0 and ai_confidence_score <= 100));

create index if not exists idx_facebook_performance_state_ai_conf
  on public.facebook_performance_state(user_id, entity_type, ai_confidence_score);

create index if not exists idx_facebook_performance_snapshots_ai_conf
  on public.facebook_performance_snapshots(user_id, source_date, entity_type, ai_confidence_score);
