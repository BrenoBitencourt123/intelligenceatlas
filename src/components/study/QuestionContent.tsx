import React from 'react';
import { renderMath } from '@/lib/renderMath';
import { cn } from '@/lib/utils';

export interface ContentFormat {
  color?: 'default' | 'muted';
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface ContentBlock {
  type: 'text' | 'image' | 'citation' | 'table';
  value?: string;
  data?: string;
  caption?: string;
  format?: ContentFormat;
  headers?: string[];
  rows?: string[][];
}

interface QuestionContentProps {
  content: ContentBlock[];
  command?: string | null;
  className?: string;
}

function mathHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return renderMath(escaped);
}

function TextBlock({ block }: { block: ContentBlock }) {
  if (!block.value?.trim()) return null;
  const isMuted = block.format?.color === 'muted';
  const isBold = block.format?.bold;
  const align = block.format?.align ?? 'left';

  return (
    <div
      className={cn(
        'whitespace-pre-wrap leading-relaxed',
        isMuted ? 'text-xs text-muted-foreground' : 'text-sm text-muted-foreground',
        isBold && 'font-semibold',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
      )}
      dangerouslySetInnerHTML={{ __html: mathHtml(block.value) }}
    />
  );
}

function ImageBlock({ block }: { block: ContentBlock }) {
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

function CitationBlock({ block }: { block: ContentBlock }) {
  if (!block.value?.trim()) return null;
  return (
    <p className="text-xs text-muted-foreground italic text-right mt-1 leading-relaxed">
      {block.value.trim()}
    </p>
  );
}

function TableBlock({ block }: { block: ContentBlock }) {
  const headers = block.headers ?? [];
  const rows = block.rows ?? [];
  if (headers.length === 0 && rows.length === 0) return null;

  return (
    <figure className="flex flex-col gap-1.5">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm border-collapse">
          {headers.length > 0 && (
            <thead className="bg-muted/40">
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="px-3 py-2 text-left font-semibold text-foreground border-b border-border"
                    dangerouslySetInnerHTML={{ __html: mathHtml(h) }}
                  />
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-2 text-foreground align-top"
                    dangerouslySetInnerHTML={{ __html: mathHtml(cell) }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.caption && (
        <figcaption className="text-[11px] text-muted-foreground italic text-center">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function QuestionContent({ content, command, className }: QuestionContentProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {content.map((block, idx) => (
        <React.Fragment key={idx}>
          {block.type === 'text' && <TextBlock block={block} />}
          {block.type === 'image' && <ImageBlock block={block} />}
          {block.type === 'citation' && <CitationBlock block={block} />}
          {block.type === 'table' && <TableBlock block={block} />}
        </React.Fragment>
      ))}
      {command && (
        <p
          className="text-base font-bold text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: mathHtml(command) }}
        />
      )}
    </div>
  );
}
