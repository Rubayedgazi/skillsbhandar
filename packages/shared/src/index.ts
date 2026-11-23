import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const BRAND = 'SkillsBhandar';
export const OWNER_EMAIL = 'owner@skillsbhandar.com';
export const SUPABASE_URL = 'https://cjkesuieksldzgpefujw.supabase.co';

export const PERMISSIONS = [
  'Overview', 'Member Logins', 'Users & Access', 'Skills', 'Categories',
  'Tutorials', 'Website Content', 'Pricing', 'Reports', 'Activity Log', 'Sub-Admins',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/**
 * Pricing plans. Stored as JSON in site_settings.pricing_plans (see
 * supabase/migrations/006_pricing.sql) so the owner can edit them in
 * Admin → Pricing without touching code. The prices below are STARTER
 * PLACEHOLDERS in Taka — the owner must change them to real prices.
 */
export interface PricingPlan {
  slug: string;
  name: string;
  price_taka: number;
  period: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  featured: boolean;
  is_active: boolean;
}

/**
 * The public site shows only ONE premium plan (see getPremiumPlan):
 * the first active paid plan, preferring the Featured one. The owner
 * edits it in Admin → Pricing. The price below is a STARTER
 * PLACEHOLDER in Taka — the owner must change it to the real price,
 * and must set their real bKash number in Admin → Pricing (there is
 * NO bKash number in code — never invent one).
 */
export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    slug: 'premium', name: 'প্রিমিয়াম', price_taka: 999, period: 'lifetime',
    features: ['সব স্কিল ব্যবহার করুন', 'সব টিউটোরিয়াল দেখুন', 'নতুন স্কিল সবার আগে পান', 'প্রিমিয়াম সাপোর্ট'],
    featured: true, is_active: true,
  },
];

/** The single premium plan shown on the public site: first active paid
 * plan, Featured first. Returns null when no paid plan is active. */
export function getPremiumPlan(plans: PricingPlan[] | null | undefined): PricingPlan | null {
  const paid = (plans || []).filter((p) => p.is_active && p.price_taka > 0);
  if (paid.length === 0) return null;
  return paid.find((p) => p.featured) || paid[0];
}

export function periodLabel(period: PricingPlan['period']): string {
  if (period === 'monthly') return 'মাসিক';
  if (period === 'yearly') return 'বার্ষিক';
  return 'আজীবন';
}

/** A visitor's request to buy premium: bKash TrxID + verified email.
 * No payment is taken online — the owner checks the TrxID in their
 * bKash app, then creates the member account in Admin → Member Logins
 * and emails the password to the buyer themselves. */
export interface PurchaseRequest {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  trx_id: string;
  email_verified: boolean;
  plan_slug: string;
  plan_name: string;
  price_taka: number;
  status: 'pending' | 'contacted' | 'approved' | 'rejected';
  created_at: string;
}

export const MAIN_CATEGORIES: { name: string; slug: string }[] = [
  { name: 'SEO & Marketing', slug: 'seo-marketing' },
  { name: 'Content Creation', slug: 'content-creation' },
  { name: 'Coding & Development', slug: 'coding-development' },
  { name: 'Website Design & UI/UX', slug: 'website-design-ui-ux' },
  { name: 'Business & Entrepreneurship', slug: 'business-entrepreneurship' },
  { name: 'Productivity & Automation', slug: 'productivity-automation' },
  { name: 'Design & Creative', slug: 'design-creative' },
  { name: 'Research & Data', slug: 'research-data' },
];

export type Role = 'owner' | 'admin' | 'editor' | 'member' | 'revoked';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  status: 'active' | 'suspended';
  permissions: string[];
  password_set: boolean;
  last_active_at: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  parent_id: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface SkillStep {
  id: string;
  skill_id: string;
  step_number: number;
  heading: string;
  body: string;
  code_example: string;
  tip: string;
  expected_result: string;
}

export interface Skill {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  overview: string;
  skill_md: string;
  category_id: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  compatibility: string[];
  platforms: string[];
  setup_time_minutes: number | null;
  video_url: string | null;
  preview_image_url: string | null;
  status: 'draft' | 'published';
  is_featured: boolean;
  is_popular: boolean;
  published_at: string | null;
  view_count: number;
  download_count: number;
  created_at: string;
  steps?: SkillStep[];
  category?: Category | null;
}

export interface Tutorial {
  id: string;
  title: string;
  slug: string;
  description: string;
  video_url: string | null;
  thumbnail_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
}

export interface SiteSettings {
  hero_title: string;
  hero_description: string;
  announcement: string;
  footer_text: string;
  logo_url: string | null;
  seo_title: string;
  seo_description: string;
  download_base: number;
  pricing_plans: PricingPlan[];
  /** Owner's bKash number, set in Admin → Pricing. Null = not set yet.
   * NEVER hardcode a number here — it must come from the database. */
  bkash_number: string | null;
}

export interface Report {
  id: string;
  skill_id: string | null;
  type: string;
  message: string;
  status: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

export function isOwner(profile: Profile | null): boolean {
  return !!profile && profile.role === 'owner';
}

export function isStaff(profile: Profile | null): boolean {
  return !!profile && (profile.role === 'owner' || profile.role === 'admin' || profile.role === 'editor');
}

/** Server-side permission check: owner always has every permission. */
export function hasPermission(profile: Profile | null, permission: Permission): boolean {
  if (!profile) return false;
  if (profile.role === 'owner') return true;
  return (profile.permissions || []).includes(permission);
}

export function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!key) return null;
  return createClient(url, key);
}

export function generatePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  const cryptoObj = typeof globalThis !== 'undefined' ? (globalThis as unknown as { crypto?: Crypto }).crypto : undefined;
  for (let i = 0; i < 12; i++) {
    const r = cryptoObj && cryptoObj.getRandomValues
      ? cryptoObj.getRandomValues(new Uint32Array(1))[0] % chars.length
      : Math.floor(Math.random() * chars.length);
    out += chars[r];
  }
  return out;
}

export interface FinderResult {
  skill: Skill;
  reason: string;
  score: number;
}

/**
 * AI Skill Finder: suggests ONLY real skills from the library.
 * Bengali reason for each match. Returns [] honestly when the library is empty.
 */
export function findSkills(query: string, skills: Skill[], categories: Category[]): FinderResult[] {
  const q = query.trim().toLowerCase();
  if (!q || skills.length === 0) return [];
  const words = q.split(/\s+/).filter((w) => w.length > 1);
  const catById = new Map(categories.map((c) => [c.id, c.name]));
  const scored = skills.map((skill) => {
    const hay = [skill.title, skill.short_description, skill.overview, skill.skill_md, catById.get(skill.category_id || '') || ''].join(' ').toLowerCase();
    let score = 0;
    for (const w of words) if (hay.includes(w)) score += 1;
    if (skill.title.toLowerCase().includes(q)) score += 3;
    const catName = catById.get(skill.category_id || '') || '';
    const reason = score > 0
      ? `এই স্কিলটি আপনার কাজের সাথে মিলে যায়${catName ? ` — ক্যাটাগরি: ${catName}` : ''}।`
      : 'এই স্কিলটি আপনার কাজের সাথে কিছুটা মিলতে পারে।';
    return { skill, reason, score };
  });
  const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  return matched.length > 0 ? matched : scored.slice(0, 3).map((s) => ({ ...s, score: 0 }));
}
