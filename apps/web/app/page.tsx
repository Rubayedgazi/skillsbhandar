import Link from 'next/link';
import { countSkillsByCategory, getCategories, getSettings, getSkills, getTutorials } from '../lib/data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [settings, categories, skills, tutorials, counts] = await Promise.all([
    getSettings(), getCategories(), getSkills(), getTutorials(), countSkillsByCategory(),
  ]);
  const popular = skills.filter((s) => s.is_popular).slice(0, 5);
  const recent = skills.slice(0, 5);
  return (
    <div>
      <section style={{ padding: '32px 0 8px' }}>
        <h1 style={{ fontSize: 40, margin: 0 }}>{settings.hero_title}</h1>
        <p className="muted" style={{ marginTop: 8 }}>{settings.hero_description}</p>
        <form action="/explore" method="get" style={{ marginTop: 20, display: 'flex', gap: 8 }}>
          <input className="input" name="q" placeholder="স্কিল খুঁজুন…" />
          <button className="btn" type="submit">খুঁজুন</button>
        </form>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>ক্যাটাগরি ঘুরে দেখুন</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {categories.map((c) => (
            <Link key={c.id} href={`/explore?category=${c.slug}`} className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{counts[c.id] || 0} টি স্কিল</div>
            </Link>
          ))}
          {categories.length === 0 && <p className="muted">এখনো কোনো ক্যাটাগরি নেই।</p>}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>জনপ্রিয় স্কিল</h2>
        {popular.length === 0 ? <p className="muted">এখনো কোনো স্কিল নেই।</p> : popular.map((s) => (
          <Link key={s.id} href={`/skills/${s.slug}`} className="card" style={{ display: 'block', padding: 14, marginBottom: 8 }}>
            <strong>{s.title}</strong> <span className="muted">— {s.short_description}</span>
          </Link>
        ))}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>টিউটোরিয়াল</h2>
        {tutorials.length === 0 ? <p className="muted">এখনো কোনো টিউটোরিয়াল নেই।</p> : tutorials.slice(0, 5).map((t) => (
          <div key={t.id} className="card" style={{ padding: 14, marginBottom: 8 }}><strong>{t.title}</strong> <span className="muted">— {t.description}</span></div>
        ))}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>সম্প্রতি যোগ করা</h2>
        {recent.length === 0 ? <p className="muted">এখনো কোনো স্কিল নেই।</p> : recent.map((s) => (
          <Link key={s.id} href={`/skills/${s.slug}`} className="card" style={{ display: 'block', padding: 14, marginBottom: 8 }}>
            <strong>{s.title}</strong> <span className="muted">— {s.short_description}</span>
          </Link>
        ))}
      </section>

      <footer style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <p className="muted" style={{ margin: 0 }}>{settings.footer_text}</p>
      </footer>
    </div>
  );
}
