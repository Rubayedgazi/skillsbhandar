'use client';
import { useEffect, useState } from 'react';
import { Icon } from './icons';

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
    <button
      className="icon-btn"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'হালকা থিম' : 'গাঢ় থিম'}
      title={theme === 'dark' ? 'হালকা থিম' : 'গাঢ় থিম'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
    </button>
  );
}
