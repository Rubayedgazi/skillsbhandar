'use client';
import { useState } from 'react';
import { MAIN_CATEGORIES, hasPermission, slugify, type Category, type Profile, type Skill, type Tutorial } from '@skillsbhandar/shared';
import { getClient, logActivity, loadAll } from '../lib/data';
import { Icon } from './icons';

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
      <div className="page-head">
        <h1>Skills</h1>
        <p className="muted">Create skills, publish them to the public library, or keep them as drafts.</p>
      </div>
      {data.categories.length === 0 && <p className="error" style={{ marginTop: 14 }}>Create a category first — a skill needs a category.</p>}
      <div className="card" style={{ padding: 20, maxWidth: 640, marginTop: 20 }}>
        <div className="field" style={{ marginTop: 0 }}><label>Title</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label>Short description</label><input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="field"><label>Category</label>
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">— pick a category —</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field"><label>SKILL.md content</label><textarea className="input" rows={6} value={md} onChange={(e) => setMd(e.target.value)} placeholder="# Skill name&#10;..." /></div>
        <button className="btn" style={{ marginTop: 16 }} onClick={save}>Save skill (draft)</button>
        {msg && <p>{msg}</p>}
      </div>
      <div className="section">
        <div className="section-head"><h2>All skills ({data.skills.length})</h2></div>
        {data.skills.length === 0 ? <div className="empty">No skills yet — 0 skills in the library.</div> : data.skills.map((s) => (
          <div key={s.id} className="row-card">
            <span className="row-icon"><Icon name="book" size={19} /></span>
            <span className="row-body"><b>{s.title}</b><span>{s.status} · {s.download_count} downloads</span></span>
            <span className={`pill ${s.status === 'published' ? 'pill-green' : 'pill-grey'}`}>{s.status}</span>
            <button className="btn-ghost" onClick={() => publish(s, s.status === 'published' ? 'draft' : 'published')}>{s.status === 'published' ? 'Unpublish' : 'Publish'}</button>
            <button className="btn-ghost" onClick={() => remove(s)}>Delete</button>
          </div>
        ))}
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
      <div className="page-head">
        <h1>Categories</h1>
        <p className="muted">Categories organise the public library. A skill needs a category.</p>
      </div>
      <div className="card" style={{ padding: 20, maxWidth: 520, marginTop: 20 }}>
        <div className="field" style={{ marginTop: 0 }}><label>New category</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn" onClick={add}>Add category</button>
          <button className="btn-ghost" onClick={restore}>Restore the 8 main categories</button>
        </div>
        {msg && <p>{msg}</p>}
      </div>
      <div className="section">
        {data.categories.map((c: Category) => (
          <div key={c.id} className="row-card">
            <span className="row-icon"><Icon name="layout" size={19} /></span>
            <span className="row-body"><b>{c.name}</b><span>{data.skills.filter((s) => s.category_id === c.id).length} skills</span></span>
            <button className="btn-ghost" onClick={async () => { if (confirm(`Delete category "${c.name}"?`)) { await sb.from('categories').delete().eq('id', c.id); onDone(); } }}>Delete</button>
          </div>
        ))}
      </div>
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
      <div className="page-head">
        <h1>Tutorials</h1>
        <p className="muted">Video tutorials for the public library.</p>
      </div>
      <div className="card" style={{ padding: 20, maxWidth: 560, marginTop: 20 }}>
        <div className="field" style={{ marginTop: 0 }}><label>Title</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label>Video URL (YouTube embed)</label><input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://www.youtube.com/embed/..." /></div>
        <button className="btn" style={{ marginTop: 16 }} onClick={add}>Save tutorial (draft)</button>
        {msg && <p>{msg}</p>}
      </div>
      <div className="section">
        {data.tutorials.length === 0 ? <div className="empty">No tutorials yet.</div> : data.tutorials.map((t: Tutorial) => (
          <div key={t.id} className="row-card">
            <span className="row-icon"><Icon name="play" size={19} /></span>
            <span className="row-body"><b>{t.title}</b><span>{t.status}</span></span>
            <span className={`pill ${t.status === 'published' ? 'pill-green' : 'pill-grey'}`}>{t.status}</span>
            <button className="btn-ghost" onClick={async () => { await sb.from('tutorials').update({ status: t.status === 'published' ? 'draft' : 'published' }).eq('id', t.id); onDone(); }}>{t.status === 'published' ? 'Unpublish' : 'Publish'}</button>
            <button className="btn-ghost" onClick={async () => { await sb.from('tutorials').delete().eq('id', t.id); onDone(); }}>Delete</button>
          </div>
        ))}
      </div>
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
      <div className="page-head">
        <h1>Website Content</h1>
        <p className="muted">Edit what the public homepage says.</p>
      </div>
      <div className="card" style={{ padding: 20, maxWidth: 560, marginTop: 20 }}>
        <div className="field" style={{ marginTop: 0 }}><label>Hero title</label><input className="input" value={hero} onChange={(e) => setHero(e.target.value)} /></div>
        <div className="field"><label>Hero description</label><input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="field"><label>Footer text</label><input className="input" value={footer} onChange={(e) => setFooter(e.target.value)} /></div>
        <button className="btn" style={{ marginTop: 16 }} onClick={save}>Save</button>
        {msg && <p>{msg}</p>}
      </div>
    </div>
  );
}

function Reports({ data, sb, onDone }: { data: Data; sb: Sb; onDone: () => void }) {
  return (
    <div>
      <div className="page-head">
        <h1>Reports</h1>
        <p className="muted">Feedback reports filed by visitors about skills.</p>
      </div>
      <div style={{ marginTop: 20 }}>
        {data.reports.length === 0 ? <div className="empty">No reports.</div> : data.reports.map((r) => (
          <div key={r.id} className="row-card">
            <span className="row-icon"><Icon name="flag" size={19} /></span>
            <span className="row-body"><b>{r.type}</b><span>{r.message}</span></span>
            <span className={`pill ${r.status === 'open' ? 'pill-amber' : 'pill-green'}`}>{r.status}</span>
            {r.status === 'open' && <button className="btn-ghost" onClick={async () => { await sb.from('reports').update({ status: 'resolved' }).eq('id', r.id); onDone(); }}>Mark resolved</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Activity({ data }: { data: Data }) {
  return (
    <div>
      <div className="page-head">
        <h1>Activity Log</h1>
        <p className="muted">Who did what, and when.</p>
      </div>
      <div style={{ marginTop: 20 }}>
        {data.logs.length === 0 ? <div className="empty">No activity yet.</div> : data.logs.map((l) => (
          <div key={l.id} className="row-card">
            <span className="row-icon"><Icon name="activity" size={19} /></span>
            <span className="row-body"><b>{l.action}</b><span>{l.target_type} {l.target_id}</span></span>
            <span className="muted" style={{ fontSize: 13 }}>{new Date(l.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
