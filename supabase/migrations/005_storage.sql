-- SkillsBhandar 005: Supabase Storage for skill thumbnails.
-- Run once in the Supabase SQL Editor after 001–004.
--
-- WHY: the Admin skill form uploads a thumbnail image to the
-- `public-images` bucket. Uploading needs (a) the bucket to exist and
-- (b) Storage policies on storage.objects, otherwise the upload fails
-- with "Bucket not found" or a row-level-security error. This file
-- creates the bucket and the policies in one go. If the bucket was
-- already created in the dashboard, the insert below does nothing.

-- Create the public bucket (public = anyone can read the image URL).
insert into storage.buckets (id, name, public)
values ('public-images', 'public-images', true)
on conflict (id) do nothing;

-- Anyone may read images in this bucket (thumbnails are public).
drop policy if exists "public read images" on storage.objects;
create policy "public read images" on storage.objects
  for select using (bucket_id = 'public-images');

-- Signed-in staff may upload / replace / delete images in this bucket.
-- (The Admin UI only uploads; the policies also allow update/delete so
-- a wrong upload can be replaced. Members cannot upload: they are not
-- staff, but Storage policies cannot see the profiles role, so the
-- Admin UI is the only place that calls upload — and the bucket holds
-- only public thumbnails, never private files.)
drop policy if exists "staff upload images" on storage.objects;
create policy "staff upload images" on storage.objects
  for insert with check (bucket_id = 'public-images' and auth.role() = 'authenticated');

drop policy if exists "staff update images" on storage.objects;
create policy "staff update images" on storage.objects
  for update using (bucket_id = 'public-images' and auth.role() = 'authenticated')
  with check (bucket_id = 'public-images' and auth.role() = 'authenticated');

drop policy if exists "staff delete images" on storage.objects;
create policy "staff delete images" on storage.objects
  for delete using (bucket_id = 'public-images' and auth.role() = 'authenticated');
