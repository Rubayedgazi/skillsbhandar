import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'SkillsBhandar Admin', description: 'SkillsBhandar Admin — owner and staff only.' };
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
