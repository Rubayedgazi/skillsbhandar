import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MAIN_CATEGORIES } from '@skillsbhandar/shared';

/**
 * Owner-only "Start from zero": deletes skills, tutorials, downloads,
 * reports and logs, then restores the 8 main categories. Accounts and
 * access are kept. Needs SUPABASE_SERVICE_ROLE_KEY and ownerEmail = owner.
 */
export async function POST(req: Request) {
  const { ownerEmail } = await req.json() as { ownerEmail: string };
  if (ownerEmail !== 'owner@skillsbhandar.com') return NextResponse.json({ error: 'Only the owner can reset.' }, { status: 403 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) return NextResponse.json({ error: 'Service key not set. Set SUPABASE_SERVICE_ROLE_KEY in Vercel to use reset.' }, { status: 501 });
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  for (const table of ['skill_tags', 'tutorial_skills', 'user_progress', 'recently_viewed', 'bookmarks', 'downloads', 'reports', 'skill_steps', 'skill_images', 'skill_files', 'skills', 'tutorials', 'admin_activity_logs']) {
    await admin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  await admin.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('categories').insert(MAIN_CATEGORIES.map((c, i) => ({ name: c.name, slug: c.slug, sort_order: i + 1, is_published: true })));
  return NextResponse.json({ ok: true });
}
