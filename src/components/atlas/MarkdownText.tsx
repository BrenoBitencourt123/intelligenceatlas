import React from 'react';
import { renderMath } from '@/lib/renderMath';

/**
 * Auto-detect and apply Markdown formatting to plain-text statements.
 * Fallback for questions imported via JSON without formatting.
 */
function autoFormatPlainText(text: string): string {
  if (!text) return '';
  // If text already has Markdown markers, return as-is
  if (/\*\*.+\*\*/.test(text) || /^> /m.test(text)) return text;

  const lines = text.split('\n');
  const result: string[] = [];

  const referencePattern = /^(Disponível em:|DISPONÍVEL EM:|Acesso em:|In:|Adaptado\.|Fonte:|Available at:)/i;
  const trailingRefPattern = /\(.*(adaptado|fragmento).*\)\s*\.?\s*$/i;
  const shortAuthorRef = /^[A-Z][A-ZÁÉÍÓÚÀÃÕÂÊÔÇ]+,\s+[A-Z]\.\s/;

  // Find last non-empty line for final question detection
  let lastContentIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim()) { lastContentIdx = i; break; }
  }

  // Identify reference line indices
  const refIndices = new Set<number>();
  lines.forEach((l, i) => {
    const t = l.trim();
    if (referencePattern.test(t) || trailingRefPattern.test(t) || shortAuthorRef.test(t)) {
      refIndices.add(i);
    }
  });

  // Find blocks of short lines (poems, excerpts) that precede a reference
  const quoteLines = new Set<number>();
  for (const refIdx of refIndices) {
    // Walk backwards from refIdx to find the start of a short-line block
    let j = refIdx - 1;
    while (j >= 0 && (lines[j].trim() === '' || lines[j].trim().length < 100)) {
      if (lines[j].trim()) quoteLines.add(j);
      j--;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) { result.push(''); continue; }

    if (refIndices.has(i)) {
      result.push(`*${trimmed}*`);
    } else if (i === lastContentIdx && !refIndices.has(i)) {
      result.push(`**${trimmed}**`);
    } else if (quoteLines.has(i)) {
      result.push(`> ${trimmed}`);
    } else {
      result.push(trimmed);
    }
  }

  return result.join('\n');
}

/**
 * Converts basic Markdown to HTML:
 * - **bold** → <strong>
 * - *italic* → <em>
 * - > blockquote → <blockquote>
 * - line breaks preserved
 */
function markdownToHtml(text: string): string {
  if (!text) return '';

  // Pre-process [cite]...[/cite] blocks before line splitting to preserve multi-line citations
  const citeBlocks: string[] = [];
  const withCitePlaceholders = text.replace(/\[cite\]([\s\S]*?)\[\/cite\]/gi, (_match, inner) => {
    const idx = citeBlocks.length;
    citeBlocks.push(inner.trim());
    return `%%CITE_BLOCK_${idx}%%`;
  });

  // DEBUG: temporary logs for Bug 2 diagnosis
  console.log('[MarkdownText] input (first 200):', text?.slice(0, 200));
  console.log('[MarkdownText] cite regex match:', text?.match(/\[cite\]/gi));

  const formatted = autoFormatPlainText(withCitePlaceholders);
  const lines = formatted.split('\n');
  const htmlLines: string[] = [];
  let inBlockquote = false;

  for (const line of lines) {
    // Check for cite placeholder in the line
    const citePlaceholderMatch = line.trim().match(/^%%CITE_BLOCK_(\d+)%%$/);
    if (citePlaceholderMatch) {
      if (inBlockquote) {
        htmlLines.push('</blockquote>');
        inBlockquote = false;
      }
      const citeIdx = parseInt(citePlaceholderMatch[1], 10);
      htmlLines.push(`<p class="text-xs text-muted-foreground italic text-right mt-1 leading-relaxed">${citeBlocks[citeIdx]}</p>`);
      continue;
    }

    // Restore any inline cite placeholders mixed with other text on the same line
    const restoredLine = line.replace(/%%CITE_BLOCK_(\d+)%%/g, (_, idxStr) => {
      const ci = parseInt(idxStr, 10);
      return `[cite]${citeBlocks[ci]}[/cite]`;
    });

    if (restoredLine.startsWith('> ')) {
      if (!inBlockquote) {
        htmlLines.push('<blockquote class="border-l-2 border-muted-foreground/30 pl-3 my-2 italic text-muted-foreground">');
        inBlockquote = true;
      }
      htmlLines.push(formatInline(restoredLine.slice(2)) + '<br/>');
    } else {
      if (inBlockquote) {
        htmlLines.push('</blockquote>');
        inBlockquote = false;
      }
      if (restoredLine.trim() === '') {
        htmlLines.push('<br/>');
      } else {
        htmlLines.push(formatInline(restoredLine) + '<br/>');
      }
    }
  }

  if (inBlockquote) {
    htmlLines.push('</blockquote>');
  }

  const result = htmlLines.join('');
  return result.replace(/(<br\/>)+$/, '');
}

function formatInline(text: string): string {
  // Handle inline [cite]...[/cite] that weren't caught by the block pre-processor
  let result = text.replace(
    /\[cite\]([\s\S]*?)\[\/cite\]/gi,
    '<span class="text-xs text-muted-foreground italic block text-right mt-1">$1</span>'
  );
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  result = renderMath(result);
  return result;
}

interface MarkdownTextProps {
  content: string;
  className?: string;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ content, className = '' }) => {
  const html = markdownToHtml(content);

  return (
    <div
      className={`markdown-text ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownText;
