alter table public.profiles
  add column if not exists timezone_name text;

update public.profiles
set timezone_name = 'America/Lima'
where timezone_name is null or btrim(timezone_name) = '';

alter table public.profiles
  alter column timezone_name set default 'America/Lima';
