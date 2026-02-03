import { ThemeCard } from './ThemeCard';
import { ContextCard } from './ContextCard';
import { GuidingQuestionsCard } from './GuidingQuestionsCard';
import { StructureGuideCard } from './StructureGuideCard';
import { LockedOverlay } from './LockedOverlay';
import type { DailyTheme } from '@/data/dailyThemes';

interface PedagogicalSectionProps {
  theme: DailyTheme;
  isLocked?: boolean;
}

export const PedagogicalSection = ({ theme, isLocked = false }: PedagogicalSectionProps) => {
  const content = (
    <div className="space-y-4">
      <ThemeCard title={theme.title} motivatingText={theme.motivatingText} />
      <ContextCard context={theme.context} />
      <GuidingQuestionsCard questions={theme.guidingQuestions} />
      <StructureGuideCard structureGuide={theme.structureGuide} />
    </div>
  );

  if (isLocked) {
    return <LockedOverlay>{content}</LockedOverlay>;
  }

  return content;
};
