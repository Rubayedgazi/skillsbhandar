'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSkills } from '../../lib/data';
import type { Skill } from '@skillsbhandar/shared';

export default function Recent() {
  const [list, setList] = useState<Skill[]>([]);
  useEffect(() => {
    const slugs = JSON.parse(localStorage.getItem('sb-recent') || '[]') as string[];
    getSkills().then((all) => setList(slugs.map((slug) => all.find((s) => s.slug === slug)).filter(Boolean) as Skill[]));
  }, []);
  return (
    <div>
      <h1>সম্প্রতি দেখা</h1>
      {list.length === 0 ? <p className="muted">এখনো কিছু দেখা হয়নি।</p> : list.map((s) => (
        <Link key={s.id} href={`/skills/${s.slug}`} className="card" style={{ display: 'block', padding: 14, marginBottom: 8 }}>{s.title}</Link>
      ))}
    </div>
  );
}
