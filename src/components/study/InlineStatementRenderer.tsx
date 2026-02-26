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
 * If no placeholders are found, falls back to showing text then all images below.
 */
export function InlineStatementRenderer({
  statement,
  images,
  questionNumber,
  className = '',
}: InlineStatementRendererProps) {
  const sortedImages = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Check if statement contains any {{IMG_N}} placeholders
  const hasPlaceholders = /\{\{IMG_\d+\}\}/.test(statement);

  if (!hasPlaceholders) {
    // Fallback: render statement text, then all images below
    return (
      <div className={className}>
        {statement?.trim() ? (
          <MarkdownText content={statement} className="text-sm leading-relaxed" />
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
          const imgIndex = parseInt(match[1], 10);
          const img = sortedImages[imgIndex];
          if (!img) return null;
          return (
            <div key={`img-${idx}`} className="flex justify-center py-2">
              <InlineImage img={img} questionNumber={questionNumber} />
            </div>
          );
        }
        // Text segment
        if (!part.trim()) return null;
        return (
          <MarkdownText key={`text-${idx}`} content={part} className="text-sm leading-relaxed" />
        );
      })}
    </div>
  );
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
