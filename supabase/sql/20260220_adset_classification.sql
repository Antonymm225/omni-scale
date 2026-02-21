-- Add adset performance classification fields

alter table public.facebook_adsets
  add column if not exists performance_type text,
  add column if not exists classification_source text,
  add column if not exists confidence_score integer,
  add column if not exists manual_override boolean not null default false;

alter table public.facebook_adsets
  drop constraint if exists facebook_adsets_performance_type_check;

alter table public.facebook_adsets
  add constraint facebook_adsets_performance_type_check
  check (
    performance_type is null
    or performance_type in ('SALES','LEADS','MESSAGING','AWARENESS')
  );

alter table public.facebook_adsets
  drop constraint if exists facebook_adsets_classification_source_check;

alter table public.facebook_adsets
  add constraint facebook_adsets_classification_source_check
  check (
    classification_source is null
    or classification_source in ('auto','manual')
  );

alter table public.facebook_adsets
  drop constraint if exists facebook_adsets_confidence_score_check;

alter table public.facebook_adsets
  add constraint facebook_adsets_confidence_score_check
  check (
    confidence_score is null
    or (confidence_score >= 0 and confidence_score <= 100)
  );
