'use client';
import { useCallback, useEffect, useState } from 'react';
import { BRAND, OWNER_EMAIL, PERMISSIONS, generatePassword, hasPermission, isOwner, slugify, type Category, type Permission, type Profile, type Report, type Skill, type SiteSettings, type Tutorial, type ActivityLog } from '@skillsbhandar/shared';
import { getClient, getProfile, loadAll, logActivity } from '../lib/data';
import Editors from '../components/Editors';
import { Icon, type IconName } from '../components/icons';

type Data = Awaited<ReturnType<typeof loadAll>>;
const SECTIONS: { id: string; label: string; perm: Permission; icon: IconName }[] = [
  { id: 'overview', label: 'Overview', perm: 'Overview', icon: 'grid' },
  { id: 'members', label: 'Member Logins', perm: 'Member Logins', icon: 'users' },
  { id: 'users', label: 'Users & Access', perm: 'Users & Access', icon: 'shield' },
  { id: 'subadmins', label: 'Sub-Admins', perm: 'Sub-Admins', icon: 'users' },
  { id: 'skills', label: 'Skills', perm: 'Skills', icon: 'book' },
  { id: 'categories', label: 'Categories', perm: 'Categories', icon: 'layout' },
  { id: 'tutorials', label: 'Tutorials', perm: 'Tutorials', icon: 'play' },
  { id: 'content', label: 'Website Content', perm: 'Website Content', icon: 'pen' },
  { id: 'reports', label: 'Reports', perm: 'Reports', icon: 'flag' },
  { id: 'activity', label: 'Activity Log', perm: 'Activity Log', icon: 'activity' },
];

