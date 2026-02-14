import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BookOpen, Brain, ChevronDown, ChevronUp, ExternalLink, Lightbulb, Play, Search, Loader2 } from 'lucide-react';
import MarkdownText from '@/components/atlas/MarkdownText';
import type { QuestionPedagogy } from '@/hooks/useQuestionPedagogy';

interface PedagogyBlocksProps {
  pedagogy: QuestionPedagogy | null;
  loading: boolean;
  showPostAnswer: boolean;
  onFindSimilar?: () => void;
}

export function PreConceptBlock({ pedagogy, loading }: { pedagogy: QuestionPedagogy | null; loading: boolean }) {
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando conceitos...
      </div>
    );
  }

  if (!pedagogy?.pre_concept) return null;

  const { explanation, formula, bullets, skill } = pedagogy.pre_concept as any;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between gap-2 hover:bg-amber-500/10 transition-colors">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm font-semibold text-foreground">Antes de responder, saiba isso</span>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-b-lg border border-t-0 border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
          {skill && (
            <div className="flex items-start gap-2 bg-amber-600/10 rounded-md px-3 py-2">
              <Brain className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300 mt-0.5 shrink-0" />
              <span className="text-xs font-medium text-amber-800 dark:text-amber-200">{skill}</span>
            </div>
          )}
          <p className="text-sm text-foreground/90 leading-relaxed">{explanation}</p>
          {formula && (
            <div className="bg-background/60 rounded-md px-3 py-2 font-mono text-sm text-primary border">
              {formula}
            </div>
          )}
          <ul className="space-y-1">
            {bullets.map((b: string, i: number) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PostAnswerBlocks({ pedagogy, loading, onFindSimilar }: PedagogyBlocksProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-muted p-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Gerando análise pedagógica...
      </div>
    );
  }

  if (!pedagogy) return null;

  return (
    <div className="space-y-3">
      {/* Cognitive Pattern */}
      {pedagogy.cognitive_pattern && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-500/10">
            <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-foreground">O que o ENEM quis cobrar aqui?</span>
          </div>
          <div className="p-4">
            <MarkdownText content={pedagogy.cognitive_pattern} className="text-sm text-muted-foreground leading-relaxed" />
          </div>
        </div>
      )}

      {/* Deep Lesson */}
      {pedagogy.deep_lesson && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-green-500/10">
            <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-foreground">Entenda de vez</span>
          </div>
          <div className="p-4">
            <MarkdownText content={pedagogy.deep_lesson} className="text-sm text-muted-foreground leading-relaxed" />
          </div>
        </div>
      )}

      {/* Similar Question Button */}
      {onFindSimilar && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-sm"
          onClick={onFindSimilar}
        >
          <Search className="h-3.5 w-3.5" />
          Resolver questão parecida agora
        </Button>
      )}

      {/* Video Suggestions */}
      {pedagogy.video_suggestions && pedagogy.video_suggestions.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button className="w-full rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 flex items-center justify-between gap-2 hover:bg-purple-500/10 transition-colors">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-foreground">Quer aprofundar?</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="rounded-b-lg border border-t-0 border-purple-500/20 bg-purple-500/5 p-3 space-y-2">
              {pedagogy.video_suggestions.map((v, i) => (
                <a
                  key={i}
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {v.title}
                </a>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
