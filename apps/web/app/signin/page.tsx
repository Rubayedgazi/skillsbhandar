'use client';
import { useState } from 'react';
import { createSupabaseClient, BRAND } from '@skillsbhandar/shared';

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
    if (error) { setMsg(`সাইন ইন হয়নি: ${error.message}`); return; }
    setOk(true);
    setMsg('সাইন ইন হয়েছে।');
  };
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo"><span className="logo-mark">S</span>{BRAND}</div>
        <h1 style={{ textAlign: 'center', margin: '10px 0 4px', fontSize: 24 }}>সাইন ইন</h1>
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>শুধু অ্যাডমিনের তৈরি করা অ্যাকাউন্ট দিয়ে সাইন ইন করা যায়। নিজে অ্যাকাউন্ট খোলা যায় না।</p>
        <div className="field"><label>ইমেইল</label><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <div className="field"><label>পাসওয়ার্ড</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }} onClick={submit}>সাইন ইন</button>
        {msg && <p className={ok ? 'ok-msg' : 'error'} style={{ textAlign: 'center' }}>{msg}</p>}
      </div>
    </div>
  );
}
