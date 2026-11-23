import { cache } from 'react';
import { DEFAULT_PRICING_PLANS, createSupabaseClient, type Category, type Skill, type SiteSettings, type Tutorial } from '@skillsbhandar/shared';

export function getClient() { return createSupabaseClient(); }

/**
 * Speed: every fetcher is React-cached, so the same table is never fetched
 * twice inside one request (the old homepage fetched `skills` twice — once
 * for the lists and once again just to count them per category).
 * Public pages also use `revalidate = 60` (see app/page.tsx), so Vercel
 * serves a cached page for 60s instead of hitting Supabase (in another
 * region) on every single visit.
 */
export const getCategories = cache(async (): Promise<Category[]> => {
  const sb = getClient();
  if (!sb) return [];
  const { data } = await sb.from('categories').select('*').eq('is_published', true).order('sort_order');
  return (data as Category[]) || [];
});

export const getSkills = cache(async (): Promise<Skill[]> => {
  const sb = getClient();
  if (!sb) return [];
  const { data } = await sb.from('skills').select('*').eq('status', 'published').order('published_at', { ascending: false });
  return (data as Skill[]) || [];
});

export const getSkillBySlug = cache(async (slug: string): Promise<Skill | null> => {
  const sb = getClient();
  if (!sb) return null;
  const { data } = await sb.from('skills').select('*, steps:skill_steps(*)').eq('slug', slug).eq('status', 'published').single();
  if (!data) return null;
  const skill = data as unknown as Skill;
  if (skill.steps) skill.steps = [...skill.steps].sort((a, b) => a.step_number - b.step_number);
  return skill;
});

export const getTutorials = cache(async (): Promise<Tutorial[]> => {
  const sb = getClient();
  if (!sb) return [];
  const { data } = await sb.from('tutorials').select('*').eq('status', 'published').order('created_at', { ascending: false });
  return (data as Tutorial[]) || [];
});

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const sb = getClient();
  const fallback: SiteSettings = {
    hero_title: 'আপনার সব AI কাজ। এক লাইব্রেরি।',
    hero_description: 'সেরা AI স্কিলগুলো এক জায়গায় — শিখুন, ব্যবহার করুন, এগিয়ে যান।',
    announcement: '', footer_text: 'SkillsBhandar — আপনার সব AI কাজ। এক লাইব্রেরি।',
    logo_url: null, seo_title: 'SkillsBhandar', seo_description: 'আপনার সব AI কাজ। এক লাইব্রেরি।', download_base: 0,
    pricing_plans: DEFAULT_PRICING_PLANS, bkash_number: null,
  };
  if (!sb) return fallback;
  const { data } = await sb.from('site_settings').select('*').eq('id', 1).single();
  const settings = (data as SiteSettings) || fallback;
  if (!settings.pricing_plans) settings.pricing_plans = DEFAULT_PRICING_PLANS;
  if (settings.bkash_number === undefined) settings.bkash_number = null;
  return settings;
});

/** Count skills per category from an already-fetched list — no extra query. */
export function countSkillsByCategory(skills: Skill[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of skills) if (s.category_id) out[s.category_id] = (out[s.category_id] || 0) + 1;
  return out;
}

/** One parallel fetch for the whole homepage — no sequential waits. */
export async function getHomeData() {
  const [settings, categories, skills, tutorials] = await Promise.all([
    getSettings(), getCategories(), getSkills(), getTutorials(),
  ]);
  return { settings, categories, skills, tutorials, counts: countSkillsByCategory(skills) };
}
