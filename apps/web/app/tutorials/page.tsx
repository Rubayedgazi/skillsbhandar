import { getTutorials } from '../../lib/data';
import { Icon } from '../../components/icons';
export const dynamic = 'force-dynamic';
export default async function Tutorials() {
  const tutorials = await getTutorials();
  return (
    <div>
      <div className="page-head">
        <h1>টিউটোরিয়াল</h1>
        <p className="muted">ভিডিও দেখে ধাপে ধাপে শিখুন।</p>
      </div>
      <div style={{ marginTop: 20 }}>
        {tutorials.length === 0 ? <div className="empty">এখনো কোনো টিউটোরিয়াল নেই।</div> : tutorials.map((t) => (
          <div key={t.id} className="card" style={{ padding: 18, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="row-icon"><Icon name="play" size={19} /></span>
              <strong style={{ fontSize: 16 }}>{t.title}</strong>
            </div>
            <p className="muted">{t.description}</p>
            {t.video_url && <iframe width="100%" height="300" src={t.video_url} title={t.title} allowFullScreen style={{ border: 'none', borderRadius: 12 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
