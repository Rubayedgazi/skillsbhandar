'use client';
import { useState } from 'react';
import { createSupabaseClient } from '@skillsbhandar/shared';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const submit = async () => {
    const sb = createSupabaseClient();
    if (!sb) { setMsg('সার্ভার এখনো যুক্ত হয়নি — অ্যাডমিনকে Supabase সেটিংস দেখতে বলুন।'); return; }
    if (!email || !password) { setMsg('ইমেইল ও পাসওয়ার্ড দুটোই লিখুন।'); return; }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { setMsg('ভুল ইমেইল বা পাসওয়ার্ড।'); return; }
    setOk(true);
    setMsg('সাইন ইন হয়েছে।');
  };
  return (
    <div className="card" style={{ maxWidth: 420, margin: '40px auto', padding: 24 }}>
      <h1>সাইন ইন</h1>
      <p className="muted">শুধু অ্যাডমিনের তৈরি করা অ্যাকাউন্ট দিয়ে সাইন ইন করা যায়। নিজে অ্যাকাউন্ট খোলা যায় না।</p>
      <label>ইমেইল<input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label style={{ display: 'block', marginTop: 12 }}>পাসওয়ার্ড<input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button className="btn" style={{ marginTop: 16, width: '100%' }} onClick={submit}>সাইন ইন</button>
      {msg && <p style={{ color: ok ? 'green' : 'red' }}>{msg}</p>}
    </div>
  );
}
