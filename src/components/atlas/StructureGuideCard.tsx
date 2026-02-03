import { useState } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { StructureItem } from '@/data/dailyThemes';

interface StructureGuideCardProps {
  structureGuide: StructureItem[];
}

export const StructureGuideCard = ({ structureGuide }: StructureGuideCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <div className="flex items-center gap-2">
              <List className="h-5 w-5 text-foreground" />
              <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Estrutura Sugerida
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
          <CardContent className="pt-0">
            <ul className="space-y-3">
              {structureGuide.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
