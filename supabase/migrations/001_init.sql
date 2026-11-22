-- SkillsBhandar — 001_init.sql
-- Run once in Supabase: SQL Editor -> paste -> Run. Safe to run again:
-- tables are created IF NOT EXISTS and the 8 categories use ON CONFLICT.
-- Supabase project: skillsbhandar (https://cjkesuieksldzgpefujw.supabase.co)
-- After running, create two Storage buckets in Supabase Storage:
--   skill-files (PRIVATE) and public-images (public).

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key,
  email text not null unique,
  full_name text,
  avatar_url text,
  role text not null default 'member'
    check (role in ('owner','admin','editor','member','revoked')),
  status text not null default 'active'
    check (status in ('active','suspended')),
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  icon text default '',
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- skills ----------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text default '',
  overview text default '',
  skill_md text default '',
  category_id uuid references public.categories(id) on delete set null,
  difficulty text not null default 'beginner'
    check (difficulty in ('beginner','intermediate','advanced')),
  compatibility text[] not null default '{}',
  platforms text[] not null default '{}',
  setup_time_minutes int,
  video_url text,
  preview_image_url text,
  status text not null default 'draft'
    check (status in ('draft','published')),
  is_featured boolean not null default false,
  is_popular boolean not null default false,
  published_at timestamptz,
  view_count int not null default 0,
  download_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- skill_files ----------
create table if not exists public.skill_files (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  file_type text not null default 'md' check (file_type in ('md','txt')),
  file_size int,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- skill_images ----------
create table if not exists public.skill_images (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  image_url text not null,
  caption text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- skill_steps ----------
create table if not exists public.skill_steps (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  step_number int not null default 1,
  heading text not null,
  body text default '',
  image_url text,
  code_example text default '',
  tip text default '',
  expected_result text default '',
  created_at timestamptz not null default now()
);

-- ---------- tags ----------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.skill_tags (
  skill_id uuid not null references public.skills(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (skill_id, tag_id)
);

-- ---------- tutorials ----------
create table if not exists public.tutorials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text default '',
  video_url text,
  thumbnail_url text,
  status text not null default 'draft'
    check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.tutorial_skills (
  tutorial_id uuid not null references public.tutorials(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (tutorial_id, skill_id)
);

-- ---------- bookmarks / progress / recently viewed ----------
create table if not exists public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);
create table if not exists public.user_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  step_id uuid not null references public.skill_steps(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  primary key (user_id, step_id)
);
create table if not exists public.recently_viewed (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

-- ---------- access_grants ----------
create table if not exists public.access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null default 'full_library'
    check (scope in ('full_library','skill')),
  skill_id uuid references public.skills(id) on delete cascade,
  access_type text not null default 'lifetime'
    check (access_type in ('lifetime','time_limited','custom')),
  expires_at timestamptz,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- downloads / reports ----------
create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  skill_id uuid not null references public.skills(id) on delete cascade,
  file_id uuid references public.skill_files(id) on delete set null,
  downloaded_at timestamptz not null default now()
);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  skill_id uuid references public.skills(id) on delete cascade,
  type text not null default 'other'
    check (type in ('broken_file','incorrect_info','outdated_tutorial','other')),
  message text not null default '',
  status text not null default 'open'
    check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);

-- ---------- site_settings ----------
create table if not exists public.site_settings (
  id int primary key,
  hero_title text not null default 'আপনার সব AI কাজ। এক লাইব্রেরি।',
  hero_description text not null default 'সেরা AI স্কিলগুলো এক জায়গায় — শিখুন, ব্যবহার করুন, এগিয়ে যান।',
  announcement text default '',
  footer_text text not null default 'SkillsBhandar — আপনার সব AI কাজ। এক লাইব্রেরি।',
  logo_url text,
  favicon_url text,
  social_links jsonb not null default '{}'::jsonb,
  seo_title text not null default 'SkillsBhandar',
  seo_description text not null default 'আপনার সব AI কাজ। এক লাইব্রেরি।',
  download_base int not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1)
  on conflict (id) do nothing;

-- ---------- admin_activity_logs ----------
create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text default '',
  target_id text default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- sub-admin permissions ----------
-- Stored on the profile row so the server can enforce it, not just hide menus.
alter table public.profiles
  add column if not exists permissions text[] not null default '{}';
alter table public.profiles
  add column if not exists password_set boolean not null default false;

-- ---------- indexes ----------
create index if not exists idx_skills_category on public.skills (category_id);
create index if not exists idx_skills_status on public.skills (status);
create index if not exists idx_skills_published on public.skills (published_at desc);
create index if not exists idx_categories_slug on public.categories (slug);
create index if not exists idx_categories_parent on public.categories (parent_id, sort_order);
create index if not exists idx_grants_user on public.access_grants (user_id, is_active);
create index if not exists idx_grants_expires on public.access_grants (expires_at);
create index if not exists idx_bookmarks_user on public.bookmarks (user_id);
create index if not exists idx_progress_user on public.user_progress (user_id);
create index if not exists idx_recent_user on public.recently_viewed (user_id);
create index if not exists idx_logs_created on public.admin_activity_logs (created_at desc);

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.skills enable row level security;
alter table public.skill_files enable row level security;
alter table public.skill_images enable row level security;
alter table public.skill_steps enable row level security;
alter table public.tags enable row level security;
alter table public.skill_tags enable row level security;
alter table public.tutorials enable row level security;
alter table public.tutorial_skills enable row level security;
alter table public.bookmarks enable row level security;
alter table public.user_progress enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.access_grants enable row level security;
alter table public.downloads enable row level security;
alter table public.reports enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_activity_logs enable row level security;

-- Public (anonymous) read: published categories, skills, tutorials, settings.
-- Drop first so re-running this file does not create duplicate policies.
drop policy if exists "public read published categories" on public.categories;
create policy "public read published categories" on public.categories
  for select using (is_published = true);
drop policy if exists "public read published skills" on public.skills;
create policy "public read published skills" on public.skills
  for select using (status = 'published');
drop policy if exists "public read skill steps" on public.skill_steps;
create policy "public read skill steps" on public.skill_steps
  for select using (true);
drop policy if exists "public read skill images" on public.skill_images;
create policy "public read skill images" on public.skill_images
  for select using (true);
drop policy if exists "public read published tutorials" on public.tutorials;
create policy "public read published tutorials" on public.tutorials
  for select using (status = 'published');
drop policy if exists "public read tutorial skills" on public.tutorial_skills;
create policy "public read tutorial skills" on public.tutorial_skills
  for select using (true);
drop policy if exists "public read tags" on public.tags;
create policy "public read tags" on public.tags for select using (true);
drop policy if exists "public read skill tags" on public.skill_tags;
create policy "public read skill tags" on public.skill_tags for select using (true);
drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings
  for select using (true);

-- Signed-in users: own bookmarks / progress / recently viewed / reports.
drop policy if exists "own bookmarks" on public.bookmarks;
create policy "own bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own progress" on public.user_progress;
create policy "own progress" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own recently viewed" on public.recently_viewed;
create policy "own recently viewed" on public.recently_viewed
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own reports" on public.reports;
create policy "own reports" on public.reports
  for insert with check (auth.uid() = user_id);
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "own downloads insert" on public.downloads;
create policy "own downloads insert" on public.downloads
  for insert with check (auth.uid() = user_id);

-- Staff (owner / admin / editor) can write content. The app also checks
-- roles and per-sub-admin permissions on the server; RLS is the second layer.
-- Note: full staff write access through the service-role key is used by the
-- admin app for member creation; anon-key writes are intentionally limited.
drop policy if exists "staff write categories" on public.categories;
create policy "staff write categories" on public.categories
  for all using (auth.uid() in (select id from public.profiles
    where role in ('owner','admin','editor')))
  with check (auth.uid() in (select id from public.profiles
    where role in ('owner','admin','editor')));
drop policy if exists "staff write skills" on public.skills;
create policy "staff write skills" on public.skills
  for all using (auth.uid() in (select id from public.profiles
    where role in ('owner','admin','editor')))
  with check (auth.uid() in (select id from public.profiles
    where role in ('owner','admin','editor')));
drop policy if exists "staff write tutorials" on public.tutorials;
create policy "staff write tutorials" on public.tutorials
  for all using (auth.uid() in (select id from public.profiles
    where role in ('owner','admin','editor')))
  with check (auth.uid() in (select id from public.profiles
    where role in ('owner','admin','editor')));

-- ---------- The 8 main categories (0 skills each to start) ----------
insert into public.categories (name, slug, description, sort_order, is_published) values
  ('SEO & Marketing', 'seo-marketing', '', 1, true),
  ('Content Creation', 'content-creation', '', 2, true),
  ('Coding & Development', 'coding-development', '', 3, true),
  ('Website Design & UI/UX', 'website-design-ui-ux', '', 4, true),
  ('Business & Entrepreneurship', 'business-entrepreneurship', '', 5, true),
  ('Productivity & Automation', 'productivity-automation', '', 6, true),
  ('Design & Creative', 'design-creative', '', 7, true),
  ('Research & Data', 'research-data', '', 8, true)
on conflict (slug) do nothing;
