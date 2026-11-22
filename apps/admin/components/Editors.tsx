'use client';
import { useState } from 'react';
import { MAIN_CATEGORIES, hasPermission, slugify, type Category, type Profile, type Skill, type Tutorial } from '@skillsbhandar/shared';
import { getClient, logActivity, loadAll } from '../lib/data';

type Data = Awaited<ReturnType<typeof loadAll>>;
type Sb = NonNullable<ReturnType<typeof getClient>>;

export default function Editors({ section, data, profile, sb, onDone }: { section: string; data: Data; profile: Profile; sb: Sb; onDone: () => void }) {
  if (section === 'skills') return <SkillsEditor data={data} profile={profile} sb={sb} onDone={onDone} />;
  if (section === 'categories') return <CategoriesEditor data={data} profile={profile} sb={sb} onDone={onDone} />;
  if (section === 'tutorials') return <TutorialsEditor data={data} profile={profile} sb={sb} onDone={onDone} />;
  if (section === 'content') return <ContentEditor data={data} profile={profile} sb={sb} onDone={onDone} />;
  if (section === 'reports') return <Reports data={data} sb={sb} onDone={onDone} />;
  return <Activity data={data} />;
}

function SkillsEditor({ data, profile, sb, onDone }: { data: Data; profile: Profile; sb: Sb; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [md, setMd] = useState('');
  const [cat, setCat] = useState('');
  const [msg, setMsg] = useState('');
  const save = async () => {
    if (!hasPermission(profile, 'Skills')) { setMsg('You do not have the Skills permission.'); return; }
    if (!title) { setMsg('Type a skill title first.'); return; }
    if (!cat) { setMsg('Create a category first, then pick it here.'); return; }
    const slug = slugify(title);
    const { data: created, error } = await sb.from('skills').insert({ title, slug, short_description: desc, overview: desc, skill_md: md, category_id: cat, status: 'draft' }).select().single();
    if (error) { setMsg(error.message); return; }
    await logActivity(sb, profile.id, 'skill created', 'skill', (created as Skill)?.id || slug);
    setTitle(''); setDesc(''); setMd('');
    setMsg('Skill saved as draft. Publish it below when ready.');
    onDone();
  };
  const publish = async (s: Skill, status: 'published' | 'draft') => {
    await sb.from('skills').update({ status, published_at: status === 'published' ? new Date().toISOString() : null }).eq('id', s.id);
    await logActivity(sb, profile.id, `skill ${status}`, 'skill', s.id);
    onDone();
  };
  const remove = async (s: Skill) => {
    if (!confirm(`Delete skill "${s.title}"?`)) return;
    await sb.from('skills').delete().eq('id', s.id);
    await logActivity(sb, profile.id, 'skill deleted', 'skill', s.id);
    onDone();
  };
  return (
    <div>
      <h1>Skills</h1>
      {data.categories.length === 0 && <p style={{ color: 'red' }}>Create a category first — a skill needs a category.</p>}
      <div className="card" style={{ padding: 16, maxWidth: 640 }}>
        <label>Title<input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label style={{ display: 'block', marginTop: 10 }}>Short description<input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
        <label style={{ display: 'block', marginTop: 10 }}>Category
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">— pick a category —</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label style={{ display: 'block', marginTop: 10 }}>SKILL.md content<textarea className="input" rows={6} value={md} onChange={(e) => setMd(e.target.value)} placeholder="# Skill name&#10;..." /></label>
        <button className="btn" style={{ marginTop: 12 }} onClick={save}>Save skill (draft)</button>
        {msg && <p>{msg}</p>}
      </div>
      <div style={{ marginTop: 20 }}>
        {data.skills.map((s) => (
          <div key={s.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
            <strong>{s.title}</strong> <span className="muted">— {s.status} · {s.download_count} downloads</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="btn-ghost" onClick={() => publish(s, s.status === 'published' ? 'draft' : 'published')}>{s.status === 'published' ? 'Unpublish' : 'Publish'}</button>
              <button className="btn-ghost" onClick={() => remove(s)}>Delete</button>
            </div>
          </div>
        ))}
        {data.skills.length === 0 && <p className="muted">No skills yet — 0 skills in the library.</p>}
      </div>
    </div>
  );
}

function CategoriesEditor({ data, profile, sb, onDone }: { data: Data; profile: Profile; sb: Sb; onDone: () => void }) {
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const add = async () => {
    if (!name) return;
    await sb.from('categories').insert({ name, slug: slugify(name), sort_order: data.categories.length + 1, is_published: true });
    await logActivity(sb, profile.id, 'category created', 'category', slugify(name));
    setName(''); onDone();
  };
  const restore = async () => {
    for (let i = 0; i < MAIN_CATEGORIES.length; i++) {
      await sb.from('categories').upsert({ name: MAIN_CATEGORIES[i].name, slug: MAIN_CATEGORIES[i].slug, sort_order: i + 1, is_published: true }, { onConflict: 'slug' });
    }
    setMsg('The 8 main categories are back.');
    onDone();
  };
  return (
    <div>
      <h1>Categories</h1>
      <div className="card" style={{ padding: 16, maxWidth: 480 }}>
        <label>New category<input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <button className="btn" style={{ marginTop: 10 }} onClick={add}>Add category</button>
        <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={restore}>Restore the 8 main categories</button>
        {msg && <p>{msg}</p>}
      </div>
      {data.categories.map((c: Category) => (
        <div key={c.id} className="card" style={{ padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span><strong>{c.name}</strong> <span className="muted">— {data.skills.filter((s) => s.category_id === c.id).length} skills</span></span>
          <button className="btn-ghost" onClick={async () => { if (confirm(`Delete category "${c.name}"?`)) { await sb.from('categories').delete().eq('id', c.id); onDone(); } }}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function TutorialsEditor({ data, profile, sb, onDone }: { data: Data; profile: Profile; sb: Sb; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [video, setVideo] = useState('');
  const [msg, setMsg] = useState('');
  const add = async () => {
    if (!title) { setMsg('Type a tutorial title first.'); return; }
    await sb.from('tutorials').insert({ title, slug: slugify(title), video_url: video, status: 'draft' });
    await logActivity(sb, profile.id, 'tutorial created', 'tutorial', slugify(title));
    setTitle(''); setVideo(''); onDone();
  };
  return (
    <div>
      <h1>Tutorials</h1>
      <div className="card" style={{ padding: 16, maxWidth: 520 }}>
        <label>Title<input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label style={{ display: 'block', marginTop: 10 }}>Video URL (YouTube embed)<input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://www.youtube.com/embed/..." /></label>
        <button className="btn" style={{ marginTop: 12 }} onClick={add}>Save tutorial (draft)</button>
        {msg && <p>{msg}</p>}
      </div>
      {data.tutorials.map((t: Tutorial) => (
        <div key={t.id} className="card" style={{ padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span><strong>{t.title}</strong> <span className="muted">— {t.status}</span></span>
          <span style={{ display: 'flex', gap: 6 }}>
            <button className="btn-ghost" onClick={async () => { await sb.from('tutorials').update({ status: t.status === 'published' ? 'draft' : 'published' }).eq('id', t.id); onDone(); }}>{t.status === 'published' ? 'Unpublish' : 'Publish'}</button>
            <button className="btn-ghost" onClick={async () => { await sb.from('tutorials').delete().eq('id', t.id); onDone(); }}>Delete</button>
          </span>
        </div>
      ))}
      {data.tutorials.length === 0 && <p className="muted">No tutorials yet.</p>}
    </div>
  );
}

function ContentEditor({ data, profile, sb, onDone }: { data: Data; profile: Profile; sb: Sb; onDone: () => void }) {
  const s = data.settings;
  const [hero, setHero] = useState(s?.hero_title || '');
  const [desc, setDesc] = useState(s?.hero_description || '');
  const [footer, setFooter] = useState(s?.footer_text || '');
  const [msg, setMsg] = useState('');
  const save = async () => {
    await sb.from('site_settings').upsert({ id: 1, hero_title: hero, hero_description: desc, footer_text: footer });
    await logActivity(sb, profile.id, 'website content updated', 'site_settings', '1');
    setMsg('Website content saved — it appears on the public site immediately.');
    onDone();
  };
  return (
    <div>
      <h1>Website Content</h1>
      <div className="card" style={{ padding: 16, maxWidth: 560 }}>
        <label>Hero title<input className="input" value={hero} onChange={(e) => setHero(e.target.value)} /></label>
        <label style={{ display: 'block', marginTop: 10 }}>Hero description<input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
        <label style={{ display: 'block', marginTop: 10 }}>Footer text<input className="input" value={footer} onChange={(e) => setFooter(e.target.value)} /></label>
        <button className="btn" style={{ marginTop: 12 }} onClick={save}>Save</button>
        {msg && <p>{msg}</p>}
      </div>
    </div>
  );
}

function Reports({ data, sb, onDone }: { data: Data; sb: Sb; onDone: () => void }) {
  return (
    <div>
      <h1>Reports</h1>
      {data.reports.map((r) => (
        <div key={r.id} className="card" style={{ padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span><strong>{r.type}</strong> — {r.message} <span className="muted">({r.status})</span></span>
          {r.status === 'open' && <button className="btn-ghost" onClick={async () => { await sb.from('reports').update({ status: 'resolved' }).eq('id', r.id); onDone(); }}>Mark resolved</button>}
        </div>
      ))}
      {data.reports.length === 0 && <p className="muted">No reports.</p>}
    </div>
  );
}

function Activity({ data }: { data: Data }) {
  return (
    <div>
      <h1>Activity Log</h1>
      {data.logs.map((l) => <p key={l.id} className="card" style={{ padding: 10 }}>{new Date(l.created_at).toLocaleString()} — {l.action} {l.target_type} {l.target_id}</p>)}
      {data.logs.length === 0 && <p className="muted">No activity yet.</p>}
    </div>
  );
}
