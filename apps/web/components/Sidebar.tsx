'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND } from '@skillsbhandar/shared';
import { Icon, type IconName } from './icons';

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'হোম', icon: 'home' },
  { href: '/explore', label: 'স্কিল ঘুরে দেখুন', icon: 'compass' },
  { href: '/tutorials', label: 'টিউটোরিয়াল', icon: 'play' },
  { href: '/bookmarks', label: 'বুকমার্ক', icon: 'bookmark' },
  { href: '/recent', label: 'সম্প্রতি দেখা', icon: 'clock' },
  { href: '/pricing', label: 'প্রাইসিং', icon: 'tag' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mobile-bar">
        <Link href="/" className="logo">
          <span className="logo-mark">S</span>
          {BRAND}
        </Link>
        <button className="icon-btn" onClick={() => setOpen(true)} aria-label="মেনু খুলুন">
          <Icon name="menu" size={20} />
        </button>
      </div>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <Link href="/" className="logo" onClick={() => setOpen(false)}>
          <span className="logo-mark">S</span>
          {BRAND}
        </Link>
        <nav className="nav">
          <div className="nav-label">লাইব্রেরি</div>
          {ITEMS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={`nav-item${pathname === it.href ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon name={it.icon} size={18} />
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <strong>লাইব্রেরি এখনো খালি</strong>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
            অ্যাডমিন ক্যাটাগরি ও স্কিল যোগ করলে এখানে দেখা যাবে।
          </p>
        </div>
      </aside>
    </>
  );
}
