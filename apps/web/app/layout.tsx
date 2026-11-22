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
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <div style={{ flex: 1, minWidth: 0 }}>
            <header style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px' }}>
              <ThemeToggle />
              <a className="btn-ghost" href="/signin">সাইন ইন</a>
            </header>
            <main style={{ padding: '0 24px 40px' }}>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
