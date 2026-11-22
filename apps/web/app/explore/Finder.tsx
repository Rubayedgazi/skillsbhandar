'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { findSkills, type Category, type Skill } from '@skillsbhandar/shared';

const EXAMPLES = ['ল্যান্ডিং পেজ বানাতে চাই', 'SEO করতে চাই', 'ভিডিও স্ক্রিপ্ট লিখতে চাই', 'ডেটা বিশ্লেষণ করতে চাই'];

export default function Finder({ skills, categories }: { skills: Skill[]; categories: Category[] }) {
  const [query, setQuery] = useState('');
  const [asked, setAsked] = useState('');
  const results = useMemo(() => (asked ? findSkills(asked, skills, categories) : []), [asked, skills, categories]);
  return (
    <div className="card" style={{ padding: 18, marginTop: 12 }}>
      <h2 style={{ marginTop: 0 }}>AI স্কিল ফাইন্ডার</h2>
      <p className="muted">আপনি কী করতে চান, লিখুন — বাংলা বা ইংরেজিতে।</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="যেমন: ল্যান্ডিং পেজ বানাতে চাই" />
        <button className="btn" onClick={() => setAsked(query)}>খুঁজুন</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {EXAMPLES.map((ex) => <button key={ex} className="btn-ghost" onClick={() => { setQuery(ex); setAsked(ex); }}>{ex}</button>)}
      </div>
      {asked && (
        <div style={{ marginTop: 16 }}>
          {skills.length === 0 ? (
            <p className="muted">লাইব্রেরিতে এখনো কোনো স্কিল নেই, তাই পরামর্শ দেওয়া যাচ্ছে না। অ্যাডমিন স্কিল যোগ করলে এখানে পরামর্শ দেখা যাবে।</p>
          ) : results.length === 0 ? (
            <p className="muted">আপনার লেখার সাথে মিলে এমন স্কিল লাইব্রেরিতে পাওয়া যায়নি।</p>
          ) : (
            <>
              <p><strong>সেরা মিল:</strong> <Link href={`/skills/${results[0].skill.slug}`} style={{ color: 'var(--accent1)' }}>{results[0].skill.title}</Link></p>
              <p className="muted">{results[0].reason}</p>
              {results.slice(1).map((r) => (
                <p key={r.skill.id}><Link href={`/skills/${r.skill.slug}`}>{r.skill.title}</Link> <span className="muted">— {r.reason}</span></p>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
