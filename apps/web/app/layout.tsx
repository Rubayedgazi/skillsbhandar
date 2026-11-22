import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';

export const metadata: Metadata = {
  title: 'SkillsBhandar — আপনার সব AI কাজ। এক লাইব্রেরি।',
  description: 'আপনার সব AI কাজ। এক লাইব্রেরি।',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" data-theme="dark">
      <body>
        <div className="shell">
          <Sidebar />
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
