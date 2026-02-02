import { useState } from 'react';
import { EssayState } from '@/types/atlas';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ResultPanel } from './ResultPanel';
import { Sparkles, ChevronUp, Loader2 } from 'lucide-react';

interface MobileResultsBarProps {
  state: EssayState;
  analyzedCount: number;
  totalCount: number;
  estimatedScore: number;
  canGenerateImproved: boolean;
  onGenerateImproved: () => void;
  onToggleOriginal: () => void;
  onAnalyzeAll: () => void;
  isAnalyzing: boolean;
  isGenerating: boolean;
  canAnalyze: boolean;
}

export const MobileResultsBar = ({
  state,
  analyzedCount,
  totalCount,
  estimatedScore,
  canGenerateImproved,
  onGenerateImproved,
  onToggleOriginal,
  onAnalyzeAll,
  isAnalyzing,
  isGenerating,
  canAnalyze,
}: MobileResultsBarProps) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 md:hidden">
      <div className="flex items-center gap-3">
        {/* Score preview */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex-1 flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gradient-primary">
                  {state.totalScore || estimatedScore || '—'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {analyzedCount}/{totalCount} blocos
                </span>
              </div>
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <div className="overflow-y-auto h-full">
              <ResultPanel
                state={state}
                analyzedCount={analyzedCount}
                totalCount={totalCount}
                estimatedScore={estimatedScore}
                canGenerateImproved={canGenerateImproved}
                onGenerateImproved={onGenerateImproved}
                onToggleOriginal={onToggleOriginal}
                isGenerating={isGenerating}
              />
            </div>
          </SheetContent>
        </Sheet>
        
        {/* CTA */}
        <Button
          onClick={onAnalyzeAll}
          disabled={!canAnalyze || isAnalyzing}
          className="flex-shrink-0"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
