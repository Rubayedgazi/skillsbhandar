import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Create a member account by email with a generated password.
 * Needs SUPABASE_SERVICE_ROLE_KEY in Vercel env vars (server only).
 * Without it, returns 501 with a plain-language message — never a fake success.
 */
export async function POST(req: Request) {
  const { email, password, premiumUntil } = await req.json() as { email: string; password: string; premiumUntil?: string | null };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) return NextResponse.json({ error: 'Service key not set. Set SUPABASE_SERVICE_ROLE_KEY in Vercel to create member accounts.' }, { status: 501 });
  if (!email || !password) return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return NextResponse.json({ error: error?.message || 'Could not create the account.' }, { status: 400 });
  await admin.from('profiles').upsert({ id: data.user.id, email, role: 'member', status: 'active', password_set: true });
  if (premiumUntil) {
    await admin.from('access_grants').insert({ user_id: data.user.id, scope: 'full_library', access_type: 'time_limited', expires_at: premiumUntil, is_active: true });
  } else {
    await admin.from('access_grants').insert({ user_id: data.user.id, scope: 'full_library', access_type: 'lifetime', expires_at: null, is_active: true });
  }
  return NextResponse.json({ ok: true, userId: data.user.id });
}
