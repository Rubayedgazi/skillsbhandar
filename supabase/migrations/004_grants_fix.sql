-- SkillsBhandar 004: table GRANTs the Admin actually needs.
-- Run once in the Supabase SQL Editor after 001, 002 and 003.
--
-- WHY the owner setup still failed after 003 ran ("permission denied
-- for table profiles"):
-- 003 only added RLS POLICIES. A policy alone is not enough: Postgres
-- also needs a table-level GRANT, otherwise even the service_role
-- (server-side owner setup) and an authenticated staff user get
-- "permission denied for table profiles" before RLS is even checked.
-- 002 only granted SELECT on profiles, and SELECT on the content
-- tables, so no one could INSERT or UPDATE a profile, a skill, a
-- category or any other Admin content. RLS policies still guard who
-- may write (is_staff() / own row), so these grants are safe: members
-- still cannot write staff tables, they are blocked by RLS.

-- The service_role key (server-side Admin routes: owner setup, owner
-- reset, member creation) needs full access to every table.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Authenticated users need INSERT/UPDATE on their own profile row
-- (client-side owner setup fallback) and on staff tables (Admin
-- editors write from the browser as the signed-in staff user).
-- RLS policies decide WHO may actually write; without the grant,
-- even staff get "permission denied".
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.skills to authenticated;
grant select, insert, update, delete on public.skill_files to authenticated;
grant select, insert, update, delete on public.skill_images to authenticated;
grant select, insert, update, delete on public.skill_steps to authenticated;
grant select, insert, update, delete on public.tags to authenticated;
grant select, insert, update, delete on public.skill_tags to authenticated;
grant select, insert, update, delete on public.tutorials to authenticated;
grant select, insert, update, delete on public.tutorial_skills to authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select, insert, update, delete on public.admin_activity_logs to authenticated;
grant select, insert, update, delete on public.access_grants to authenticated;
grant select, insert, update, delete on public.downloads to authenticated;
grant select, insert, update, delete on public.reports to authenticated;
