-- SkillsBhandar: grant anon/authenticated read access to public tables.
-- Run this once in Supabase SQL Editor after 001_init.sql.
-- PostgREST (anon role) needs table-level GRANTs in addition to RLS policies.

grant select on public.categories to anon, authenticated;
grant select on public.skills to anon, authenticated;
grant select on public.skill_files to anon, authenticated;
grant select on public.skill_images to anon, authenticated;
grant select on public.skill_steps to anon, authenticated;
grant select on public.tags to anon, authenticated;
grant select on public.skill_tags to anon, authenticated;
grant select on public.tutorials to anon, authenticated;
grant select on public.tutorial_skills to anon, authenticated;
grant select on public.site_settings to anon, authenticated;

grant select, insert, update, delete on public.bookmarks to authenticated;
grant select, insert, update, delete on public.user_progress to authenticated;
grant select, insert, update, delete on public.recently_viewed to authenticated;
grant select, insert on public.reports to authenticated;
grant select on public.access_grants to authenticated;
grant select on public.profiles to authenticated;
grant select on public.downloads to authenticated;
