import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OWNER_EMAIL, PERMISSIONS } from '@skillsbhandar/shared';

/**
 * Owner setup, done on the server so it cannot fail under RLS.
 * Creates the owner auth user (email already confirmed) and the owner
 * profile row, or fixes an existing owner account that is missing its
 * profile row / has the wrong password.
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in Vercel (server only). Without it,
 * returns 501 with a plain message — never a fake success — and the
 * Admin screen falls back to the client-side setup with clear guidance.
 */
export async function POST(req: Request) {
  const { password } = await req.json() as { password?: string };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) {
    return NextResponse.json({
      error: 'Service key not set. Set SUPABASE_SERVICE_ROLE_KEY in Vercel (Admin project, all environments) to use one-click owner setup. Until then, turn OFF email confirmation in Supabase → Authentication → Providers → Email, then use the setup form on this screen.',
    }, { status: 501 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Find an existing owner auth user, if any (paged list, usually tiny).
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
    const { error } = await admin.auth.admin.updateUserById(ownerId, { password, email_confirm: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email: OWNER_EMAIL, password, email_confirm: true });
    if (error || !data.user) return NextResponse.json({ error: error?.message || 'Could not create the owner account.' }, { status: 400 });
    ownerId = data.user.id;
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: ownerId, email: OWNER_EMAIL, role: 'owner', status: 'active',
    password_set: true, permissions: [...PERMISSIONS],
  });
  if (profileError) return NextResponse.json({ error: `Owner account created, but the profile could not be saved: ${profileError.message}. Run supabase/migrations/003_owner_profile.sql in the Supabase SQL Editor and try again.` }, { status: 400 });

  return NextResponse.json({ ok: true });
}
