import { notFound } from 'next/navigation';
import { getCategories, getSkillBySlug, getSkills } from '../../../lib/data';
import SkillDetail from './SkillDetail';

export const revalidate = 60;

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);
  if (!skill) notFound();
  const [all, categories] = await Promise.all([getSkills(), getCategories()]);
  const related = all.filter((s) => s.id !== skill.id && s.category_id === skill.category_id).slice(0, 4);
  const category = categories.find((c) => c.id === skill.category_id) || null;
  return <SkillDetail skill={skill} related={related} categoryName={category?.name || ''} />;
}
