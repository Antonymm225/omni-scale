insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_owner_select'
  ) then
    create policy avatars_owner_select
      on storage.objects
      for select
      using (
        bucket_id = 'avatars'
        and auth.uid() is not null
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_owner_insert'
  ) then
    create policy avatars_owner_insert
      on storage.objects
      for insert
      with check (
        bucket_id = 'avatars'
        and auth.uid() is not null
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_owner_update'
  ) then
    create policy avatars_owner_update
      on storage.objects
      for update
      using (
        bucket_id = 'avatars'
        and auth.uid() is not null
        and split_part(name, '/', 1) = auth.uid()::text
      )
      with check (
        bucket_id = 'avatars'
        and auth.uid() is not null
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_owner_delete'
  ) then
    create policy avatars_owner_delete
      on storage.objects
      for delete
      using (
        bucket_id = 'avatars'
        and auth.uid() is not null
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;

