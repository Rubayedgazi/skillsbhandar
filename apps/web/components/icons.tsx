/** Inline SVG icons (stroke, currentColor). No emoji, no external assets. */
const PATHS: Record<string, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6" />,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>,
  play: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3z" /></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  sparkles: <><path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z" /><path d="M18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  pen: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
  code: <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />,
  layout: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></>,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6z" />,
  palette: <><circle cx="12" cy="12" r="9" /><circle cx="8.5" cy="10" r="1" /><circle cx="12" cy="7.5" r="1" /><circle cx="15.5" cy="10" r="1" /><path d="M12 21a9 9 0 0 0 9-9c0-2-1.5-3-3-3h-2a2.5 2.5 0 0 1-2-4" /></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  download: <path d="M12 3v12M6 11l6 6 6-6M4 21h16" />,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  check: <path d="m4 12.5 5 5L20 6.5" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3 3.5-4.5 6.5-4.5s5.5 1.5 6.5 4.5M16 4.5a3.5 3.5 0 0 1 0 7M17.5 15.5c2 .7 3.5 2 4 4.5" /></>,
  shield: <><path d="M12 2 4 5.5V11c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5.5z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.24.6.86 1 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" /></>,
  flag: <path d="M5 21V4M5 4h13l-2.5 4L18 12H5" />,
  activity: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  trending: <><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></>,
  clapperboard: <><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.3 1.5-2.6l15-3.9c1.1-.3 2.3.3 2.6 1.5z" /><path d="M3 11v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M7 8l3-1M12 6.7 15 5.8M17 5.5l2-.6" /></>,
  terminal: <><path d="m4 17 6-5-6-5M12 19h8" /></>,
  tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-8-8V4h8.6l8 8a2 2 0 0 1 1.4 1.4z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  blocks: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="8.5" y="12.5" width="7" height="7" rx="1" /></>,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/**
 * Category tile icon and colour, exactly as in the preview design:
 * SEO & Marketing violet/trending-up, Content Creation pink/clapperboard,
 * Coding & Development emerald/terminal, Website Design & UI/UX blue/layout,
 * Business & Entrepreneurship amber/briefcase, Productivity & Automation cyan/blocks,
 * Design & Creative purple/palette, Research & Data lime/database.
 */
export function categoryIcon(slug: string): IconName {
  if (slug.includes('seo') || slug.includes('marketing')) return 'trending';
  if (slug.includes('content')) return 'clapperboard';
  if (slug.includes('coding') || slug.includes('development')) return 'terminal';
  if (slug.includes('website') || slug.includes('ui')) return 'layout';
  if (slug.includes('business') || slug.includes('entrepreneur')) return 'briefcase';
  if (slug.includes('productivity') || slug.includes('automation')) return 'blocks';
  if (slug.includes('design') || slug.includes('creative')) return 'palette';
  if (slug.includes('research') || slug.includes('data')) return 'database';
  return 'grid';
}

export function categoryColor(slug: string): string {
  if (slug.includes('seo') || slug.includes('marketing')) return '#8b5cf6';
  if (slug.includes('content')) return '#ec4899';
  if (slug.includes('coding') || slug.includes('development')) return '#10b981';
  if (slug.includes('website') || slug.includes('ui')) return '#3b82f6';
  if (slug.includes('business') || slug.includes('entrepreneur')) return '#f59e0b';
  if (slug.includes('productivity') || slug.includes('automation')) return '#06b6d4';
  if (slug.includes('design') || slug.includes('creative')) return '#a855f7';
  if (slug.includes('research') || slug.includes('data')) return '#84cc16';
  return '#7c5cff';
}
