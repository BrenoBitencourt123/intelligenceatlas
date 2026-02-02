import { useState, useCallback, useMemo } from 'react';
import { Block, BlockType } from '@/types/atlas';
import { runPrecheck } from '@/lib/precheck';
import { StatusPill } from './StatusPill';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Sparkles, 
  Trash2, 
  X, 
  CheckCircle2, 
  Circle,
  Lightbulb,
  BookOpen,
  ClipboardList,
  Quote,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockCardProps {
  block: Block;
  onTextChange: (text: string) => void;
  onClear: () => void;
  onAnalyze: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
  isAnalyzing?: boolean;
}

export const BlockCard = ({
  block,
  onTextChange,
  onClear,
  onAnalyze,
  onRemove,
  canRemove = false,
  isAnalyzing = false,
}: BlockCardProps) => {
  const precheck = useMemo(() => runPrecheck(block.type, block.text), [block.type, block.text]);
  
  const hasContent = block.text.trim().length > 0;
  const hasAnalysis = block.status === 'analyzed' && block.analysis;
  const isUnavailable = block.status === 'unavailable';
  
  // Only show AI checklist after analysis - no local precheck displayed
  const displayChecklist = useMemo(() => {
    if (hasAnalysis && block.analysis?.checklist && block.analysis.checklist.length > 0) {
      return block.analysis.checklist;
    }
    return []; // Don't show checklist before AI analysis
  }, [hasAnalysis, block.analysis]);
  
  return (
    <div className="block-card animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground">{block.title}</h3>
          <StatusPill status={block.status} />
        </div>
        {canRemove && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Textarea */}
      <div className="relative">
        <textarea
          className="block-textarea"
          placeholder={getPlaceholder(block.type)}
          value={block.text}
          onChange={(e) => onTextChange(e.target.value)}
        />
        
        {/* Word count */}
        <div className="absolute bottom-3 right-4 text-xs text-muted-foreground">
          {block.wordCount} {block.wordCount === 1 ? 'palavra' : 'palavras'}
        </div>
      </div>
      
      {/* Footer actions */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={!hasContent || isAnalyzing}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1.5" />
          Limpar
        </Button>
        
        <Button
          size="sm"
          onClick={onAnalyze}
          disabled={!hasContent || isAnalyzing}
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
              Analisar bloco
            </>
          )}
        </Button>
      </div>
      
      {/* Feedback section */}
      {(hasContent || hasAnalysis || isUnavailable) && (
        <div className="border-t border-border/50">
          {/* Unavailable message */}
          {isUnavailable && (
            <div className="px-5 py-4 bg-red-50 text-red-700 text-sm">
              <p className="font-medium">Correção automática indisponível no momento.</p>
              <p className="text-red-600 mt-1">Tente novamente em alguns instantes.</p>
            </div>
          )}
          
          {/* Analysis summary (always visible when analyzed) */}
          {hasAnalysis && block.analysis && (
            <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-medium text-emerald-800 text-sm mb-1">
                    Avaliação do corretor
                  </h4>
                  <p className="text-emerald-700 text-sm leading-relaxed">
                    {block.analysis.summary}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Accordions */}
          <Accordion type="multiple" className="px-2 py-2">
            {/* Why it matters */}
            {hasAnalysis && block.analysis?.whyItMatters && (
              <AccordionItem value="why" className="border-none">
                <AccordionTrigger className="accordion-trigger-atlas">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Por que isso importa no ENEM?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed">
                  {block.analysis.whyItMatters}
                </AccordionContent>
              </AccordionItem>
            )}
            
            {/* Checklist - only shown after AI analysis */}
            {hasAnalysis && displayChecklist.length > 0 && (
              <AccordionItem value="checklist" className="border-none">
                <AccordionTrigger className="accordion-trigger-atlas">
                  <span className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Checklist do corretor
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({displayChecklist.filter(i => i.checked).length}/{displayChecklist.length})
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1">
                  <ul className="space-y-2">
                    {displayChecklist.map((item) => (
                      <li key={item.id} className="flex items-start gap-2.5">
                        {item.checked ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <span className={cn(
                            'text-sm',
                            item.checked ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {item.label}
                          </span>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {/* Text evidence */}
            {hasAnalysis && block.analysis?.textEvidence && block.analysis.textEvidence.length > 0 && (
              <AccordionItem value="evidence" className="border-none">
                <AccordionTrigger className="accordion-trigger-atlas">
                  <span className="flex items-center gap-2">
                    <Quote className="h-4 w-4 text-primary" />
                    No seu texto
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 space-y-3">
                  {block.analysis.textEvidence.map((evidence, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm italic text-muted-foreground mb-2">
                        "{evidence.quote}"
                      </p>
                      <p className="text-sm text-foreground">
                        <span className="font-medium text-amber-600">Problema:</span> {evidence.issue}
                      </p>
                      <p className="text-sm text-foreground mt-1">
                        <span className="font-medium text-emerald-600">Sugestão:</span> {evidence.suggestion}
                      </p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}
            
            {/* How to improve */}
            {hasAnalysis && block.analysis?.howToImprove && block.analysis.howToImprove.length > 0 && (
              <AccordionItem value="improve" className="border-none">
                <AccordionTrigger className="accordion-trigger-atlas">
                  <span className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                    Como melhorar
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1">
                  <ol className="space-y-2 list-decimal list-inside">
                    {block.analysis.howToImprove.map((step, i) => (
                      <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {/* Precheck suggestions (when no AI analysis) */}
            {!hasAnalysis && precheck.suggestions.length > 0 && (
              <AccordionItem value="suggestions" className="border-none">
                <AccordionTrigger className="accordion-trigger-atlas">
                  <span className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                    Sugestões
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1">
                  <ul className="space-y-2">
                    {precheck.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      )}
    </div>
  );
};

const getPlaceholder = (type: BlockType): string => {
  switch (type) {
    case 'introduction':
      return 'Escreva sua introdução aqui. Contextualize o tema e apresente sua tese...';
    case 'development':
      return 'Desenvolva seu argumento com exemplos concretos e dados...';
    case 'conclusion':
      return 'Apresente sua proposta de intervenção: quem, o quê, como e para quê...';
  }
};
