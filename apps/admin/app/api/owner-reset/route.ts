import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OWNER_EMAIL } from '@skillsbhandar/shared';

/**
 * "Reset Admin": delete the owner auth user + owner profile row, so the
 * one-time owner-password setup form appears again on the Admin sign-in
 * screen. This is the recovery when the owner cannot log in at all
 * (forgot password, account stuck unconfirmed, profile row missing).
 * It does NOT delete skills, categories, tutorials or members — only the
 * owner login itself.
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in Vercel (server only). Without it,
 * returns 501 with a plain message — never a fake success.
 */
export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) {
    return NextResponse.json({
      error: 'Service key not set. Set SUPABASE_SERVICE_ROLE_KEY in Vercel (Admin project, all environments) to use Admin reset. Until then, delete the owner user in Supabase → Authentication → Users (owner@skillsbhandar.com) and its profile row, then use the setup form.',
    }, { status: 501 });
  }
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  let ownerId: string | null = null;
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !data?.users?.length) break;
    const found = data.users.find((u) => u.email?.toLowerCase() === OWNER_EMAIL);
    if (found) { ownerId = found.id; break; }
    if (data.users.length < 100) break;
    page += 1;
  }

  if (ownerId) {
    await admin.from('profiles').delete().eq('id', ownerId);
    const { error } = await admin.auth.admin.deleteUser(ownerId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    // No auth user — still clear any stray owner profile row.
    await admin.from('profiles').delete().eq('email', OWNER_EMAIL);
  }
  return NextResponse.json({ ok: true });
}