export default function AdminApp() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [section, setSection] = useState('overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [msg, setMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  const refresh = useCallback(async () => {
    const sb = getClient();
    if (!sb) return;
    setData(await loadAll(sb));
  }, []);

  useEffect(() => {
    const sb = getClient();
    if (!sb) { setLoading(false); return; }
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const p = await getProfile(sb, session.user.id);
        if (p && (p.role === 'owner' || p.role === 'admin' || p.role === 'editor')) {
          setProfile(p);
          await refresh();
        } else {
          await sb.auth.signOut();
          setMsg('Member accounts cannot sign in to Admin. Only owner, admin and editor accounts can.');
        }
      }
      setLoading(false);
    });
  }, [refresh]);

  const signIn = async () => {
    const sb = getClient();
    if (!sb) { setMsg('Supabase is not connected yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.'); return; }
    if (!email || !password) { setMsg('ইমেইল ও পাসওয়ার্ড দুটোই লিখুন।'); return; }
    setBusy(true); setMsg(''); setOkMsg('');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      // Show the real reason in plain language — never a silent failure.
      // "Email not confirmed" = Supabase email confirmation is ON.
      // "Invalid login credentials" + owner email = no owner account yet.
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setMsg('ইমেইল কনফার্ম করা হয়নি। Supabase-এ Authentication → Providers → Email-এ গিয়ে "Confirm email" বন্ধ করুন, অথবা আপনার ইমেইলে পাঠানো কনফার্ম লিংকে ক্লিক করুন, তারপর আবার সাইন ইন করুন।');
      } else if (email.trim().toLowerCase() === OWNER_EMAIL) {
        setShowSetup(true);
        setMsg(`সাইন ইন হয়নি: ${error.message} — মালিকের অ্যাকাউন্ট এখনো তৈরি হয়নি। নিচে একবার পাসওয়ার্ড সেট করুন।`);
      } else {
        setMsg(`সাইন ইন হয়নি: ${error.message}`);
      }
      setBusy(false);
      return;
    }
    if (!data.user) { setBusy(false); return; }
    let p = await getProfile(sb, data.user.id);
    if (!p && email.trim().toLowerCase() === OWNER_EMAIL) {
      // Auth worked but the profile row is missing (the old RLS bug).
      // Repair it through the server route, then try again.
      try {
        const res = await fetch('/api/owner-setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
        if (res.ok) p = await getProfile(sb, data.user.id);
        else {
          const body = await res.json() as { error?: string };
          setMsg(body.error || 'Profile row is missing. Run supabase/migrations/003_owner_profile.sql in Supabase and try again.');
        }
      } catch { setMsg('Profile row is missing. Run supabase/migrations/003_owner_profile.sql in Supabase and try again.'); }
    }
    if (!p || (p.role !== 'owner' && p.role !== 'admin' && p.role !== 'editor')) {
      await sb.auth.signOut();
      setMsg('এই অ্যাকাউন্টের অ্যাডমিনে ঢোকার অনুমতি নেই। Member অ্যাকাউন্ট দিয়ে Admin-এ সাইন ইন করা যায় না — শুধু owner, admin ও editor পারবে।');
      setBusy(false);
      return;
    }
    setProfile(p);
    setBusy(false);
    await refresh();
  };

  const setupOwner = async () => {
    const sb = getClient();
    if (!sb) return;
    if (newPass.length < 8) { setMsg('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।'); return; }
    if (newPass !== newPass2) { setMsg('দুইবার একই পাসওয়ার্ড লিখুন।'); return; }
    setBusy(true); setMsg(''); setOkMsg('');
    // 1) Server route first: creates a CONFIRMED owner user + profile row.
    //    This cannot fail under RLS and needs no email confirmation.
    try {
      const res = await fetch('/api/owner-setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPass }) });
      const body = await res.json() as { ok?: boolean; error?: string };
      if (res.ok) {
        setShowSetup(false); setBusy(false);
        setOkMsg('মালিকের পাসওয়ার্ড সেট হয়েছে। এবার ওই পাসওয়ার্ড দিয়ে সাইন ইন করুন।');
        return;
      }
      if (res.status !== 501) { setMsg(body.error || 'Owner account could not be created.'); setBusy(false); return; }
      // 2) No service key in Vercel (501): fall back to client sign-up.
      setMsg('সার্ভার সেটআপ উপলব্ধ নয় (service key সেট করা নেই) — সরাসরি সেটআপ চেষ্টা করছি…');
    } catch { setMsg('সার্ভার সেটআপে পৌঁছানো যায়নি — সরাসরি সেটআপ চেষ্টা করছি…'); }
    const { data, error } = await sb.auth.signUp({ email: OWNER_EMAIL, password: newPass });
    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
        setMsg('মালিকের অ্যাকাউন্ট আগেই তৈরি হয়েছে। পাসওয়ার্ড মনে না থাকলে "পাসওয়ার্ড ভুলে গেছেন?" চাপুন, অথবা নিচের "অ্যাডমিন রিসেট করুন" চাপুন।');
      } else {
        setMsg(`Owner account could not be created: ${error.message}`);
      }
      setBusy(false);
      return;
    }
    if (!data.user) { setMsg('Owner account could not be created.'); setBusy(false); return; }
    if (!data.session) {
      // Account created but email confirmation is ON — sign-in will fail.
      setMsg('অ্যাকাউন্ট তৈরি হয়েছে, কিন্তু ইমেইল কনফার্ম করতে হবে। Supabase-এ Authentication → Providers → Email-এ গিয়ে "Confirm email" বন্ধ করুন, অথবা আপনার ইমেইলে পাঠানো লিংকে ক্লিক করুন, তারপর সাইন ইন করুন।');
      setBusy(false);
      return;
    }
    const { error: upsertError } = await sb.from('profiles').upsert({ id: data.user.id, email: OWNER_EMAIL, role: 'owner', status: 'active', password_set: true, permissions: [...PERMISSIONS] });
    if (upsertError) {
      setMsg(`Profile could not be saved: ${upsertError.message}. Run supabase/migrations/003_owner_profile.sql in the Supabase SQL Editor and try again.`);
      setBusy(false);
      return;
    }
    setShowSetup(false); setBusy(false);
    setOkMsg('মালিকের পাসওয়ার্ড সেট হয়েছে। এবার ওই পাসওয়ার্ড দিয়ে সাইন ইন করুন।');
  };

  const forgotPassword = async () => {
    const sb = getClient();
    if (!sb) return;
    if (!email) { setMsg('প্রথমে উপরে আপনার ইমেইল লিখুন, তারপর "পাসওয়ার্ড ভুলে গেছেন?" চাপুন।'); return; }
    setBusy(true); setMsg(''); setOkMsg('');
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined });
    setBusy(false);
    if (error) { setMsg(`রিসেট ইমেইল পাঠানো যায়নি: ${error.message}`); return; }
    setOkMsg('পাসওয়ার্ড রিসেটের লিংক আপনার ইমেইলে পাঠানো হয়েছে। ইমেইল খুলে লিংকে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।');
  };

  const resetAdmin = async () => {
    if (!confirm('অ্যাডমিন রিসেট করবেন? মালিকের লগইন মুছে যাবে, আর একবার পাসওয়ার্ড সেট করতে হবে। স্কিল, ক্যাটাগরি, টিউটোরিয়াল বা মেম্বার মুছবে না।')) return;
    setBusy(true); setMsg(''); setOkMsg('');
    try {
      const res = await fetch('/api/owner-reset', { method: 'POST' });
      const body = await res.json() as { ok?: boolean; error?: string };
      setBusy(false);
      if (!res.ok) { setMsg(body.error || 'Admin reset failed.'); return; }
      setShowSetup(true);
      setOkMsg('অ্যাডমিন রিসেট হয়েছে। এবার নতুন মালিকের পাসওয়ার্ড সেট করুন।');
    } catch { setBusy(false); setMsg('Admin reset failed — check your connection and try again.'); }
  };

  const signOut = async () => {
    const sb = getClient();
    if (sb) await sb.auth.signOut();
    setProfile(null); setData(null);
  };

  if (loading) {
    return (
      <div className="auth-wrap">
        <p className="muted">Loading SkillsBhandar Admin…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="logo"><span className="logo-mark">S</span>{BRAND} Admin</div>
          <p className="muted" style={{ textAlign: 'center', margin: '8px 0 0' }}>Admin only. Member accounts are refused here.</p>
          {!getClient() && <p className="error" style={{ textAlign: 'center' }}>Supabase is not connected yet. Set the env vars in Vercel first.</p>}
          {showSetup ? (
            <div>
              <h2 style={{ margin: '18px 0 4px', fontSize: 18 }}>Set your owner password (one time only)</h2>
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>Minimum 8 characters, typed twice. After this, the setup form never appears again.</p>
              <div className="field"><label>New password</label><input className="input" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} /></div>
              <div className="field"><label>Type it again</label><input className="input" type="password" value={newPass2} onChange={(e) => setNewPass2(e.target.value)} /></div>
              <button className="btn" disabled={busy} style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={setupOwner}>{busy ? 'সেট হচ্ছে…' : 'Set owner password'}</button>
              <button className="btn-ghost" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }} onClick={() => setShowSetup(false)}>Back to sign-in</button>
            </div>
          ) : (
            <div>
              <div className="field"><label>ইমেইল</label><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@skillsbhandar.com" /></div>
              <div className="field"><label>পাসওয়ার্ড</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') signIn(); }} /></div>
              <button className="btn" disabled={busy} style={{ marginTop: 18, width: '100%', justifyContent: 'center' }} onClick={signIn}>{busy ? 'সাইন ইন হচ্ছে…' : 'সাইন ইন'}</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <button className="btn-ghost" disabled={busy} style={{ width: '100%', justifyContent: 'center' }} onClick={forgotPassword}>পাসওয়ার্ড ভুলে গেছেন?</button>
                <button className="btn-ghost" disabled={busy} style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setShowSetup(true); setMsg(''); setOkMsg(''); }}>প্রথমবার? মালিকের পাসওয়ার্ড সেট করুন</button>
                <button className="btn-ghost" disabled={busy} style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(239,68,68,.45)' }} onClick={resetAdmin}>অ্যাডমিন রিসেট করুন (লগইন করতে না পারলে)</button>
              </div>
              <p className="muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 14 }}>
                লগইন করতে না পারলে: প্রথমে "অ্যাডমিন রিসেট করুন" চাপুন, তারপর নতুন পাসওয়ার্ড সেট করুন। এতে স্কিল বা মেম্বার মুছবে না।
              </p>
            </div>
          )}
          {msg && <p className="error" style={{ textAlign: 'center' }}>{msg}</p>}
          {okMsg && <p className="ok-msg" style={{ textAlign: 'center' }}>{okMsg}</p>}
        </div>
      </div>
    );
  }

  const visible = SECTIONS.filter((s) => hasPermission(profile, s.perm));
  const current = SECTIONS.find((s) => s.id === section) || SECTIONS[0];
  const sb = getClient();
  return (
    <div className="shell">
      {/* Mobile: top bar with hamburger — without this the admin sidebar
          could not be opened on a phone at all. */}
      <div className="mobile-bar">
        <span className="logo"><span className="logo-mark">S</span>{BRAND} Admin</span>
        <button className="icon-btn" onClick={() => setNavOpen(true)} aria-label="মেনু খুলুন">
          <Icon name="menu" size={20} />
        </button>
      </div>
      {navOpen && <div className="sidebar-backdrop" onClick={() => setNavOpen(false)} />}
      <aside className={`sidebar${navOpen ? ' open' : ''}`}>
        <div className="logo"><span className="logo-mark">S</span>{BRAND} Admin</div>
        <nav className="nav">
          <div className="nav-label">Admin</div>
          {visible.map((s) => (
            <button
              key={s.id}
              className={`nav-item${section === s.id ? ' active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer' }}
              onClick={() => { setSection(s.id); setNavOpen(false); }}
            >
              <Icon name={s.icon} size={18} />
              {s.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <strong style={{ fontSize: 13 }}>{profile.email}</strong>
          <p className="muted" style={{ margin: '4px 0 10px', fontSize: 13, textTransform: 'capitalize' }}>{profile.role}</p>
          <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={signOut}>সাইন আউট</button>
        </div>
      </aside>
      <div className="content">
        <header className="topbar">
          <span className="crumb">{current.label}</span>
          <div className="topbar-actions">
            <span className="pill">{profile.role}</span>
          </div>
        </header>
        <main className="main">
          {msg && <p className="muted">{msg}</p>}
          {section === 'overview' && data && <Overview data={data} profile={profile} onReset={refresh} />}
          {section === 'members' && data && <Members data={data} profile={profile} onDone={refresh} />}
          {section === 'users' && data && sb && <Users data={data} profile={profile} sb={sb} onDone={refresh} />}
          {section === 'subadmins' && data && sb && <SubAdmins data={data} profile={profile} sb={sb} onDone={refresh} />}
          {(section === 'skills' || section === 'categories' || section === 'tutorials' || section === 'content' || section === 'reports' || section === 'activity') && data && sb && (
            <Editors section={section} data={data} profile={profile} sb={sb} onDone={refresh} />
          )}
        </main>
      </div>
    </div>
  );
}

function Overview({ data, profile, onReset }: { data: Data; profile: Profile; onReset: () => void }) {
  const [msg, setMsg] = useState('');
  const reset = async () => {
    if (!confirm('Start from zero? This deletes all skills, tutorials, downloads and reports. Accounts are kept.')) return;
    const res = await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerEmail: profile.email }) });
    const body = await res.json() as { error?: string };
    if (!res.ok) { setMsg(body.error || 'Reset failed.'); return; }
    setMsg('Reset done — library is back to zero with the 8 main categories.');
    onReset();
  };
  const members = data.profiles.filter((p) => p.role === 'member');
  const staff = data.profiles.filter((p) => p.role === 'admin' || p.role === 'editor' || p.role === 'owner');
  return (
    <div>
      <div className="page-head">
        <h1>Overview</h1>
        <p className="muted">Your whole library at a glance.</p>
      </div>
      <div className="stat-grid" style={{ marginTop: 20 }}>
        <Stat label="Skills" value={data.skills.length} icon="book" />
        <Stat label="Published skills" value={data.skills.filter((s) => s.status === 'published').length} icon="sparkles" />
        <Stat label="Categories" value={data.categories.length} icon="layout" />
        <Stat label="Tutorials" value={data.tutorials.length} icon="play" />
        <Stat label="Members" value={members.length} icon="users" />
        <Stat label="Staff" value={staff.length} icon="shield" />
        <Stat label="Downloads" value={data.skills.reduce((n, s) => n + s.download_count, 0)} icon="download" />
        <Stat label="Reports open" value={data.reports.filter((r) => r.status === 'open').length} icon="flag" />
      </div>

      <div className="section">
        <div className="section-head"><h2>Recently added skills</h2></div>
        {data.skills.length === 0 ? <div className="empty">No skills yet — 0 skills in the library.</div> : data.skills.slice(0, 5).map((s) => (
          <div key={s.id} className="row-card">
            <span className="row-icon"><Icon name="book" size={19} /></span>
            <span className="row-body"><b>{s.title}</b><span>{s.status} · {s.download_count} downloads</span></span>
            <span className={`pill ${s.status === 'published' ? 'pill-green' : 'pill-grey'}`}>{s.status}</span>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head"><h2>Recent activity</h2></div>
        {data.logs.length === 0 ? <div className="empty">No activity yet.</div> : data.logs.slice(0, 6).map((l) => (
          <div key={l.id} className="row-card">
            <span className="row-icon"><Icon name="activity" size={19} /></span>
            <span className="row-body"><b>{l.action}</b><span>{l.target_type} {l.target_id}</span></span>
            <span className="muted" style={{ fontSize: 13 }}>{new Date(l.created_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>

      {isOwner(profile) && (
        <div className="card" style={{ padding: 20, marginTop: 28, borderColor: 'rgba(239,68,68,.4)' }}>
          <strong>Owner only — Start from zero</strong>
          <p className="muted">Deletes all skills, tutorials, downloads and reports. Accounts and access are kept. The 8 main categories are restored.</p>
          <button className="btn-ghost" onClick={reset}>Start from zero</button>
          {msg && <p>{msg}</p>}
        </div>
      )}
    </div>
  );
}
function Stat({ label, value, icon }: { label: string; value: number; icon: IconName }) {
  return (
    <div className="stat-card">
      <span className="stat-icon"><Icon name={icon} size={19} /></span>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function statusPill(status: string) {
  if (status === 'active') return 'pill-green';
  if (status === 'suspended') return 'pill-amber';
  return 'pill-grey';
}

function Members({ data, profile, onDone }: { data: Data; profile: Profile; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [premium, setPremium] = useState('');
  const [generated, setGenerated] = useState('');
  const [msg, setMsg] = useState('');
  const create = async () => {
    if (!email) { setMsg('Type an email first.'); return; }
    const pass = generatePassword();
    const res = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass, premiumUntil: premium || null }) });
    const body = await res.json() as { error?: string };
    if (!res.ok) { setMsg(body.error || 'Could not create the member.'); return; }
    setGenerated(pass);
    setMsg(`Member ${email} created. The password below is shown ONCE — copy it now and send it to the member.`);
    onDone();
  };
  const members = data.profiles.filter((p) => p.role === 'member');
  return (
    <div>
      <div className="page-head">
        <h1>Member Logins</h1>
        <p className="muted">Create a login for a member by email. The password is shown once.</p>
      </div>
      <div className="card" style={{ padding: 20, maxWidth: 520, marginTop: 20 }}>
        <div className="field" style={{ marginTop: 0 }}><label>Member email</label><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" /></div>
        <div className="field"><label>Premium until (optional)</label><input className="input" type="date" value={premium} onChange={(e) => setPremium(e.target.value)} /></div>
        <button className="btn" style={{ marginTop: 16 }} onClick={create}>Create member + generate password</button>
        {generated && (
          <div style={{ marginTop: 14, background: 'var(--accent-soft)', border: '1px solid rgba(124,92,255,.35)', borderRadius: 10, padding: 12 }}>
            <strong>Password (shown once): {generated}</strong>{' '}
            <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(generated)}>Copy</button>
          </div>
        )}
        {msg && <p>{msg}</p>}
      </div>
      <div className="section">
        <div className="section-head"><h2>Members ({members.length})</h2></div>
        {members.length === 0 ? <div className="empty">No members yet.</div> : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Email</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {members.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.email}</strong></td>
                    <td><span className={`pill ${statusPill(p.status)}`}>{p.status}</span></td>
                    <td className="muted">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Users({ data, profile, sb, onDone }: { data: Data; profile: Profile; sb: NonNullable<ReturnType<typeof getClient>>; onDone: () => void }) {
  const [msg, setMsg] = useState('');
  const act = async (p: Profile, action: string) => {
    if (action === 'suspend') await sb.from('profiles').update({ status: 'suspended' }).eq('id', p.id);
    if (action === 'reactivate') await sb.from('profiles').update({ status: 'active' }).eq('id', p.id);
    if (action === 'revoke') await sb.from('profiles').update({ role: 'revoked' }).eq('id', p.id);
    if (action === 'delete') {
      if (!confirm(`Delete ${p.email}? This removes the account.`)) return;
      await sb.from('profiles').delete().eq('id', p.id);
    }
    if (action === 'grant') await sb.from('access_grants').insert({ user_id: p.id, scope: 'full_library', access_type: 'lifetime', is_active: true });
    if (action === 'remove-access') await sb.from('access_grants').update({ is_active: false, revoked_at: new Date().toISOString() }).eq('user_id', p.id).eq('is_active', true);
    await logActivity(sb, profile.id, action, 'profile', p.id);
    setMsg(`${action} done for ${p.email}.`);
    onDone();
  };
  const setRole = async (p: Profile, role: string) => {
    if ((role === 'admin' || role === 'editor') && !isOwner(profile)) { setMsg('Only the owner can hand out Admin/Editor roles.'); return; }
    await sb.from('profiles').update({ role }).eq('id', p.id);
    await logActivity(sb, profile.id, `role:${role}`, 'profile', p.id);
    onDone();
  };
  return (
    <div>
      <div className="page-head">
        <h1>Users &amp; Access</h1>
        <p className="muted">Revoking access does NOT delete the account.</p>
      </div>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      {data.profiles.length === 0 ? <div className="empty" style={{ marginTop: 20 }}>No users yet.</div> : (
        <div style={{ marginTop: 20 }}>
          {data.profiles.map((p) => (
            <div key={p.id} className="card" style={{ padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong>{p.email}</strong>
                <span className="pill">{p.role}</span>
                <span className={`pill ${statusPill(p.status)}`}>{p.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => act(p, 'grant')}>Grant full access</button>
                <button className="btn-ghost" onClick={() => act(p, 'remove-access')}>Remove access</button>
                <button className="btn-ghost" onClick={() => act(p, p.status === 'suspended' ? 'reactivate' : 'suspend')}>{p.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>
                <button className="btn-ghost" onClick={() => act(p, 'revoke')}>Revoke</button>
                <select className="input" style={{ width: 140 }} value={p.role} onChange={(e) => setRole(p, e.target.value)}>
                  <option value="member">member</option><option value="editor">editor</option><option value="admin">admin</option><option value="revoked">revoked</option>
                </select>
                <button className="btn-ghost" onClick={() => act(p, 'delete')}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubAdmins({ data, profile, sb, onDone }: { data: Data; profile: Profile; sb: NonNullable<ReturnType<typeof getClient>>; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [perms, setPerms] = useState<string[]>(['Overview', 'Skills']);
  const [generated, setGenerated] = useState('');
  const [msg, setMsg] = useState('');
  if (!isOwner(profile)) return <p>Only the owner can manage Sub-Admins.</p>;
  const toggle = (perm: string) => setPerms(perms.includes(perm) ? perms.filter((x) => x !== perm) : [...perms, perm]);
  const create = async () => {
    if (!email) { setMsg('Type an email first.'); return; }
    const pass = generatePassword();
    const res = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) });
    const body = await res.json() as { error?: string; userId?: string };
    if (!res.ok || !body.userId) { setMsg(body.error || 'Could not create the sub-admin.'); return; }
    await sb.from('profiles').update({ role: 'admin', permissions: perms }).eq('id', body.userId);
    await logActivity(sb, profile.id, 'sub-admin created', 'profile', body.userId);
    setGenerated(pass);
    setMsg(`Sub-admin ${email} created. Password shown ONCE — copy it now.`);
    onDone();
  };
  const staff = data.profiles.filter((p) => p.role === 'admin' || p.role === 'editor');
  return (
    <div>
      <div className="page-head">
        <h1>Sub-Admins</h1>
        <p className="muted">Give a person limited admin access. Removing it makes them a normal member again — the account is not deleted.</p>
      </div>
      <div className="card" style={{ padding: 20, maxWidth: 560, marginTop: 20 }}>
        <div className="field" style={{ marginTop: 0 }}><label>Sub-admin email</label><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" /></div>
        <p style={{ marginTop: 16, marginBottom: 8 }}><strong>Permissions</strong></p>
        {PERMISSIONS.map((perm) => (
          <label key={perm} className="card" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', marginBottom: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={perms.includes(perm)} disabled={perm === 'Sub-Admins'} onChange={() => toggle(perm)} style={{ width: 18, height: 18, accentColor: '#7c5cff' }} />
            <span>{perm}</span>
            {perm === 'Sub-Admins' && <span className="muted" style={{ fontSize: 13 }}>(only the owner can grant this)</span>}
          </label>
        ))}
        <button className="btn" style={{ marginTop: 14 }} onClick={create}>Create sub-admin + generate password</button>
        {generated && (
          <div style={{ marginTop: 14, background: 'var(--accent-soft)', border: '1px solid rgba(124,92,255,.35)', borderRadius: 10, padding: 12 }}>
            <strong>Password (shown once): {generated}</strong>
          </div>
        )}
        {msg && <p>{msg}</p>}
      </div>
      <div className="section">
        <div className="section-head"><h2>Current staff</h2></div>
        {staff.length === 0 ? <div className="empty">No sub-admins yet.</div> : staff.map((p) => (
          <div key={p.id} className="card" style={{ padding: 16, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{p.email}</strong>
              <span className="pill">{p.role}</span>
            </div>
            <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>{(p.permissions || []).join(', ') || 'no permissions'}</p>
            <button className="btn-ghost" style={{ marginTop: 12 }} onClick={async () => { await sb.from('profiles').update({ role: 'member', permissions: [] }).eq('id', p.id); onDone(); }}>Remove sub-admin access</button>
          </div>
        ))}
      </div>
    </div>
  );
}
