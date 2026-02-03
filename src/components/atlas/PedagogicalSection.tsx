import { ThemeCard } from './ThemeCard';
import { ContextCard } from './ContextCard';
import { GuidingQuestionsCard } from './GuidingQuestionsCard';
import { StructureGuideCard } from './StructureGuideCard';
import { LockedPedagogicalCard } from './LockedPedagogicalCard';
import type { DailyTheme } from '@/data/dailyThemes';

interface PedagogicalSectionProps {
  theme: DailyTheme;
  isLocked?: boolean;
}

export const PedagogicalSection = ({ theme, isLocked = false }: PedagogicalSectionProps) => {
  if (isLocked) {
    return <LockedPedagogicalCard />;
  }

  return (
    <div className="space-y-4">
      <ThemeCard title={theme.title} motivatingText={theme.motivatingText} />
      <ContextCard context={theme.context} />
      <GuidingQuestionsCard questions={theme.guidingQuestions} />
      <StructureGuideCard structureGuide={theme.structureGuide} />
    </div>
  );
};
