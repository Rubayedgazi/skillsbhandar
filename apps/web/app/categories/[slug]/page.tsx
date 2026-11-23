import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategories, getSkills } from '../../../lib/data';
import { Icon, categoryColor, categoryIcon } from '../../../components/icons';
import { SkillRow } from '../../../components/SkillRow';

/**
 * One section per category: /categories/content-creation shows ALL skills
 * in Content Creation. The same skills still appear in Explore Skills too
 * (Explore is unchanged) — this page is an extra, dedicated view.
 * Cached 60s like the homepage, so Admin changes appear within a minute.
 */
export const revalidate = 60;
// Categories can be added in Admin after a build, so a slug that was not
// pre-rendered at build time must still render on demand (ISR), not 404.
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [categories, skills] = await Promise.all([getCategories(), getSkills()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const list = skills.filter((s) => s.category_id === category.id);
  const color = categoryColor(category.slug);
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <Link href="/" className="link">← হোম</Link>
        <Link href="/explore" className="link">স্কিল ঘুরে দেখুন</Link>
      </div>
      <div className="page-head">
        <span className="cat-icon" style={{ background: `${color}22`, color, width: 52, height: 52, marginBottom: 14 }}>
          <Icon name={categoryIcon(category.slug)} size={26} />
        </span>
        <h1>{category.name}</h1>
        {category.description ? <p className="muted">{category.description}</p> : null}
        <p style={{ marginTop: 12 }}>
          <span className="pill">{list.length} টি স্কিল</span>
        </p>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>এই ক্যাটাগরির স্কিল</h2>
          <Link href={`/explore?category=${category.slug}`} className="link">এক্সপ্লোরে দেখুন</Link>
        </div>
        {list.length === 0 ? (
          <div className="empty">
            এখনো কোনো স্কিল নেই।
            <p className="muted" style={{ margin: '8px 0 0', fontSize: 14 }}>
              অ্যাডমিন এই ক্যাটাগরিতে স্কিল যোগ করলে এখানে দেখা যাবে।
            </p>
          </div>
        ) : (
          list.map((s) => (
            <SkillRow key={s.id} skill={s} categoryName={category.name} />
          ))
        )}
      </div>
    </div>
  );
}
