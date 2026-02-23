alter table public.profiles
  add column if not exists leads_cpl_target_usd numeric(12,4);
