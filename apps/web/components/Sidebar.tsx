'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND } from '@skillsbhandar/shared';

const ITEMS = [
  { href: '/', label: 'হোম' },
  { href: '/explore', label: 'স্কিল ঘুরে দেখুন' },
  { href: '/tutorials', label: 'টিউটোরিয়াল' },
  { href: '/bookmarks', label: 'বুকমার্ক' },
  { href: '/recent', label: 'সম্প্রতি দেখা' },
  { href: '/account', label: 'অ্যাকাউন্ট' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', padding: 20, minHeight: '100vh', position: 'sticky', top: 0, height: '100vh' }}>
      <Link href="/" style={{ fontSize: 22, fontWeight: 800 }}>{BRAND}</Link>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 28 }}>
        {ITEMS.map((it) => (
          <Link key={it.href} href={it.href} style={{ padding: '10px 12px', borderRadius: 10, background: pathname === it.href ? 'var(--surface3)' : 'transparent', fontWeight: pathname === it.href ? 700 : 400 }}>
            {it.label}
          </Link>
        ))}
      </nav>
      <p className="muted" style={{ fontSize: 13, marginTop: 28 }}>লাইব্রেরি এখনো খালি — অ্যাডমিন ক্যাটাগরি ও স্কিল যোগ করলে এখানে দেখা যাবে।</p>
    </aside>
  );
}
