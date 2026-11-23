'use client';
import { useEffect, useState } from 'react';
import { createSupabaseClient, type Skill } from '@skillsbhandar/shared';
import { Icon } from '../../../components/icons';
import { SkillRow } from '../../../components/SkillRow';

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
      {skill.preview_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={skill.preview_image_url} alt={skill.title} className="skill-banner" />
      )}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categoryName && <span className="pill">{categoryName}</span>}
          <span className="pill" style={{ background: 'var(--accent-soft2)', color: 'var(--accent2)' }}>{skill.difficulty}</span>
          {skill.setup_time_minutes ? <span className="pill" style={{ background: 'var(--surface3)', color: 'var(--muted)' }}>{skill.setup_time_minutes} মিনিট</span> : null}
        </div>
        <h1 style={{ margin: '14px 0 6px', fontSize: 30 }}>{skill.title}</h1>
        <p className="muted" style={{ margin: 0 }}>{skill.short_description}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
          <button className="btn-ghost" onClick={toggleBookmark}>
            <Icon name="bookmark" size={17} /> {bookmarked ? 'বুকমার্ক করা' : 'বুকমার্ক করুন'}
          </button>
          <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(skill.skill_md || skill.overview); setCopied(true); }}>
            <Icon name="copy" size={17} /> {copied ? 'কপি হয়েছে' : 'SKILL.md কপি করুন'}
          </button>
          <button className="btn" onClick={download}><Icon name="download" size={17} /> ডাউনলোড করুন</button>
        </div>
        <p className="muted" style={{ margin: '16px 0 0', fontSize: 13 }}>{skill.download_count} ডাউনলোড · {skill.view_count} বার দেখা হয়েছে</p>
      </div>

      <div className="section">
        <div className="section-head"><h2>বিবরণ</h2></div>
        <p style={{ margin: 0 }}>{skill.overview}</p>
        {skill.video_url && <div style={{ marginTop: 16 }}><iframe width="100%" height="360" src={skill.video_url} title="video" allowFullScreen style={{ border: 'none', borderRadius: 14 }} /></div>}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>ধাপে ধাপে শিখুন</h2>
          <span className="muted" style={{ fontSize: 14 }}>{done.length}/{steps.length} শেষ · {pct}%</span>
        </div>
        {steps.length > 0 && (
          <div className="progress-track" style={{ marginBottom: 16 }}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        )}
        {steps.length === 0 ? <div className="empty">এই স্কিলের জন্য এখনো কোনো ধাপ যোগ করা হয়নি।</div> : steps.map((st) => (
          <label key={st.id} className={`card step-card${done.includes(st.id) ? ' done' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input type="checkbox" checked={done.includes(st.id)} onChange={() => toggleStep(st.id)} style={{ marginTop: 4, width: 18, height: 18, accentColor: '#7c5cff' }} />
              <span>
                <strong>{st.step_number}. {st.heading}</strong>
                <span className="muted" style={{ display: 'block', marginTop: 4 }}>{st.body}</span>
                {st.tip && <span style={{ display: 'block', marginTop: 6 }}>💡 {st.tip}</span>}
                {st.code_example && <span className="md-card" style={{ display: 'block', marginTop: 8 }}><pre>{st.code_example}</pre></span>}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="section">
        <div className="section-head"><h2>SKILL.md</h2></div>
        <div className="md-card"><pre>{skill.skill_md || 'এই স্কিলের ফাইল এখনো যোগ করা হয়নি।'}</pre></div>
      </div>

      <div className="section">
        <div className="section-head"><h2>সম্পর্কিত স্কিল</h2></div>
        {related.length === 0 ? <div className="empty">কোনো সম্পর্কিত স্কিল নেই।</div> : related.map((r) => (
          <SkillRow key={r.id} skill={r} categoryName={categoryName} />
        ))}
      </div>

      <div className="section">
        <div className="section-head"><h2>সমস্যা জানান</h2></div>
        {reportSent ? (
          <div className="card" style={{ padding: 18 }}><p className="ok-msg" style={{ margin: 0 }}>ধন্যবাদ! আপনার রিপোর্ট পাঠানো হয়েছে।</p></div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" value={report} onChange={(e) => setReport(e.target.value)} placeholder="কী সমস্যা?" />
            <button className="btn-ghost" onClick={sendReport}>পাঠান</button>
          </div>
        )}
      </div>
    </div>
  );
}
