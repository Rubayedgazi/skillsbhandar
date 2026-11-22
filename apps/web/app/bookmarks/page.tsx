'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSkills } from '../../lib/data';
import type { Skill } from '@skillsbhandar/shared';
import { Icon } from '../../components/icons';

export default function Bookmarks() {
  const [list, setList] = useState<Skill[]>([]);
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem('sb-bookmarks') || '[]') as string[];
    getSkills().then((all) => setList(all.filter((s) => ids.includes(s.id))));
  }, []);
  return (
    <div>
      <div className="page-head">
        <h1>বুকমার্ক</h1>
        <p className="muted">আপনার সংরক্ষিত স্কিলগুলো।</p>
      </div>
      <div style={{ marginTop: 20 }}>
        {list.length === 0 ? <div className="empty">এখনো কোনো বুকমার্ক নেই।</div> : list.map((s) => (
          <Link key={s.id} href={`/skills/${s.slug}`} className="row-card">
            <span className="row-icon"><Icon name="bookmark" size={19} /></span>
            <span className="row-body"><b>{s.title}</b><span>{s.short_description}</span></span>
            <span className="row-arrow"><Icon name="arrow" size={17} /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
