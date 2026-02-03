import { useState, useEffect } from 'react';
import { EssayState } from '@/types/atlas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ResultPanel } from './ResultPanel';
import { Sparkles, ChevronUp, Loader2, CheckCircle2 } from 'lucide-react';

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
  hasImprovedVersionAccess?: boolean;
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
  hasImprovedVersionAccess = true,
}: MobileResultsBarProps) => {
  const [open, setOpen] = useState(false);
  
  // Auto-open sheet when analysis completes
  const hasAnalysis = state.totalScore > 0;
  
  useEffect(() => {
    if (hasAnalysis && analyzedCount === totalCount) {
      setOpen(true);
    }
  }, [hasAnalysis, analyzedCount, totalCount]);
  
  // Display score: real score if available, otherwise estimated
  const displayScore = state.totalScore > 0 ? state.totalScore : estimatedScore;
  
  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 bg-background border-t border-border p-4 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-3">
        {/* Score preview */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex-1 flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gradient-primary">
                  {displayScore || '—'}
                </span>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-xs text-muted-foreground">
                    {analyzedCount}/{totalCount} blocos
                  </span>
                  {hasAnalysis && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Analisado
                    </Badge>
                  )}
                </div>
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
                hasImprovedVersionAccess={hasImprovedVersionAccess}
              />
            </div>
          </SheetContent>
        </Sheet>
        
        {/* CTA */}
        <Button
          onClick={onAnalyzeAll}
          disabled={!canAnalyze || isAnalyzing}
          size="lg"
          className="flex-shrink-0 bg-foreground hover:bg-foreground/90 text-background"
        >
          {isAnalyzing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Analisar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
