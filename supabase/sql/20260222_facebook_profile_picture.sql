alter table public.facebook_connections
  add column if not exists facebook_profile_picture_url text;
