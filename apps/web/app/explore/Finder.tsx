'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { findSkills, type Category, type Skill } from '@skillsbhandar/shared';
import { Icon } from '../../components/icons';

const EXAMPLES = ['ল্যান্ডিং পেজ বানাতে চাই', 'SEO করতে চাই', 'ভিডিও স্ক্রিপ্ট লিখতে চাই', 'ডেটা বিশ্লেষণ করতে চাই'];

export default function Finder({ skills, categories }: { skills: Skill[]; categories: Category[] }) {
  const [query, setQuery] = useState('');
  const [asked, setAsked] = useState('');
  const results = useMemo(() => (asked ? findSkills(asked, skills, categories) : []), [asked, skills, categories]);
  return (
    <div className="finder-card">
      <h2><Icon name="sparkles" size={21} /> AI স্কিল ফাইন্ডার</h2>
      <p className="muted" style={{ margin: '6px 0 0' }}>আপনি কী করতে চান, লিখুন — বাংলা বা ইংরেজিতে।</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setAsked(query); }}
          placeholder="যেমন: ল্যান্ডিং পেজ বানাতে চাই"
          aria-label="আপনি কী করতে চান"
        />
        <button className="btn" onClick={() => setAsked(query)}><Icon name="search" size={17} /> খুঁজুন</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {EXAMPLES.map((ex) => (
          <button key={ex} className="chip" onClick={() => { setQuery(ex); setAsked(ex); }}>{ex}</button>
        ))}
      </div>
      {asked && (
        <div style={{ marginTop: 16 }}>
          {skills.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>লাইব্রেরিতে এখনো কোনো স্কিল নেই, তাই পরামর্শ দেওয়া যাচ্ছে না। অ্যাডমিন স্কিল যোগ করলে এখানে পরামর্শ দেখা যাবে।</p>
          ) : results.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>আপনার লেখার সাথে মিলে এমন স্কিল লাইব্রেরিতে পাওয়া যায়নি।</p>
          ) : (
            <>
              <div className="best-match">
                <span className="pill">সেরা মিল</span>
                <p style={{ margin: '10px 0 4px' }}>
                  <Link href={`/skills/${results[0].skill.slug}`} style={{ fontWeight: 700, fontSize: 17 }}>{results[0].skill.title}</Link>
                </p>
                <p className="muted" style={{ margin: 0 }}>{results[0].reason}</p>
              </div>
              {results.slice(1).map((r) => (
                <Link key={r.skill.id} href={`/skills/${r.skill.slug}`} className="row-card" style={{ marginTop: 9 }}>
                  <span className="row-icon"><Icon name="book" size={19} /></span>
                  <span className="row-body"><b>{r.skill.title}</b><span>{r.reason}</span></span>
                  <span className="row-arrow"><Icon name="arrow" size={17} /></span>
                </Link>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
