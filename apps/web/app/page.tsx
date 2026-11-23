import Link from 'next/link';
import { getHomeData } from '../lib/data';
import { Icon, categoryColor, categoryIcon } from '../components/icons';
import { SkillRow } from '../components/SkillRow';

/**
 * Speed: the homepage is cached for 60 seconds instead of fetching
 * Supabase on every single visit (the old `force-dynamic` made every
 * visit wait for a round-trip to the database). Admin changes still
 * appear on the public site within a minute.
 */
export const revalidate = 60;

/** Tutorials have no thumbnail, so they keep the old compact row. */
function TutorialRow({ href, title, line }: { href: string; title: string; line: string }) {
  return (
    <Link href={href} className="row-card">
      <span className="row-icon"><Icon name="play" size={19} /></span>
      <span className="row-body"><b>{title}</b><span>{line}</span></span>
      <span className="row-arrow"><Icon name="arrow" size={17} /></span>
    </Link>
  );
}

export default async function Home() {
  // One parallel fetch; the skills list is fetched once and counted locally.
  const { settings, categories, skills, tutorials, counts } = await getHomeData();
  const popular = skills.filter((s) => s.is_popular).slice(0, 5);
  const recent = skills.slice(0, 5);
  // The demo hero title is two lines: "আপনার সব AI কাজ।" / "এক লাইব্রেরি।".
  // The database stores it on one line, so split after the first "। " here.
  const heroTitle = settings.hero_title.replace('। ', '।\n');
  return (
    <div>
      <section className="hero">
        <h1>{heroTitle}</h1>
        <p>{settings.hero_description}</p>
        <form action="/explore" method="get" className="hero-search">
          <Icon name="search" size={19} />
          <input name="q" placeholder="স্কিল খুঁজুন…" aria-label="স্কিল খুঁজুন" />
          <button className="btn" type="submit">খুঁজুন</button>
        </form>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>ক্যাটাগরি ঘুরে দেখুন</h2>
          <Link href="/explore" className="link">সব দেখুন</Link>
        </div>
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
      </section>

      <section className="section">
        <div className="section-head">
          <h2>জনপ্রিয় স্কিল</h2>
          <Link href="/explore?sort=popular" className="link">সব দেখুন</Link>
        </div>
        {popular.length === 0 ? (
          <div className="empty">এখনো কোনো স্কিল নেই।</div>
        ) : (
          popular.map((s) => (
            <SkillRow key={s.id} skill={s} categoryName={categories.find((c) => c.id === s.category_id)?.name} />
          ))
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>টিউটোরিয়াল</h2>
          <Link href="/tutorials" className="link">সব দেখুন</Link>
        </div>
        {tutorials.length === 0 ? (
          <div className="empty">এখনো কোনো টিউটোরিয়াল নেই।</div>
        ) : (
          tutorials.slice(0, 5).map((t) => (
            <TutorialRow key={t.id} href="/tutorials" title={t.title} line={t.description} />
          ))
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>সম্প্রতি যোগ করা</h2>
          <Link href="/explore" className="link">সব দেখুন</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty">এখনো কোনো স্কিল নেই।</div>
        ) : (
          recent.map((s) => (
            <SkillRow key={s.id} skill={s} categoryName={categories.find((c) => c.id === s.category_id)?.name} />
          ))
        )}
      </section>

      <footer className="site-footer">{settings.footer_text}</footer>
    </div>
  );
}
