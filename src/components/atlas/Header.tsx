import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Scissors, 
  Plus,
  Loader2,
} from 'lucide-react';

interface HeaderProps {
  onAnalyzeAll: () => void;
  onPasteDivide: () => void;
  onAddDevelopment: () => void;
  isAnalyzing: boolean;
  canAnalyze: boolean;
}

export const Header = ({
  onAnalyzeAll,
  onPasteDivide,
  onAddDevelopment,
  isAnalyzing,
  canAnalyze,
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title section */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground">
                  Redação ENEM
                </h1>
                <span className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                  ENEM
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Correção por blocos • Pré-check automático + IA onde agrega
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={onPasteDivide}
              className="text-muted-foreground"
            >
              <Scissors className="h-4 w-4 mr-1.5" />
              Colar e dividir
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onAddDevelopment}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar desenvolvimento
            </Button>
            
            <Button
              size="sm"
              onClick={onAnalyzeAll}
              disabled={!canAnalyze || isAnalyzing}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Analisar tudo
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
