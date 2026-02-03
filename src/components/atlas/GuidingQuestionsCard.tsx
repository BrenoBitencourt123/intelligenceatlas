import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface GuidingQuestionsCardProps {
  questions: string[];
}

export const GuidingQuestionsCard = ({ questions }: GuidingQuestionsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-foreground" />
              <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Perguntas Norteadoras
              </span>
            </div>
            <div
              className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center transition-colors',
                'bg-muted group-hover:bg-muted-foreground/20'
              )}
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <ul className="space-y-3">
              {questions.map((question, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {question}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-start gap-2 pt-2 border-t border-border">
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                São apenas guias para reflexão. Não há respostas certas ou erradas.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
