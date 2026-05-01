import React from 'react';
import MarkdownText from '@/components/atlas/MarkdownText';

interface StatementImage {
  url: string;
  caption?: string;
  order?: number;
}

interface InlineStatementRendererProps {
  statement: string;
  images: StatementImage[];
  questionNumber: number;
  className?: string;
}

/**
 * Renders a question statement with inline images placed at {{IMG_0}}, {{IMG_1}}, etc.
 * Supports both zero-based and one-based placeholders for compatibility.
 * If placeholders are not resolvable, falls back to showing text then all images below.
 */
export function InlineStatementRenderer({
  statement,
  images,
  questionNumber,
  className = '',
}: InlineStatementRendererProps) {
  const sortedImages = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // DEBUG: temporary logs for Bug 3 diagnosis
  console.log('[InlineStatement] images received:', images.length, images);


  const resolveImageByPlaceholder = (rawIndex: number) => {
    return sortedImages[rawIndex] ?? (rawIndex > 0 ? sortedImages[rawIndex - 1] : undefined);
  };

  // Check if statement contains any {{IMG_N}} placeholders
  const hasPlaceholders = /\{\{IMG_\d+\}\}/.test(statement);
  const hasResolvablePlaceholder = hasPlaceholders
    ? [...statement.matchAll(/\{\{IMG_(\d+)\}\}/g)].some((match) => {
        const rawIndex = parseInt(match[1], 10);
        return Number.isFinite(rawIndex) && Boolean(resolveImageByPlaceholder(rawIndex));
      })
    : false;

  if (!hasPlaceholders || !hasResolvablePlaceholder) {
    // Fallback: render statement text, then all images below
    return (
      <div className={className}>
        {statement?.trim() ? (
          <>{renderTextSegment(statement, 'fallback')}</>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta questão usa imagem como enunciado principal.
          </p>
        )}
        {sortedImages.length > 0 && (
          <div className="flex flex-col items-center gap-3 py-2">
            {sortedImages.map((img, idx) => (
              <InlineImage key={`fallback-${idx}`} img={img} questionNumber={questionNumber} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Split statement by {{IMG_N}} placeholders and interleave images
  const parts = statement.split(/(\{\{IMG_\d+\}\})/g);

  return (
    <div className={className}>
      {parts.map((part, idx) => {
        const match = part.match(/^\{\{IMG_(\d+)\}\}$/);
        if (match) {
          const rawIndex = parseInt(match[1], 10);
          const img = resolveImageByPlaceholder(rawIndex);
          if (!img) return null;
          return (
            <div key={`img-${idx}`} className="flex justify-center py-2">
              <InlineImage img={img} questionNumber={questionNumber} />
            </div>
          );
        }
        // Text segment (with [CITE]...[/CITE] support)
        if (!part.trim()) return null;
        return <React.Fragment key={`text-${idx}`}>{renderTextSegment(part, idx)}</React.Fragment>;
      })}
    </div>
  );
}

/**
 * Renders a text segment, splitting out [CITE]...[/CITE] blocks as discreet
 * gray italic citations and rendering remaining text via MarkdownText.
 */
function renderTextSegment(text: string, idxKey: number | string): React.ReactNode {
  const subparts = text.split(/(\[CITE\][\s\S]*?\[\/CITE\])/gi);
  return subparts.map((sub, subIdx) => {
    const citeMatch = sub.match(/^\s*\[CITE\]([\s\S]*?)\[\/CITE\]\s*$/i);
    if (citeMatch) {
      return (
        <p
          key={`cite-${idxKey}-${subIdx}`}
          className="text-xs text-muted-foreground italic text-right mt-1 leading-relaxed"
        >
          {citeMatch[1].trim()}
        </p>
      );
    }
    if (!sub.trim()) return null;
    return (
      <MarkdownText
        key={`md-${idxKey}-${subIdx}`}
        content={sub}
        className="text-sm leading-relaxed"
      />
    );
  });
}

function InlineImage({ img, questionNumber }: { img: StatementImage; questionNumber: number }) {
  return (
    <div className="relative max-w-sm w-full">
      <img
        src={img.url}
        alt={img.caption || `Imagem da questão ${questionNumber}`}
        className="w-full h-auto rounded-lg border bg-muted/20 object-contain"
        loading="lazy"
      />
      {img.caption && (
        <p className="text-[11px] text-muted-foreground text-center mt-1.5 italic">
          {img.caption}
        </p>
      )}
    </div>
  );
}
