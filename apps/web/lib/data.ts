import { createSupabaseClient, type Category, type Skill, type SiteSettings, type Tutorial } from '@skillsbhandar/shared';

export function getClient() { return createSupabaseClient(); }

export async function getCategories(): Promise<Category[]> {
  const sb = getClient();
  if (!sb) return [];
  const { data } = await sb.from('categories').select('*').eq('is_published', true).order('sort_order');
  return (data as Category[]) || [];
}

export async function getSkills(): Promise<Skill[]> {
  const sb = getClient();
  if (!sb) return [];
  const { data } = await sb.from('skills').select('*').eq('status', 'published').order('published_at', { ascending: false });
  return (data as Skill[]) || [];
}

export async function getSkillBySlug(slug: string): Promise<Skill | null> {
  const sb = getClient();
  if (!sb) return null;
  const { data } = await sb.from('skills').select('*, steps:skill_steps(*)').eq('slug', slug).eq('status', 'published').single();
  if (!data) return null;
  const skill = data as unknown as Skill;
  if (skill.steps) skill.steps = [...skill.steps].sort((a, b) => a.step_number - b.step_number);
  return skill;
}

export async function getTutorials(): Promise<Tutorial[]> {
  const sb = getClient();
  if (!sb) return [];
  const { data } = await sb.from('tutorials').select('*').eq('status', 'published').order('created_at', { ascending: false });
  return (data as Tutorial[]) || [];
}

export async function getSettings(): Promise<SiteSettings> {
  const sb = getClient();
  const fallback: SiteSettings = {
    hero_title: 'আপনার সব AI কাজ। এক লাইব্রেরি।',
    hero_description: 'সেরা AI স্কিলগুলো এক জায়গায় — শিখুন, ব্যবহার করুন, এগিয়ে যান।',
    announcement: '', footer_text: 'SkillsBhandar — আপনার সব AI কাজ। এক লাইব্রেরি।',
    logo_url: null, seo_title: 'SkillsBhandar', seo_description: 'আপনার সব AI কাজ। এক লাইব্রেরি।', download_base: 0,
  };
  if (!sb) return fallback;
  const { data } = await sb.from('site_settings').select('*').eq('id', 1).single();
  return (data as SiteSettings) || fallback;
}

export async function countSkillsByCategory(): Promise<Record<string, number>> {
  const skills = await getSkills();
  const out: Record<string, number> = {};
  for (const s of skills) if (s.category_id) out[s.category_id] = (out[s.category_id] || 0) + 1;
  return out;
}
