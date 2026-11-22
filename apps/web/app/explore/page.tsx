import Link from 'next/link';
import { getCategories, getSkills } from '../../lib/data';
import Finder from './Finder';

export const dynamic = 'force-dynamic';

export default async function Explore({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
  const params = await searchParams;
  const [categories, skills] = await Promise.all([getCategories(), getSkills()]);
  const q = (params.q || '').toLowerCase();
  const cat = categories.find((c) => c.slug === params.category);
  let list = skills.filter((s) => {
    if (cat && s.category_id !== cat.id) return false;
    if (q && !(s.title + ' ' + s.short_description + ' ' + s.overview).toLowerCase().includes(q)) return false;
    return true;
  });
  if (params.sort === 'popular') list = [...list].sort((a, b) => b.download_count - a.download_count);
  else if (params.sort === 'az') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  return (
    <div>
      <h1>স্কিল ঘুরে দেখুন</h1>
      <Finder skills={skills} categories={categories} />
      <h2 style={{ marginTop: 28 }}>অথবা নিজে খুঁজুন</h2>
      <form method="get" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input className="input" name="q" defaultValue={params.q || ''} placeholder="খুঁজুন…" style={{ maxWidth: 320 }} />
        <select className="input" name="category" defaultValue={params.category || ''} style={{ maxWidth: 220 }}>
          <option value="">সব ক্যাটাগরি</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select className="input" name="sort" defaultValue={params.sort || ''} style={{ maxWidth: 180 }}>
          <option value="">নতুন প্রথমে</option>
          <option value="popular">জনপ্রিয়</option>
          <option value="az">নাম অনুযায়ী</option>
        </select>
        <button className="btn" type="submit">খুঁজুন</button>
      </form>
      <div style={{ marginTop: 20 }}>
        {list.length === 0 ? <p className="muted">কোনো স্কিল পাওয়া যায়নি। লাইব্রেরিতে এখনো স্কিল যোগ করা হয়নি।</p> : list.map((s) => (
          <Link key={s.id} href={`/skills/${s.slug}`} className="card" style={{ display: 'block', padding: 14, marginBottom: 8 }}>
            <strong>{s.title}</strong> <span className="muted">— {s.short_description} · {s.difficulty}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
