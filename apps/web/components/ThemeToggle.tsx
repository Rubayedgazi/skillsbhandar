'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('sb-theme') : null;
    if (saved === 'light' || saved === 'dark') setTheme(saved as 'dark' | 'light');
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { window.localStorage.setItem('sb-theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);
  return (
    <button className="btn-ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️ হালকা' : '🌙 গাঢ়'}
    </button>
  );
}
