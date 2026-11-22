import { createSupabaseClient, type ActivityLog, type Category, type Profile, type Report, type SiteSettings, type Skill, type Tutorial } from '@skillsbhandar/shared';
import type { SupabaseClient } from '@supabase/supabase-js';

export function getClient(): SupabaseClient | null { return createSupabaseClient(); }

export async function loadAll(sb: SupabaseClient) {
  const [cats, skills, tuts, profiles, reports, logs, settings] = await Promise.all([
    sb.from('categories').select('*').order('sort_order'),
    sb.from('skills').select('*').order('created_at', { ascending: false }),
    sb.from('tutorials').select('*').order('created_at', { ascending: false }),
    sb.from('profiles').select('*').order('created_at', { ascending: false }),
    sb.from('reports').select('*').order('created_at', { ascending: false }),
    sb.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
    sb.from('site_settings').select('*').eq('id', 1).single(),
  ]);
  return {
    categories: (cats.data as Category[]) || [],
    skills: (skills.data as Skill[]) || [],
    tutorials: (tuts.data as Tutorial[]) || [],
    profiles: (profiles.data as Profile[]) || [],
    reports: (reports.data as Report[]) || [],
    logs: (logs.data as ActivityLog[]) || [],
    settings: (settings.data as SiteSettings) || null,
  };
}

export async function logActivity(sb: SupabaseClient, actorId: string | null, action: string, targetType = '', targetId = '') {
  await sb.from('admin_activity_logs').insert({ actor_id: actorId, action, target_type: targetType, target_id: targetId });
}

export async function getProfile(sb: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return (data as Profile) || null;
}
