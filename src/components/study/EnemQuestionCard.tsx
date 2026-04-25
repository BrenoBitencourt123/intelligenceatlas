import React, { useState } from 'react';
import { renderMath } from '@/lib/renderMath';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  EnemQuestion,
  EnemContentBlock,
  EnemAlternative,
} from '@/types/enemQuestion';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/* ── helpers ─────────────────────────────────────────── */

function mathHtml(text: string): string {
  // Escape basic HTML then apply renderMath
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return renderMath(escaped);
}

/* ── sub-components ──────────────────────────────────── */

function ContentText({ block }: { block: EnemContentBlock }) {
  const isMuted = block.format?.color === 'muted';
  const align = block.format?.align ?? 'left';

  return (
    <div
      className={cn(
        'whitespace-pre-wrap leading-relaxed font-normal',
        isMuted
          ? 'text-muted-foreground text-xs'
          : 'text-muted-foreground text-sm',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
      )}
      dangerouslySetInnerHTML={{ __html: mathHtml(block.value ?? '') }}
    />
  );
}

function ContentImage({ block }: { block: EnemContentBlock }) {
  if (!block.data) return null;
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <img
        src={block.data}
        alt={block.caption || 'Imagem da questão'}
        className="max-h-[280px] w-auto rounded-lg border border-border object-contain"
        loading="lazy"
      />
      {block.caption && (
        <figcaption className="text-[11px] text-muted-foreground italic text-center">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function Alternative({
  letter,
  alt,
  selected,
  onSelect,
}: {
  letter: string;
  alt: EnemAlternative;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 w-full rounded-xl border px-4 py-3 text-left transition-colors',
        selected
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
          : 'border-border bg-card hover:bg-muted/40',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
          selected
            ? 'bg-violet-500 text-white'
            : 'border border-border bg-muted text-muted-foreground',
        )}
      >
        {letter}
      </span>
      <div className="flex-1 pt-0.5">
        <span
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: mathHtml(alt.text) }}
        />
        {alt.image && (
          <img
            src={alt.image}
            alt={`Alternativa ${letter}`}
            className="mt-2 max-h-[180px] w-auto rounded-lg border border-border object-contain"
            loading="lazy"
          />
        )}
      </div>
    </button>
  );
}

/* ── main component ──────────────────────────────────── */

interface EnemQuestionCardProps {
  question: EnemQuestion;
  selectedAnswer?: number | null;
  onSelectAnswer?: (index: number) => void;
}

export default function EnemQuestionCard({
  question,
  selectedAnswer: controlledAnswer,
  onSelectAnswer,
}: EnemQuestionCardProps) {
  const [internalAnswer, setInternalAnswer] = useState<number | null>(null);
  const selected = controlledAnswer ?? internalAnswer;

  const handleSelect = (idx: number) => {
    if (onSelectAnswer) {
      onSelectAnswer(idx);
    } else {
      setInternalAnswer(idx);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-2">
        <Badge variant="secondary" className="text-xs font-medium">
          {question.exam}
        </Badge>
        <span className="text-xs text-muted-foreground font-medium">
          Questão {question.number}
        </span>
      </div>

      {/* Content blocks */}
      <div className="px-5 space-y-4 pb-4">
        {question.content.map((block, idx) => (
          <React.Fragment key={idx}>
            {block.type === 'text' && <ContentText block={block} />}
            {block.type === 'image' && <ContentImage block={block} />}
            {block.type === 'table' && <ContentTable block={block} />}
          </React.Fragment>
        ))}
      </div>

      {/* Command */}
      {question.command && (
        <div className="px-5 pb-5">
          <p
            className="text-base font-bold text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: mathHtml(question.command) }}
          />
        </div>
      )}

      {/* Alternatives */}
      <div className="px-5 pb-5 space-y-2.5">
        {question.alternatives.map((alt, idx) => (
          <Alternative
            key={idx}
            letter={LETTERS[idx] ?? String(idx)}
            alt={alt}
            selected={selected === idx}
            onSelect={() => handleSelect(idx)}
          />
        ))}
      </div>
    </div>
  );
}
