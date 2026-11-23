'use client';
import { useEffect, useState } from 'react';
import { getSkills } from '../../lib/data';
import type { Skill } from '@skillsbhandar/shared';
import { SkillRow } from '../../components/SkillRow';

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
          <SkillRow key={s.id} skill={s} />
        ))}
      </div>
    </div>
  );
}
