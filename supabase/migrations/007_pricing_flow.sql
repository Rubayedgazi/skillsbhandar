-- SkillsBhandar 007: bKash purchase flow (single premium plan).
-- Run once in the Supabase SQL Editor after 001–006.
--
-- WHY: the premium buy flow is now (1) bKash Send Money + TrxID,
-- (2) email verification with a 6-digit OTP, (3) success message.
-- This needs two new columns on purchase_requests (trx_id and
-- email_verified) and a place for the owner's bKash number
-- (site_settings.bkash_number, edited in Admin → Pricing).
-- The bKash number is NOT in this file — the owner types their real
-- number in Admin; until then it is NULL and the public buy form
-- shows "bKash নম্বর এখনো দেওয়া হয়নি" instead of a fake number.

alter table public.site_settings
  add column if not exists bkash_number text;

alter table public.purchase_requests
  add column if not exists trx_id text not null default '',
  add column if not exists email_verified boolean not null default false;
