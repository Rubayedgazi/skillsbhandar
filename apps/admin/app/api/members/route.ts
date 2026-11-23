import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Create a member account by email with a generated password.
 * Needs SUPABASE_SERVICE_ROLE_KEY in Vercel env vars (server only).
 * Without it, returns 501 with a plain-language message — never a fake success.
 *
 * The buyer may ALREADY have an auth account: the premium buy flow
 * verifies their email with an OTP (signInWithOtp), which creates a
 * Supabase auth user for that email. So if the email already exists,
 * we do NOT fail with "already registered" — we reset that account's
 * password to the new generated one and make sure the member profile
 * and premium grant exist. The generated password is returned to the
 * Admin screen, which shows it ONCE — the owner copies it and emails
 * it to the buyer themselves (this app sends no password email).
 */
export async function POST(req: Request) {
  const { email, password, premiumUntil } = await req.json() as { email: string; password: string; premiumUntil?: string | null };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) return NextResponse.json({ error: 'Service key not set. Set SUPABASE_SERVICE_ROLE_KEY in Vercel to create member accounts.' }, { status: 501 });
  if (!email || !password) return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Find an existing auth user with this email (e.g. created by the OTP step).
  let userId: string | null = null;
  let wasExisting = false;
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !data?.users?.length) break;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) { userId = found.id; wasExisting = true; break; }
    if (data.users.length < 100) break;
    page += 1;
  }

  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) return NextResponse.json({ error: error?.message || 'Could not create the account.' }, { status: 400 });
    userId = data.user.id;
  }

  await admin.from('profiles').upsert({ id: userId, email, role: 'member', status: 'active', password_set: true });
  if (premiumUntil) {
    await admin.from('access_grants').insert({ user_id: userId, scope: 'full_library', access_type: 'time_limited', expires_at: premiumUntil, is_active: true });
  } else {
    await admin.from('access_grants').insert({ user_id: userId, scope: 'full_library', access_type: 'lifetime', expires_at: null, is_active: true });
  }
  return NextResponse.json({ ok: true, userId, existing: wasExisting });
}
