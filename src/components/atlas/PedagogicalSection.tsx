import { ThemeCard } from './ThemeCard';
import { ContextCard } from './ContextCard';
import { GuidingQuestionsCard } from './GuidingQuestionsCard';
import { StructureGuideCard } from './StructureGuideCard';
import { SourcesCard } from './SourcesCard';
import { LockedPedagogicalCard } from './LockedPedagogicalCard';
import type { DailyTheme } from '@/data/dailyThemes';

interface PedagogicalSectionProps {
  theme: DailyTheme;
  isLocked?: boolean;
  planType?: 'free' | 'basic' | 'pro';
  hasSourcesAccess?: boolean;
}

export const PedagogicalSection = ({ 
  theme, 
  isLocked = false, 
  planType = 'pro',
  hasSourcesAccess = false,
}: PedagogicalSectionProps) => {
  if (isLocked) {
    return <LockedPedagogicalCard />;
  }

  return (
    <div className="space-y-4">
      <ThemeCard title={theme.title} motivatingText={theme.motivatingText} planType={planType} />
      <ContextCard context={theme.context} />
      <GuidingQuestionsCard questions={theme.guidingQuestions} />
      <StructureGuideCard structureGuide={theme.structureGuide} />
      {hasSourcesAccess && theme.sources && theme.sources.length > 0 && (
        <SourcesCard sources={theme.sources} />
      )}
    </div>
  );
};
