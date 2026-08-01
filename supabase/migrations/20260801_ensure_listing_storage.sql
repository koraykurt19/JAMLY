-- Safe to run repeatedly. This is the storage prerequisite for live listing uploads.
insert into storage.buckets (id, name, public)
values
  ('listing-covers', 'listing-covers', true),
  ('audio-previews', 'audio-previews', true),
  ('license-deliverables', 'license-deliverables', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public listing media is readable" on storage.objects;
create policy "Public listing media is readable"
  on storage.objects for select
  using (bucket_id in ('listing-covers', 'audio-previews'));

drop policy if exists "Authenticated users can upload listing media" on storage.objects;
create policy "Authenticated users can upload listing media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('listing-covers', 'audio-previews')
    and owner = auth.uid()
  );

drop policy if exists "Authenticated users can upload private license packages" on storage.objects;
create policy "Authenticated users can upload private license packages"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'license-deliverables'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
