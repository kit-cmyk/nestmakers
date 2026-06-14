-- Storage bucket + RLS policies for profile-photos
-- Run in Supabase SQL editor for project uccejyizdahxkhnbunsn

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- Verify bucket was created
do $$ begin
  if not exists (select 1 from storage.buckets where id = 'profile-photos') then
    raise exception 'Bucket profile-photos was not created — check permissions';
  end if;
end $$;

drop policy if exists "profile_photos_upload" on storage.objects;
create policy "profile_photos_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "profile_photos_update" on storage.objects;
create policy "profile_photos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "profile_photos_read" on storage.objects;
create policy "profile_photos_read" on storage.objects
  for select
  using (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_delete" on storage.objects;
create policy "profile_photos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Show what was created
select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname like 'profile_photos%';
