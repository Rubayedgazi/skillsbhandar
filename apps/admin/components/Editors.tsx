'use client';
import { useState } from 'react';
import { DEFAULT_PRICING_PLANS, MAIN_CATEGORIES, hasPermission, slugify, type Category, type PricingPlan, type Profile, type PurchaseRequest, type Skill, type Tutorial } from '@skillsbhandar/shared';
import { getClient, logActivity, loadAll } from '../lib/data';
import { Icon } from './icons';

type Data = Awaited<ReturnType<typeof loadAll>>;
type Sb = NonNullable<ReturnType<typeof getClient>>;

export default function Editors({ section, data, profile, sb, onDone }: { section: string; data: Data; profile: Profile; sb: Sb; onDone: () => void }) {
  if (section === 'skills') return <SkillsEditor data={data} profile={profile} sb={sb} onDone={onDone} />;
  if (section === 'categories') return <CategoriesEditor data={data} profile={profile} sb={sb} onDone={onDone} />;
  if (section === 'tutorials') return <TutorialsEditor data={data} profile={profile} sb={sb} onDone={onDone} />;
  if (section === 'content') return <ContentEditor data={data} profile={profile} sb={sb} onDone={onDone} />;
  if (section === 'pricing') return <PricingEditor data={data} profile={profile} sb={sb} onDone={onDone} />;
  if (section === 'reports') return <Reports data={data} sb={sb} onDone={onDone} />;
  return <Activity data={data} />;
}

