'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSkills } from '../../lib/data';
import type { Skill } from '@skillsbhandar/shared';
import { Icon } from '../../components/icons';

export default function Recent() {
  const [list, setList] = useState<Skill[]>([]);
  useEffect(() => {
    const slugs = JSON.parse(localStorage.getItem('sb-recent') || '[]') as string[];
    getSkills().then((all) => setList(slugs.map((slug) => all.find((s) => s.slug === slug)).filter(Boolean) as Skill[]));
  }, []);
  return (
    <div>
      <div className="page-head">
        <h1>সম্প্রতি দেখা</h1>
        <p className="muted">আপনি শেষে যেসব স্কিল দেখেছেন।</p>
      </div>
      <div style={{ marginTop: 20 }}>
        {list.length === 0 ? <div className="empty">এখনো কিছু দেখা হয়নি।</div> : list.map((s) => (
          <Link key={s.id} href={`/skills/${s.slug}`} className="row-card">
            <span className="row-icon"><Icon name="clock" size={19} /></span>
            <span className="row-body"><b>{s.title}</b><span>{s.short_description}</span></span>
            <span className="row-arrow"><Icon name="arrow" size={17} /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
