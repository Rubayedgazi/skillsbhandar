-- SkillsBhandar 006: pricing plans + premium purchase requests.
-- Run once in the Supabase SQL Editor after 001–005.
-- (Needs the public.is_staff() helper from 003.)
--
-- WHY a new table: a purchase request is a visitor's name/email/mobile
-- plus the plan they picked. It fits neither `reports` (skill feedback
-- with a fixed type list) nor `access_grants` (needs a profile user_id,
-- which a visitor does not have yet). No payment is taken online:
-- the visitor submits a REQUEST, the owner contacts them to complete
-- payment (bKash/cash/etc.), then grants premium in Admin → Member Logins.
--
-- Pricing plans live as JSON in site_settings.pricing_plans so the
-- owner can edit them in Admin → Pricing without touching code.
-- The column defaults to an empty list; the website shows the starter
-- placeholder plans from code until the owner saves real ones.

alter table public.site_settings
  add column if not exists pricing_plans jsonb not null default '[]'::jsonb;

create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  email text not null,
  mobile text not null default '',
  plan_slug text not null default '',
  plan_name text not null default '',
  price_taka int not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'contacted', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.purchase_requests enable row level security;

-- Anyone (even without an account) may submit a purchase request.
drop policy if exists "anyone can request premium" on public.purchase_requests;
create policy "anyone can request premium" on public.purchase_requests
  for insert with check (true);

-- Only staff may read or change requests.
drop policy if exists "staff read purchase requests" on public.purchase_requests;
create policy "staff read purchase requests" on public.purchase_requests
  for select using (public.is_staff());
drop policy if exists "staff update purchase requests" on public.purchase_requests;
create policy "staff update purchase requests" on public.purchase_requests
  for update using (public.is_staff()) with check (public.is_staff());

-- Table-level GRANTs: RLS policies alone are not enough (see 004).
grant select, insert on public.purchase_requests to anon;
grant select, insert, update, delete on public.purchase_requests to authenticated;
grant all on public.purchase_requests to service_role;