function SkillsEditor({ data, profile, sb, onDone }: { data: Data; profile: Profile; sb: Sb; onDone: () => void }) {
  type StepDraft = { heading: string; body: string; tip: string; code: string };
  const emptyStep = (): StepDraft => ({ heading: '', body: '', tip: '', code: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState('');
  const [editingPublishedAt, setEditingPublishedAt] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [overview, setOverview] = useState('');
  const [cat, setCat] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [setupTime, setSetupTime] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [md, setMd] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [tagsText, setTagsText] = useState('');
  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [msg, setMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setEditingId(null); setEditingSlug(''); setEditingPublishedAt(null);
    setTitle(''); setDesc(''); setOverview(''); setCat('');
    setDifficulty('beginner'); setSetupTime(''); setVideoUrl(''); setImageUrl('');
    setMd(''); setStatus('draft'); setIsFeatured(false); setIsPopular(false);
    setTagsText(''); setSteps([]);
  };

  const startEdit = async (s: Skill) => {
    setMsg(''); setOkMsg('');
    setEditingId(s.id); setEditingSlug(s.slug); setEditingPublishedAt(s.published_at || null);
    setTitle(s.title); setDesc(s.short_description || ''); setOverview(s.overview || '');
    setCat(s.category_id || ''); setDifficulty(s.difficulty || 'beginner');
    setSetupTime(s.setup_time_minutes ? String(s.setup_time_minutes) : '');
    setVideoUrl(s.video_url || ''); setImageUrl(s.preview_image_url || '');
    setMd(s.skill_md || ''); setStatus(s.status || 'draft');
    setIsFeatured(!!s.is_featured); setIsPopular(!!s.is_popular);
    const { data: st } = await sb.from('skill_steps').select('*').eq('skill_id', s.id).order('step_number');
    setSteps(((st as unknown as { heading: string; body: string; tip: string; code_example: string }[]) || []).map((x) => ({
      heading: x.heading || '', body: x.body || '', tip: x.tip || '', code: x.code_example || '',
    })));
    const { data: tg } = await sb.from('skill_tags').select('tags(name)').eq('skill_id', s.id);
    const names = ((tg as unknown as { tags: { name: string } | { name: string }[] | null }[]) || [])
      .map((r) => (Array.isArray(r.tags) ? r.tags[0]?.name : r.tags?.name))
      .filter(Boolean) as string[];
    setTagsText(names.join(', '));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };

  const uploadImage = async (file: File) => {
    setUploading(true); setMsg(''); setOkMsg('');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
    const path = `skills/${Date.now()}-${safeName}`;
    const { error } = await sb.storage.from('public-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes('bucket not found') || m.includes('not found')) {
        setMsg('ছবি আপলোড হয়নি: Supabase-এ public-images বাকেট নেই। supabase/migrations/005_storage.sql ফাইলটি Supabase SQL Editor-এ চালান, তারপর আবার চেষ্টা করুন। অথবা নিচে ছবির লিংক (URL) লিখে ব্যবহার করুন।');
      } else if (m.includes('row-level security') || m.includes('policy')) {
        setMsg('ছবি আপলোড হয়নি: Storage-এর অনুমতি (policy) নেই। supabase/migrations/005_storage.sql ফাইলটি Supabase SQL Editor-এ চালান, তারপর আবার চেষ্টা করুন।');
      } else {
        setMsg(`ছবি আপলোড হয়নি: ${error.message}`);
      }
      setUploading(false);
      return;
    }
    const { data } = sb.storage.from('public-images').getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setOkMsg('ছবি আপলোড হয়েছে — এখন স্কিলটি সেভ করলে এই ছবি থাম্বনেইল হিসেবে দেখা যাবে।');
    setUploading(false);
  };

  const saveSteps = async (skillId: string) => {
    const { error: delErr } = await sb.from('skill_steps').delete().eq('skill_id', skillId);
    if (delErr) throw new Error(delErr.message);
    const clean = steps.filter((s) => s.heading.trim() !== '');
    if (clean.length === 0) return;
    const { error } = await sb.from('skill_steps').insert(clean.map((s, i) => ({
      skill_id: skillId, step_number: i + 1, heading: s.heading.trim(),
      body: s.body || '', tip: s.tip || '', code_example: s.code || '',
    })));
    if (error) throw new Error(error.message);
  };

  const saveTags = async (skillId: string) => {
    const names = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
    const { error: delErr } = await sb.from('skill_tags').delete().eq('skill_id', skillId);
    if (delErr) throw new Error(delErr.message);
    for (const name of names) {
      const { data: tag, error: tagErr } = await sb.from('tags').upsert({ name, slug: slugify(name) }, { onConflict: 'slug' }).select('id').single();
      if (tagErr || !tag) throw new Error(tagErr?.message || 'ট্যাগ সেভ হয়নি।');
      const { error: linkErr } = await sb.from('skill_tags').insert({ skill_id: skillId, tag_id: (tag as { id: string }).id });
      if (linkErr) throw new Error(linkErr.message);
    }
  };

  const save = async () => {
    if (!hasPermission(profile, 'Skills')) { setMsg('আপনার Skills-এর অনুমতি নেই।'); return; }
    if (!title.trim()) { setMsg('প্রথমে স্কিলের নাম (Title) লিখুন।'); return; }
    if (!cat) { setMsg('প্রথমে একটি ক্যাটাগরি বেছে নিন — ক্যাটাগরি না থাকলে Categories-এ গিয়ে বানান।'); return; }
    setBusy(true); setMsg(''); setOkMsg('');
    const minutes = setupTime.trim() === '' ? null : parseInt(setupTime, 10);
    const payload = {
      title: title.trim(),
      slug: editingId ? editingSlug : slugify(title),
      short_description: desc,
      overview: overview || desc,
      skill_md: md,
      category_id: cat,
      difficulty,
      setup_time_minutes: Number.isNaN(minutes) ? null : minutes,
      video_url: videoUrl.trim() || null,
      preview_image_url: imageUrl.trim() || null,
      status,
      is_featured: isFeatured,
      is_popular: isPopular,
      published_at: status === 'published' ? (editingPublishedAt || new Date().toISOString()) : null,
    };
    let skillId = editingId;
    if (editingId) {
      const { error } = await sb.from('skills').update(payload).eq('id', editingId);
      if (error) { setMsg(`স্কিল সেভ হয়নি: ${error.message}`); setBusy(false); return; }
    } else {
      const { data: created, error } = await sb.from('skills').insert(payload).select('id').single();
      if (error || !created) { setMsg(`স্কিল সেভ হয়নি: ${error?.message || 'অজানা সমস্যা।'}`); setBusy(false); return; }
      skillId = (created as { id: string }).id;
    }
    try {
      await saveSteps(skillId as string);
      await saveTags(skillId as string);
    } catch (e) {
      setMsg(`স্কিল সেভ হয়েছে, কিন্তু ধাপ/ট্যাগ সেভ হয়নি: ${e instanceof Error ? e.message : 'অজানা সমস্যা।'} স্কিলটি এডিট করে আবার সেভ করুন।`);
      setBusy(false);
      return;
    }
    await logActivity(sb, profile.id, editingId ? 'skill updated' : 'skill created', 'skill', skillId as string);
    setOkMsg(editingId ? 'স্কিল আপডেট হয়েছে।' : `স্কিল সেভ হয়েছে (${status === 'published' ? 'প্রকাশিত' : 'ড্রাফট'})।`);
    resetForm();
    setBusy(false);
    onDone();
  };

  const publish = async (s: Skill, st: 'published' | 'draft') => {
    const { error } = await sb.from('skills').update({ status: st, published_at: st === 'published' ? new Date().toISOString() : null }).eq('id', s.id);
    if (error) { setMsg(`স্ট্যাটাস বদলানো যায়নি: ${error.message}`); return; }
    await logActivity(sb, profile.id, `skill ${st}`, 'skill', s.id);
    onDone();
  };
  const remove = async (s: Skill) => {
    if (!confirm(`Delete skill "${s.title}"?`)) return;
    const { error } = await sb.from('skills').delete().eq('id', s.id);
    if (error) { setMsg(`মুছতে পারিনি: ${error.message}`); return; }
    await logActivity(sb, profile.id, 'skill deleted', 'skill', s.id);
    onDone();
  };
  return (
    <div>
      <div className="page-head">
        <h1>Skills</h1>
        <p className="muted">Create skills, publish them to the public library, or keep them as drafts. Click Edit on a skill to change it.</p>
      </div>
      {data.categories.length === 0 && <p className="error" style={{ marginTop: 14 }}>Create a category first — a skill needs a category.</p>}
      <div className="card" style={{ padding: 20, maxWidth: 640, marginTop: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>{editingId ? 'Edit skill' : 'Add a new skill'}</h2>
        <div className="field" style={{ marginTop: 14 }}><label>Title *</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. ChatGPT Content Writing" /></div>
        <div className="field"><label>Short description (shows in lists)</label><input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="field"><label>Full description / Overview</label><textarea className="input" rows={3} value={overview} onChange={(e) => setOverview(e.target.value)} placeholder="What does this skill do, in detail?" /></div>
        <div className="field"><label>Category *</label>
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">— pick a category —</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '1 1 160px' }}><label>Difficulty</label>
            <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}>
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="field" style={{ flex: '1 1 160px' }}><label>Setup time (minutes)</label><input className="input" type="number" min={0} value={setupTime} onChange={(e) => setSetupTime(e.target.value)} placeholder="e.g. 15" /></div>
          <div className="field" style={{ flex: '1 1 160px' }}><label>Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
              <option value="draft">Draft (not public)</option><option value="published">Published (public)</option>
            </select>
          </div>
        </div>
        <div className="field"><label>Video URL (YouTube embed link, optional)</label><input className="input" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." /></div>

        <div className="field"><label>Thumbnail image (shows on the public site)</label>
          {imageUrl && (
            <div style={{ marginBottom: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Skill thumbnail preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn-ghost" type="button" onClick={() => setImageUrl('')}>Remove image</button>
              </div>
            </div>
          )}
          <input className="input" type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f); e.target.value = ''; }} />
          <p className="muted" style={{ fontSize: 13, margin: '6px 0 0' }}>{uploading ? 'ছবি আপলোড হচ্ছে…' : 'ছবি বেছে নিলে সেটি Supabase-এ আপলোড হবে। প্রথমবার আপলোড করতে হলে Supabase-এ 005_storage.sql চালানো থাকতে হবে।'}</p>
          <label style={{ display: 'block', marginTop: 10, fontSize: 13 }} className="muted">…or paste an image link (URL) instead</label>
          <input className="input" style={{ marginTop: 6 }} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
        </div>

        <div className="field"><label>Tags (comma separated, optional)</label><input className="input" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g. chatgpt, writing, seo" /></div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#7c5cff' }} /> Featured</label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#7c5cff' }} /> Popular</label>
        </div>

        <div className="field"><label>SKILL.md content</label><textarea className="input" rows={6} value={md} onChange={(e) => setMd(e.target.value)} placeholder="# Skill name&#10;..." /></div>

        <div style={{ marginTop: 20 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Steps — ধাপে ধাপে শিখুন</h3>
          <p className="muted" style={{ fontSize: 13, margin: '0 0 10px' }}>Each step shows on the public skill page in this order. Leave empty if the skill has no steps yet.</p>
          {steps.map((st, i) => (
            <div key={i} className="card" style={{ padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>ধাপ {i + 1}</strong>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-ghost" type="button" disabled={i === 0} onClick={() => moveStep(i, -1)}>↑</button>
                  <button className="btn-ghost" type="button" disabled={i === steps.length - 1} onClick={() => moveStep(i, 1)}>↓</button>
                  <button className="btn-ghost" type="button" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>✕ মুছুন</button>
                </span>
              </div>
              <div className="field"><label>Step title</label><input className="input" value={st.heading} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)))} placeholder="e.g. Open ChatGPT" /></div>
              <div className="field"><label>Instructions</label><textarea className="input" rows={2} value={st.body} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} /></div>
              <div className="field"><label>Tip (optional)</label><input className="input" value={st.tip} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, tip: e.target.value } : x)))} placeholder="একটি ছোট টিপস" /></div>
              <div className="field" style={{ marginBottom: 0 }}><label>Code example (optional)</label><textarea className="input" rows={2} value={st.code} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} placeholder="কোড থাকলে এখানে লিখুন" /></div>
            </div>
          ))}
          <button className="btn-ghost" type="button" onClick={() => setSteps([...steps, emptyStep()])}>+ ধাপ যোগ করুন</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <button className="btn" disabled={busy} onClick={() => void save()}>{busy ? 'সেভ হচ্ছে…' : editingId ? 'Update skill' : 'Save skill'}</button>
          {editingId && <button className="btn-ghost" type="button" onClick={() => { resetForm(); setMsg(''); setOkMsg(''); }}>Cancel edit</button>}
        </div>
        {msg && <p className="error">{msg}</p>}
        {okMsg && <p className="ok-msg">{okMsg}</p>}
      </div>
      <div className="section">
        <div className="section-head"><h2>All skills ({data.skills.length})</h2></div>
        {data.skills.length === 0 ? <div className="empty">No skills yet — 0 skills in the library.</div> : data.skills.map((s) => (
          <div key={s.id} className="row-card">
            {s.preview_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.preview_image_url} alt="" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, objectFit: 'cover' }} />
            ) : (
              <span className="row-icon"><Icon name="book" size={19} /></span>
            )}
            <span className="row-body"><b>{s.title}</b><span>{s.status} · {s.difficulty} · {s.download_count} downloads</span></span>
            <span className={`pill ${s.status === 'published' ? 'pill-green' : 'pill-grey'}`}>{s.status}</span>
            <button className="btn-ghost" onClick={() => void startEdit(s)}>Edit</button>
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

