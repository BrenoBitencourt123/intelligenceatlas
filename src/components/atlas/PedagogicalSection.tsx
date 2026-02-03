import { ThemeCard } from './ThemeCard';
import { ContextCard } from './ContextCard';
import { GuidingQuestionsCard } from './GuidingQuestionsCard';
import { StructureGuideCard } from './StructureGuideCard';
import type { DailyTheme } from '@/data/dailyThemes';

interface PedagogicalSectionProps {
  theme: DailyTheme;
}

export const PedagogicalSection = ({ theme }: PedagogicalSectionProps) => {
  return (
    <div className="space-y-4">
      <ThemeCard title={theme.title} motivatingText={theme.motivatingText} />
      <ContextCard context={theme.context} />
      <GuidingQuestionsCard questions={theme.guidingQuestions} />
      <StructureGuideCard structureGuide={theme.structureGuide} />
    </div>
  );
};
