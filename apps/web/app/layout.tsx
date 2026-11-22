import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import { getCategories } from '../lib/data';

export const metadata: Metadata = {
  title: 'SkillsBhandar — আপনার সব AI কাজ। এক লাইব্রেরি।',
  description: 'আপনার সব AI কাজ। এক লাইব্রেরি।',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <html lang="bn" data-theme="dark">
      <body>
        <div className="shell">
          <Sidebar categories={categories} />
          <div className="content">
            <header className="topbar">
              <span className="crumb">SkillsBhandar</span>
              <div className="topbar-actions">
                <ThemeToggle />
                <a className="btn-ghost" href="/signin">সাইন ইন</a>
              </div>
            </header>
            <main className="main">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
