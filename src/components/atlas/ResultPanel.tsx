import { EssayState, Competency } from '@/types/atlas';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Copy, 
  Eye, 
  EyeOff,
  ArrowRight,
  FileText,
  Award,
  Wand2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ResultPanelProps {
  state: EssayState;
  analyzedCount: number;
  totalCount: number;
  estimatedScore: number;
  canGenerateImproved: boolean;
  onGenerateImproved: () => void;
  onToggleOriginal: () => void;
  isGenerating?: boolean;
}

export const ResultPanel = ({
  state,
  analyzedCount,
  totalCount,
  estimatedScore,
  canGenerateImproved,
  onGenerateImproved,
  onToggleOriginal,
  isGenerating = false,
}: ResultPanelProps) => {
  const progress = (analyzedCount / totalCount) * 100;
  const hasImproved = !!state.improvedVersion;
  
  const copyImproved = () => {
    if (state.improvedVersion) {
      navigator.clipboard.writeText(state.improvedVersion);
      toast.success('Versão melhorada copiada!');
    }
  };
  
  const fullText = state.blocks.map(b => b.text).join('\n\n');
  
  const nextSteps = getNextSteps(state);
  
  return (
    <div className="bg-card rounded-xl border border-border shadow-panel overflow-hidden">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 p-0 h-auto">
          <TabsTrigger 
            value="summary" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-5 py-3.5 text-sm font-medium"
          >
            <FileText className="h-4 w-4 mr-2" />
            Resumo
          </TabsTrigger>
          <TabsTrigger 
            value="competencies"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-5 py-3.5 text-sm font-medium"
          >
            <Award className="h-4 w-4 mr-2" />
            Competências
          </TabsTrigger>
        </TabsList>
        
        {/* Summary Tab */}
        <TabsContent value="summary" className="p-6 space-y-6 mt-0">
          {/* Score Section */}
          <div className="text-center space-y-3 py-6 border-b border-border">
            <div className="inline-flex items-center justify-center">
              <div className="score-display text-5xl font-bold">
                {state.totalScore || estimatedScore || '—'}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {state.totalScore ? 'Nota estimada (ENEM)' : 'Estimativa parcial'}
            </p>
          </div>
          
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Blocos analisados</span>
              <span className="text-sm font-semibold text-foreground">{analyzedCount}/{totalCount}</span>
            </div>
            <div className="progress-bar h-2">
              <div 
                className="progress-bar-fill h-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* Next steps - only show if no improved version yet */}
          {!hasImproved && nextSteps.length > 0 && (
            <div className="space-y-4 pt-2">
              <h4 className="font-semibold text-sm text-foreground">Próximos passos</h4>
              <ul className="space-y-3">
                {nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Generate improved button - show when no improved version */}
          {!hasImproved && (
            <div className="pt-4 space-y-4">
              <Button
                className="w-full h-12 text-base font-medium"
                size="lg"
                onClick={onGenerateImproved}
                disabled={!canGenerateImproved || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Gerar versão melhorada
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
                Gere a versão melhorada para aprender com uma escrita mais clara mantendo suas ideias.
              </p>
            </div>
          )}
          
          {/* Improved version inline - shows after generation */}
          {hasImproved && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  Versão melhorada
                </h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleOriginal}
                  >
                    {state.showOriginal ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1.5" />
                        Ver melhorada
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1.5" />
                        Ver original
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyImproved}
                  >
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copiar
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4 max-h-[350px] overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {state.showOriginal ? fullText : state.improvedVersion}
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground text-center bg-warning/10 text-warning-foreground p-3 rounded-lg">
                Use como referência para aprender, não para copiar.
              </p>
              
              {/* Regenerate button */}
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={onGenerateImproved}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar nova versão
                  </>
                )}
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Competencies Tab */}
        <TabsContent value="competencies" className="p-5 space-y-4 mt-0">
          {state.competencies.map((comp) => (
            <CompetencyCard key={comp.id} competency={comp} />
          ))}
          
          {analyzedCount === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Analise ao menos um bloco para ver as competências.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const CompetencyCard = ({ competency }: { competency: Competency }) => {
  const scoreLevel = competency.score >= 160 ? 'high' : competency.score >= 80 ? 'mid' : 'low';
  
  return (
    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-foreground">
          {competency.name}
        </span>
        <span className={cn(
          'font-bold text-sm',
          scoreLevel === 'high' && 'text-primary',
          scoreLevel === 'mid' && 'text-warning',
          scoreLevel === 'low' && 'text-destructive',
        )}>
          {competency.score}/200
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {competency.description}
      </p>
      {competency.score > 0 && (
        <p className="text-xs text-foreground/80 pt-1">
          {competency.explanation}
        </p>
      )}
    </div>
  );
};

const getNextSteps = (state: EssayState): string[] => {
  const steps: string[] = [];
  
  const emptyBlocks = state.blocks.filter(b => b.status === 'empty');
  const draftBlocks = state.blocks.filter(b => b.status === 'draft');
  const analyzedBlocks = state.blocks.filter(b => b.status === 'analyzed');
  
  if (emptyBlocks.length > 0) {
    steps.push(`Preencha ${emptyBlocks.length === 1 ? 'o bloco' : 'os blocos'}: ${emptyBlocks.map(b => b.title).join(', ')}`);
  }
  
  if (draftBlocks.length > 0) {
    steps.push(`Analise ${draftBlocks.length === 1 ? 'o rascunho' : 'os rascunhos'} para feedback detalhado`);
  }
  
  if (analyzedBlocks.length > 0 && analyzedBlocks.length < state.blocks.length) {
    steps.push('Complete a análise de todos os blocos para nota mais precisa');
  }
  
  if (analyzedBlocks.length === state.blocks.length && !state.improvedVersion) {
    steps.push('Gere a versão melhorada para comparar e aprender');
  }
  
  if (steps.length === 0) {
    steps.push('Continue praticando com novos temas!');
  }
  
  return steps.slice(0, 3);
};
