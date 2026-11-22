import { Icon } from './icons';

/**
 * Skill thumbnail: shows the uploaded image when the skill has one,
 * otherwise the usual book icon. Used in every skill list on the
 * public site (homepage, Explore, category page, related skills).
 */
export function SkillThumb({ src, alt }: { src: string | null | undefined; alt?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || ''} className="row-thumb" />;
  }
  return (
    <span className="row-icon">
      <Icon name="book" size={19} />
    </span>
  );
}
