'use client';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@skillsbhandar/shared';

export default function Account() {
  const [email, setEmail] = useState('');
  useEffect(() => {
    const sb = createSupabaseClient();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => setEmail(data.user?.email || ''));
  }, []);
  const signOut = async () => {
    const sb = createSupabaseClient();
    if (sb) await sb.auth.signOut();
    setEmail('');
  };
  return (
    <div>
      <h1>অ্যাকাউন্ট</h1>
      {email ? (
        <div className="card" style={{ padding: 18 }}>
          <p>ইমেইল: <strong>{email}</strong></p>
          <button className="btn-ghost" onClick={signOut}>সাইন আউট</button>
        </div>
      ) : (
        <p className="muted">আপনি সাইন ইন করেননি। <a href="/signin" style={{ color: 'var(--accent1)' }}>সাইন ইন করুন</a>।</p>
      )}
    </div>
  );
}
