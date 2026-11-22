-- SkillsBhandar 003: fix the Admin login.
-- Run once in the Supabase SQL Editor after 001_init.sql and 002_grants.sql.
--
-- WHY the owner could not log in:
-- 1. `profiles` had NO insert/update policy at all, so the client-side
--    owner setup (signUp then upsert into profiles) always failed under
--    RLS, silently. The auth user existed but had no profile row, so
--    sign-in then refused the account ("Member accounts cannot sign in").
-- 2. Staff could only read their OWN profile row, so the Admin Users /
--    Members lists came back empty, and staff writes to site_settings,
--    skill steps, activity logs etc. had no policy and failed silently.
-- 3. The staff-write policies used a subquery on profiles, which made
--    every anonymous SELECT on categories/skills also need a profiles
--    grant. A SECURITY DEFINER helper avoids that entirely.

-- Helper: true when the signed-in user is owner/admin/editor.
-- SECURITY DEFINER so it reads profiles without hitting RLS again
-- (a plain subquery in a policy on the same table would recurse).
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner', 'admin', 'editor')
  );
$$;

-- A user may create and update their OWN profile row (owner first setup).
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Staff may read every profile (Admin Users / Members lists).
drop policy if exists "staff read profiles" on public.profiles;
create policy "staff read profiles" on public.profiles
  for select using (public.is_staff());

-- Staff may write content tables (used by the Admin editors).
drop policy if exists "staff write categories" on public.categories;
create policy "staff write categories" on public.categories
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write skills" on public.skills;
create policy "staff write skills" on public.skills
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write tutorials" on public.tutorials;
create policy "staff write tutorials" on public.tutorials
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write site_settings" on public.site_settings;
create policy "staff write site_settings" on public.site_settings
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write skill_steps" on public.skill_steps;
create policy "staff write skill_steps" on public.skill_steps
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write skill_images" on public.skill_images;
create policy "staff write skill_images" on public.skill_images
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write skill_files" on public.skill_files;
create policy "staff write skill_files" on public.skill_files
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write tags" on public.tags;
create policy "staff write tags" on public.tags
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write skill_tags" on public.skill_tags;
create policy "staff write skill_tags" on public.skill_tags
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write tutorial_skills" on public.tutorial_skills;
create policy "staff write tutorial_skills" on public.tutorial_skills
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write activity logs" on public.admin_activity_logs;
create policy "staff write activity logs" on public.admin_activity_logs
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff read reports" on public.reports;
create policy "staff read reports" on public.reports
  for select using (public.is_staff());
drop policy if exists "staff write reports" on public.reports;
create policy "staff write reports" on public.reports
  for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff read access grants" on public.access_grants;
create policy "staff read access grants" on public.access_grants
  for select using (public.is_staff());
drop policy if exists "staff write access grants" on public.access_grants;
create policy "staff write access grants" on public.access_grants
  for all using (public.is_staff()) with check (public.is_staff());

-- Staff may update a profile's role/status (grant, suspend, revoke).
drop policy if exists "staff update profiles" on public.profiles;
create policy "staff update profiles" on public.profiles
  for update using (public.is_staff()) with check (public.is_staff());
