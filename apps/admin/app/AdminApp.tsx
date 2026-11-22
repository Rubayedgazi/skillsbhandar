'use client';
import { useCallback, useEffect, useState } from 'react';
import { BRAND, OWNER_EMAIL, PERMISSIONS, generatePassword, hasPermission, isOwner, slugify, type Category, type Permission, type Profile, type Report, type Skill, type SiteSettings, type Tutorial, type ActivityLog } from '@skillsbhandar/shared';
import { getClient, getProfile, loadAll, logActivity } from '../lib/data';
import Editors from '../components/Editors';

type Data = Awaited<ReturnType<typeof loadAll>>;
const SECTIONS: { id: string; label: string; perm: Permission }[] = [
  { id: 'overview', label: 'Overview', perm: 'Overview' },
  { id: 'members', label: 'Member Logins', perm: 'Member Logins' },
  { id: 'users', label: 'Users & Access', perm: 'Users & Access' },
  { id: 'subadmins', label: 'Sub-Admins', perm: 'Sub-Admins' },
  { id: 'skills', label: 'Skills', perm: 'Skills' },
  { id: 'categories', label: 'Categories', perm: 'Categories' },
  { id: 'tutorials', label: 'Tutorials', perm: 'Tutorials' },
  { id: 'content', label: 'Website Content', perm: 'Website Content' },
  { id: 'reports', label: 'Reports', perm: 'Reports' },
  { id: 'activity', label: 'Activity Log', perm: 'Activity Log' },
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
  const [loading, setLoading] = useState(true);

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
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      // Owner first sign-in: no account yet -> offer the one-time setup form.
      if (email === OWNER_EMAIL) { setShowSetup(true); setMsg(''); }
      else setMsg('ভুল ইমেইল বা পাসওয়ার্ড।');
      return;
    }
    if (!data.user) return;
    const p = await getProfile(sb, data.user.id);
    if (!p || (p.role !== 'owner' && p.role !== 'admin' && p.role !== 'editor')) {
      await sb.auth.signOut();
      setMsg('Member accounts cannot sign in to Admin.');
      return;
    }
    setProfile(p);
    await refresh();
  };

  const setupOwner = async () => {
    const sb = getClient();
    if (!sb) return;
    if (newPass.length < 8) { setMsg('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।'); return; }
    if (newPass !== newPass2) { setMsg('দুইবার একই পাসওয়ার্ড লিখুন।'); return; }
    const { data, error } = await sb.auth.signUp({ email: OWNER_EMAIL, password: newPass });
    if (error || !data.user) { setMsg(error?.message || 'Owner account could not be created. In Supabase Auth settings, turn off email confirmation for this project.'); return; }
    await sb.from('profiles').upsert({ id: data.user.id, email: OWNER_EMAIL, role: 'owner', status: 'active', password_set: true, permissions: [...PERMISSIONS] });
    setShowSetup(false);
    setMsg('Owner password set. Now sign in with it.');
  };

  const signOut = async () => {
    const sb = getClient();
    if (sb) await sb.auth.signOut();
    setProfile(null); setData(null);
  };

  if (loading) return <p style={{ padding: 40 }}>Loading SkillsBhandar Admin…</p>;

  if (!profile) {
    return (
      <div className="card" style={{ maxWidth: 440, margin: '60px auto', padding: 28 }}>
        <h1 style={{ marginTop: 0 }}>{BRAND} Admin</h1>
        <p className="muted">Admin only. Member accounts are refused here.</p>
        {!getClient() && <p style={{ color: 'red' }}>Supabase is not connected yet. Set the env vars in Vercel first.</p>}
        {showSetup ? (
          <div>
            <p><strong>Set your owner password (one time only)</strong></p>
            <p className="muted">Minimum 8 characters, typed twice. After this, the setup form never appears again.</p>
            <input className="input" type="password" placeholder="New password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            <input className="input" type="password" placeholder="Type it again" value={newPass2} onChange={(e) => setNewPass2(e.target.value)} style={{ marginTop: 8 }} />
            <button className="btn" style={{ marginTop: 12, width: '100%' }} onClick={setupOwner}>Set owner password</button>
            <button className="btn-ghost" style={{ marginTop: 8, width: '100%' }} onClick={() => setShowSetup(false)}>Back to sign-in</button>
          </div>
        ) : (
          <div>
            <label>ইমেইল<input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@skillsbhandar.com" /></label>
            <label style={{ display: 'block', marginTop: 12 }}>পাসওয়ার্ড<input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <button className="btn" style={{ marginTop: 16, width: '100%' }} onClick={signIn}>সাইন ইন</button>
          </div>
        )}
        {msg && <p style={{ color: 'red' }}>{msg}</p>}
      </div>
    );
  }

  const visible = SECTIONS.filter((s) => hasPermission(profile, s.perm));
  const sb = getClient();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', padding: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{BRAND} Admin</div>
        <p className="muted" style={{ fontSize: 13 }}>{profile.email} · {profile.role}</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 20 }}>
          {visible.map((s) => (
            <button key={s.id} className="btn-ghost" style={{ textAlign: 'left', background: section === s.id ? 'var(--surface3)' : undefined }} onClick={() => setSection(s.id)}>{s.label}</button>
          ))}
        </nav>
        <button className="btn-ghost" style={{ marginTop: 20, width: '100%' }} onClick={signOut}>সাইন আউট</button>
      </aside>
      <main style={{ flex: 1, padding: 24, minWidth: 0 }}>
        {msg && <p>{msg}</p>}
        {section === 'overview' && data && <Overview data={data} profile={profile} onReset={refresh} />}
        {section === 'members' && data && <Members data={data} profile={profile} onDone={refresh} />}
        {section === 'users' && data && sb && <Users data={data} profile={profile} sb={sb} onDone={refresh} />}
        {section === 'subadmins' && data && sb && <SubAdmins data={data} profile={profile} sb={sb} onDone={refresh} />}
        {(section === 'skills' || section === 'categories' || section === 'tutorials' || section === 'content' || section === 'reports' || section === 'activity') && data && sb && (
          <Editors section={section} data={data} profile={profile} sb={sb} onDone={refresh} />
        )}
      </main>
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
  return (
    <div>
      <h1>Overview</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
        <Stat label="Skills" value={data.skills.length} />
        <Stat label="Published skills" value={data.skills.filter((s) => s.status === 'published').length} />
        <Stat label="Categories" value={data.categories.length} />
        <Stat label="Tutorials" value={data.tutorials.length} />
        <Stat label="Members" value={data.profiles.filter((p) => p.role === 'member').length} />
        <Stat label="Downloads" value={data.skills.reduce((n, s) => n + s.download_count, 0)} />
        <Stat label="Reports open" value={data.reports.filter((r) => r.status === 'open').length} />
      </div>
      {isOwner(profile) && (
        <div className="card" style={{ padding: 16, marginTop: 20 }}>
          <strong>Owner only — Start from zero</strong>
          <p className="muted">Deletes all skills, tutorials, downloads and reports. Accounts and access are kept. The 8 main categories are restored.</p>
          <button className="btn-ghost" onClick={reset}>Start from zero</button>
          {msg && <p>{msg}</p>}
        </div>
      )}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div><div className="muted">{label}</div></div>;
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
  return (
    <div>
      <h1>Member Logins</h1>
      <div className="card" style={{ padding: 16, maxWidth: 480 }}>
        <label>Member email<input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" /></label>
        <label style={{ display: 'block', marginTop: 10 }}>Premium until (optional)<input className="input" type="date" value={premium} onChange={(e) => setPremium(e.target.value)} /></label>
        <button className="btn" style={{ marginTop: 12 }} onClick={create}>Create member + generate password</button>
        {generated && <p><strong>Password (shown once): {generated}</strong> <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(generated)}>Copy</button></p>}
        {msg && <p>{msg}</p>}
      </div>
      <h2 style={{ marginTop: 24 }}>Members ({data.profiles.filter((p) => p.role === 'member').length})</h2>
      {data.profiles.filter((p) => p.role === 'member').map((p) => <p key={p.id}>{p.email} — {p.status}</p>)}
      {data.profiles.filter((p) => p.role === 'member').length === 0 && <p className="muted">No members yet.</p>}
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
      <h1>Users &amp; Access</h1>
      <p className="muted">Revoking access does NOT delete the account.</p>
      {msg && <p>{msg}</p>}
      {data.profiles.map((p) => (
        <div key={p.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
          <strong>{p.email}</strong> <span className="muted">— {p.role} · {p.status}</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <button className="btn-ghost" onClick={() => act(p, 'grant')}>Grant full access</button>
            <button className="btn-ghost" onClick={() => act(p, 'remove-access')}>Remove access</button>
            <button className="btn-ghost" onClick={() => act(p, p.status === 'suspended' ? 'reactivate' : 'suspend')}>{p.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>
            <button className="btn-ghost" onClick={() => act(p, 'revoke')}>Revoke</button>
            <select className="input" style={{ width: 130 }} value={p.role} onChange={(e) => setRole(p, e.target.value)}>
              <option value="member">member</option><option value="editor">editor</option><option value="admin">admin</option><option value="revoked">revoked</option>
            </select>
            <button className="btn-ghost" onClick={() => act(p, 'delete')}>Delete</button>
          </div>
        </div>
      ))}
      {data.profiles.length === 0 && <p className="muted">No users yet.</p>}
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
      <h1>Sub-Admins</h1>
      <div className="card" style={{ padding: 16, maxWidth: 520 }}>
        <label>Sub-admin email<input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" /></label>
        <p style={{ marginTop: 12 }}><strong>Permissions</strong></p>
        {PERMISSIONS.map((perm) => (
          <label key={perm} style={{ display: 'block' }}>
            <input type="checkbox" checked={perms.includes(perm)} disabled={perm === 'Sub-Admins'} onChange={() => toggle(perm)} /> {perm}
            {perm === 'Sub-Admins' && <span className="muted"> (only the owner can grant this)</span>}
          </label>
        ))}
        <button className="btn" style={{ marginTop: 12 }} onClick={create}>Create sub-admin + generate password</button>
        {generated && <p><strong>Password (shown once): {generated}</strong></p>}
        {msg && <p>{msg}</p>}
      </div>
      <h2 style={{ marginTop: 24 }}>Current staff</h2>
      {staff.map((p) => (
        <div key={p.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
          <strong>{p.email}</strong> <span className="muted">— {p.role} · {(p.permissions || []).join(', ') || 'no permissions'}</span>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className="btn-ghost" onClick={async () => { await sb.from('profiles').update({ role: 'member', permissions: [] }).eq('id', p.id); onDone(); }}>Remove sub-admin access</button>
          </div>
        </div>
      ))}
      {staff.length === 0 && <p className="muted">No sub-admins yet.</p>}
    </div>
  );
}
