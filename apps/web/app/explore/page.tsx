import Link from 'next/link';
import { getCategories, getSkills } from '../../lib/data';
import Finder from './Finder';
import { Icon, categoryColor, categoryIcon } from '../../components/icons';
import { SkillRow } from '../../components/SkillRow';

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
  const counts: Record<string, number> = {};
  for (const s of skills) if (s.category_id) counts[s.category_id] = (counts[s.category_id] || 0) + 1;
  return (
    <div>
      <div className="page-head">
        <h1>স্কিল ঘুরে দেখুন</h1>
        <p className="muted">ক্যাটাগরি, নাম বা কাজ দিয়ে খুঁজুন।</p>
      </div>

      <div className="section">
        <div className="section-head"><h2>ক্যাটাগরি</h2></div>
        <div className="cat-grid">
          {categories.map((c) => {
            const color = categoryColor(c.slug);
            return (
              <Link key={c.id} href={`/categories/${c.slug}`} className="cat-tile">
                <span className="cat-icon" style={{ background: `${color}22`, color }}>
                  <Icon name={categoryIcon(c.slug)} size={21} />
                </span>
                <b>{c.name}</b>
                <span>{counts[c.id] || 0} টি স্কিল</span>
              </Link>
            );
          })}
          {categories.length === 0 && <p className="muted">এখনো কোনো ক্যাটাগরি নেই।</p>}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <Finder skills={skills} categories={categories} />
      </div>

      <div className="section">
        <div className="section-head"><h2>অথবা নিজে খুঁজুন</h2></div>
        <form method="get" className="card" style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
          <button className="btn" type="submit"><Icon name="search" size={17} /> খুঁজুন</button>
        </form>
        <div style={{ marginTop: 16 }}>
          {list.length === 0 ? (
            <div className="empty">কোনো স্কিল পাওয়া যায়নি। লাইব্রেরিতে এখনো স্কিল যোগ করা হয়নি।</div>
          ) : list.map((s) => (
            <SkillRow key={s.id} skill={s} categoryName={categories.find((c) => c.id === s.category_id)?.name} />
          ))}
        </div>
      </div>
    </div>
  );
}
