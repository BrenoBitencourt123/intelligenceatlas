import React from 'react';

/**
 * Converts basic Markdown to HTML:
 * - **bold** → <strong>
 * - *italic* → <em>
 * - > blockquote → <blockquote>
 * - line breaks preserved
 */
function markdownToHtml(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  const htmlLines: string[] = [];
  let inBlockquote = false;

  for (const line of lines) {
    if (line.startsWith('> ')) {
      if (!inBlockquote) {
        htmlLines.push('<blockquote class="border-l-2 border-muted-foreground/30 pl-3 my-2 italic text-muted-foreground">');
        inBlockquote = true;
      }
      htmlLines.push(formatInline(line.slice(2)) + '<br/>');
    } else {
      if (inBlockquote) {
        htmlLines.push('</blockquote>');
        inBlockquote = false;
      }
      if (line.trim() === '') {
        htmlLines.push('<br/>');
      } else {
        htmlLines.push(formatInline(line) + '<br/>');
      }
    }
  }

  if (inBlockquote) {
    htmlLines.push('</blockquote>');
  }

  // Remove trailing <br/>
  const result = htmlLines.join('');
  return result.replace(/(<br\/>)+$/, '');
}

function formatInline(text: string): string {
  // Bold: **text**
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* (but not inside **)
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
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
