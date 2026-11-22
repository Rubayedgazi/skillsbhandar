import { getTutorials } from '../../lib/data';
export const dynamic = 'force-dynamic';
export default async function Tutorials() {
  const tutorials = await getTutorials();
  return (
    <div>
      <h1>টিউটোরিয়াল</h1>
      {tutorials.length === 0 ? <p className="muted">এখনো কোনো টিউটোরিয়াল নেই।</p> : tutorials.map((t) => (
        <div key={t.id} className="card" style={{ padding: 16, marginBottom: 10 }}>
          <strong>{t.title}</strong>
          <p className="muted">{t.description}</p>
          {t.video_url && <iframe width="100%" height="300" src={t.video_url} title={t.title} allowFullScreen style={{ border: 'none', borderRadius: 12 }} />}
        </div>
      ))}
    </div>
  );
}
