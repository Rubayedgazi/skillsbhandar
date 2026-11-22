'use client';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@skillsbhandar/shared';
import { Icon } from '../../components/icons';

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
      <div className="page-head">
        <h1>অ্যাকাউন্ট</h1>
        <p className="muted">আপনার অ্যাকাউন্টের তথ্য।</p>
      </div>
      <div style={{ marginTop: 20, maxWidth: 520 }}>
        {email ? (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="row-icon"><Icon name="user" size={19} /></span>
              <div><strong>ইমেইল</strong><p className="muted" style={{ margin: 0 }}>{email}</p></div>
            </div>
            <button className="btn-ghost" style={{ marginTop: 16 }} onClick={signOut}>সাইন আউট</button>
          </div>
        ) : (
          <div className="empty">আপনি সাইন ইন করেননি। <a href="/signin" style={{ color: 'var(--accent1)', fontWeight: 700 }}>সাইন ইন করুন</a>।</div>
        )}
      </div>
    </div>
  );
}
