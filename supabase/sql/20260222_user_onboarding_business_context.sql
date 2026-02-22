alter table public.user_onboarding
  add column if not exists business_description text,
  add column if not exists business_goals text;