function PricingEditor({ data, profile, sb, onDone }: { data: Data; profile: Profile; sb: Sb; onDone: () => void }) {
  const saved = data.settings?.pricing_plans;
  const [plans, setPlans] = useState<PricingPlan[]>(saved && saved.length > 0 ? saved : DEFAULT_PRICING_PLANS);
  const [msg, setMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (i: number, patch: Partial<PricingPlan>) =>
    setPlans(plans.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const save = async () => {
    if (!hasPermission(profile, 'Pricing')) { setMsg('আপনার Pricing-এর অনুমতি নেই।'); return; }
    const clean = plans
      .filter((p) => p.name.trim() !== '')
      .map((p) => ({ ...p, slug: p.slug || slugify(p.name), price_taka: Math.max(0, Math.floor(Number(p.price_taka) || 0)) }));
    setBusy(true); setMsg(''); setOkMsg('');
    const { error } = await sb.from('site_settings').upsert({ id: 1, pricing_plans: clean }, { onConflict: 'id' });
    setBusy(false);
    if (error) { setMsg(`প্রাইসিং সেভ হয়নি: ${error.message}`); return; }
    await logActivity(sb, profile.id, 'pricing updated', 'site_settings', '1');
    setOkMsg('প্রাইসিং সেভ হয়েছে — পাবলিক সাইটে ১ মিনিটের মধ্যে দেখা যাবে।');
    onDone();
  };

  const setStatus = async (r: PurchaseRequest, status: PurchaseRequest['status']) => {
    const { error } = await sb.from('purchase_requests').update({ status }).eq('id', r.id);
    if (error) { setMsg(`স্ট্যাটাস বদলানো যায়নি: ${error.message}`); return; }
    await logActivity(sb, profile.id, `purchase request ${status}`, 'purchase_requests', r.id);
    onDone();
  };

  const statusPill = (s: string) => (s === 'pending' ? 'pill-amber' : s === 'approved' ? 'pill-green' : s === 'rejected' ? 'pill-red' : 'pill-grey');
  return (
    <div>
      <div className="page-head">
        <h1>Pricing</h1>
        <p className="muted">Edit the plans on the public Pricing page. The prices shown here are what visitors see — change them to your real prices.</p>
      </div>
      <div className="card" style={{ padding: 20, maxWidth: 680, marginTop: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>Plans (প্ল্যানগুলো)</h2>
        <p className="muted" style={{ fontSize: 13, margin: '0 0 12px' }}>
          দাম টাকায় (৳)। Features-এ এক লাইনে একটি করে সুবিধা লিখুন। Featured প্ল্যানটি হাইলাইট হয়ে দেখাবে।
        </p>
        {plans.map((p, i) => (
          <div key={i} className="card" style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div className="field" style={{ flex: '2 1 180px', marginTop: 0 }}><label>Plan name</label><input className="input" value={p.name} onChange={(e) => update(i, { name: e.target.value })} /></div>
              <div className="field" style={{ flex: '1 1 110px', marginTop: 0 }}><label>Price (৳)</label><input className="input" type="number" min={0} value={p.price_taka} onChange={(e) => update(i, { price_taka: Number(e.target.value) })} /></div>
              <div className="field" style={{ flex: '1 1 130px', marginTop: 0 }}><label>Period</label>
                <select className="input" value={p.period} onChange={(e) => update(i, { period: e.target.value as PricingPlan['period'] })}>
                  <option value="monthly">মাসিক</option><option value="yearly">বার্ষিক</option><option value="lifetime">আজীবন</option>
                </select>
              </div>
            </div>
            <div className="field"><label>Features — এক লাইনে একটি করে</label>
              <textarea className="input" rows={3} value={p.features.join('\n')} onChange={(e) => update(i, { features: e.target.value.split('\n').map((f) => f.trim()).filter(Boolean) })} />
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={p.featured} onChange={(e) => update(i, { featured: e.target.checked })} style={{ width: 18, height: 18, accentColor: '#7c5cff' }} /> Featured (হাইলাইট)</label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={p.is_active} onChange={(e) => update(i, { is_active: e.target.checked })} style={{ width: 18, height: 18, accentColor: '#7c5cff' }} /> দেখাবে (Active)</label>
              <button className="btn-ghost" type="button" onClick={() => setPlans(plans.filter((_, j) => j !== i))}>✕ প্ল্যান মুছুন</button>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
          <button className="btn-ghost" type="button" onClick={() => setPlans([...plans, { slug: '', name: 'নতুন প্ল্যান', price_taka: 0, period: 'monthly', features: [], featured: false, is_active: true }])}>+ প্ল্যান যোগ করুন</button>
          <button className="btn" disabled={busy} onClick={() => void save()}>{busy ? 'সেভ হচ্ছে…' : 'Save pricing'}</button>
        </div>
        {msg && <p className="error">{msg}</p>}
        {okMsg && <p className="ok-msg">{okMsg}</p>}
      </div>

      <div className="section">
        <div className="section-head"><h2>কেনার অনুরোধ ({data.purchaseRequests.length})</h2></div>
        <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>
          কেউ প্রিমিয়াম কিনতে চাইলে তার নাম, ইমেইল ও মোবাইল এখানে আসবে। পেমেন্ট অনলাইনে নেওয়া হয় না — তার সাথে যোগাযোগ করে পেমেন্ট সম্পন্ন করুন, তারপর Member Logins-এ গিয়ে ওই ইমেইলে অ্যাকাউন্ট বানিয়ে প্রিমিয়াম দিন।
        </p>
        {data.purchaseRequests.length === 0 ? <div className="empty">এখনো কোনো কেনার অনুরোধ আসেনি।</div> : data.purchaseRequests.map((r) => (
          <div key={r.id} className="card" style={{ padding: 16, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{r.full_name}</strong>
              <span className="muted" style={{ fontSize: 13 }}>{r.email} · {r.mobile}</span>
              <span className={`pill ${statusPill(r.status)}`}>{r.status}</span>
            </div>
            <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
              {r.plan_name} — ৳{r.price_taka.toLocaleString('bn-BD')} · {new Date(r.created_at).toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {r.status === 'pending' && <button className="btn-ghost" onClick={() => void setStatus(r, 'contacted')}>যোগাযোগ হয়েছে</button>}
              {r.status !== 'approved' && <button className="btn-ghost" onClick={() => void setStatus(r, 'approved')}>অনুমোদন (Approved)</button>}
              {r.status !== 'rejected' && <button className="btn-ghost" onClick={() => void setStatus(r, 'rejected')}>বাতিল (Rejected)</button>}
            </div>
          </div>
        ))}
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
