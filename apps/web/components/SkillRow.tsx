import Link from 'next/link';
import type { Skill } from '@skillsbhandar/shared';
import { Icon } from './icons';

/**
 * YouTube-style skill row: one full-width horizontal row with a large
 * 16:9 thumbnail on the left and title / description / meta on the
 * right, stacked vertically like YouTube search results.
 * Used in every skill list on the public site (homepage, Explore,
 * category page, related skills, bookmarks, recently viewed).
 * Skills without an uploaded image keep the book icon inside the
 * same 16:9 frame, so the row never breaks.
 */
function difficultyLabel(d: Skill['difficulty']): string {
  if (d === 'intermediate') return 'Intermediate';
  if (d === 'advanced') return 'Advanced';
  return 'Beginner';
}

export function skillMeta(skill: Skill, categoryName?: string): string {
  const parts: string[] = [];
  if (categoryName) parts.push(categoryName);
  parts.push(difficultyLabel(skill.difficulty));
  if (skill.setup_time_minutes) parts.push(`${skill.setup_time_minutes} মিনিট`);
  parts.push(`${skill.download_count} ডাউনলোড`);
  return parts.join(' • ');
}

export function SkillRow({ skill, categoryName }: { skill: Skill; categoryName?: string }) {
  return (
    <Link href={`/skills/${skill.slug}`} className="yt-row">
      <span className="yt-thumb">
        {skill.preview_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={skill.preview_image_url} alt="" />
        ) : (
          <Icon name="book" size={34} />
        )}
      </span>
      <span className="yt-body">
        <b className="yt-title">{skill.title}</b>
        <span className="yt-desc">{skill.short_description}</span>
        <span className="yt-meta">{skillMeta(skill, categoryName)}</span>
      </span>
    </Link>
  );
}
