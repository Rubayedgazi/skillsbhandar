'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSkills } from '../../lib/data';
import type { Skill } from '@skillsbhandar/shared';

export default function Bookmarks() {
  const [list, setList] = useState<Skill[]>([]);
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem('sb-bookmarks') || '[]') as string[];
    getSkills().then((all) => setList(all.filter((s) => ids.includes(s.id))));
  }, []);
  return (
    <div>
      <h1>বুকমার্ক</h1>
      {list.length === 0 ? <p className="muted">এখনো কোনো বুকমার্ক নেই।</p> : list.map((s) => (
        <Link key={s.id} href={`/skills/${s.slug}`} className="card" style={{ display: 'block', padding: 14, marginBottom: 8 }}>{s.title}</Link>
      ))}
    </div>
  );
}
