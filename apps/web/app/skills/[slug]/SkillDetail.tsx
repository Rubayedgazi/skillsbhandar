'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseClient, type Skill } from '@skillsbhandar/shared';

export default function SkillDetail({ skill, related, categoryName }: { skill: Skill; related: Skill[]; categoryName: string }) {
  const [done, setDone] = useState<string[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const steps = skill.steps || [];
  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(`sb-progress-${skill.id}`) || '[]'));
      setBookmarked((JSON.parse(localStorage.getItem('sb-bookmarks') || '[]') as string[]).includes(skill.id));
      const recent = JSON.parse(localStorage.getItem('sb-recent') || '[]') as string[];
      localStorage.setItem('sb-recent', JSON.stringify([skill.slug, ...recent.filter((s) => s !== skill.slug)].slice(0, 10)));
    } catch { /* storage unavailable */ }
  }, [skill.id, skill.slug]);
  const toggleStep = (id: string) => {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(next);
    try { localStorage.setItem(`sb-progress-${skill.id}`, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const toggleBookmark = () => {
    try {
      const list = JSON.parse(localStorage.getItem('sb-bookmarks') || '[]') as string[];
      const next = bookmarked ? list.filter((x) => x !== skill.id) : [...list, skill.id];
      localStorage.setItem('sb-bookmarks', JSON.stringify(next));
    } catch { /* ignore */ }
    setBookmarked(!bookmarked);
  };
  const download = () => {
    const blob = new Blob([skill.skill_md || skill.overview], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${skill.slug}.md`;
    a.click();
  };
  const sendReport = async () => {
    const sb = createSupabaseClient();
    if (sb) await sb.from('reports').insert({ skill_id: skill.id, type: 'other', message: report });
    setReportSent(true);
  };
  const pct = steps.length ? Math.round((done.length / steps.length) * 100) : 0;
  return (
    <div>
      <p className="muted">{categoryName} · {skill.difficulty}</p>
      <h1 style={{ marginTop: 4 }}>{skill.title}</h1>
      <p className="muted">{skill.short_description}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button className="btn-ghost" onClick={toggleBookmark}>{bookmarked ? '★ বুকমার্ক করা' : '☆ বুকমার্ক করুন'}</button>
        <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(skill.skill_md || skill.overview); setCopied(true); }}>{copied ? 'কপি হয়েছে' : 'SKILL.md কপি করুন'}</button>
        <button className="btn" onClick={download}>ডাউনলোড করুন</button>
      </div>
      <h2 style={{ marginTop: 28 }}>বিবরণ</h2>
      <p>{skill.overview}</p>
      {skill.video_url && <div style={{ marginTop: 16 }}><iframe width="100%" height="360" src={skill.video_url} title="video" allowFullScreen style={{ border: 'none', borderRadius: 14 }} /></div>}
      <h2 style={{ marginTop: 28 }}>ধাপে ধাপে শিখুন ({pct}% শেষ)</h2>
      {steps.length === 0 ? <p className="muted">এই স্কিলের জন্য এখনো কোনো ধাপ যোগ করা হয়নি।</p> : steps.map((st) => (
        <label key={st.id} className="card" style={{ display: 'block', padding: 14, marginBottom: 8 }}>
          <input type="checkbox" checked={done.includes(st.id)} onChange={() => toggleStep(st.id)} /> <strong>{st.step_number}. {st.heading}</strong>
          <p className="muted">{st.body}</p>
          {st.tip && <p>💡 {st.tip}</p>}
          {st.code_example && <pre>{st.code_example}</pre>}
        </label>
      ))}
      <h2 style={{ marginTop: 28 }}>SKILL.md</h2>
      <pre>{skill.skill_md || 'এই স্কিলের ফাইল এখনো যোগ করা হয়নি।'}</pre>
      <h2 style={{ marginTop: 28 }}>সম্পর্কিত স্কিল</h2>
      {related.length === 0 ? <p className="muted">কোনো সম্পর্কিত স্কিল নেই।</p> : related.map((r) => (
        <Link key={r.id} href={`/skills/${r.slug}`} className="card" style={{ display: 'block', padding: 12, marginBottom: 8 }}>{r.title}</Link>
      ))}
      <h2 style={{ marginTop: 28 }}>সমস্যা জানান</h2>
      {reportSent ? <p>ধন্যবাদ! আপনার রিপোর্ট পাঠানো হয়েছে।</p> : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" value={report} onChange={(e) => setReport(e.target.value)} placeholder="কী সমস্যা?" />
          <button className="btn-ghost" onClick={sendReport}>পাঠান</button>
        </div>
      )}
    </div>
  );
}
