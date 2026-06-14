-- Storage bucket + RLS policies for medical-files
-- Run in Supabase SQL editor for project uccejyizdahxkhnbunsn

insert into storage.buckets (id, name, public)
values ('medical-files', 'medical-files', true)
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from storage.buckets where id = 'medical-files') then
    raise exception 'Bucket medical-files was not created — check permissions';
  end if;
end $$;

drop policy if exists "medical_files_upload" on storage.objects;
create policy "medical_files_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'medical-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "medical_files_update" on storage.objects;
create policy "medical_files_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'medical-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "medical_files_read" on storage.objects;
create policy "medical_files_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'medical-files');

drop policy if exists "medical_files_delete" on storage.objects;
create policy "medical_files_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'medical-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );

select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname like 'medical_files%';
