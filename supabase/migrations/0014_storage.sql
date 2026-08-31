-- photos/       user uploads, authenticated write, public read once approved
-- certificates/ rendered PNGs, public read, service-role write only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', true, 8388608, array['image/jpeg','image/png','image/webp']),
  ('certificates', 'certificates', true, 4194304, array['image/png'])
on conflict (id) do nothing;

create policy photos_read on storage.objects for select
  using (bucket_id = 'photos');

create policy photos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy photos_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy certificates_read on storage.objects for select
  using (bucket_id = 'certificates');
