import React, { ReactNode } from 'react';

// Macros LaTeX simples → caractere unicode
const LATEX_MACROS: [RegExp, string][] = [
  [/\\times\b/g, '×'],
  [/\\cdot\b/g, '·'],
  [/\\div\b/g, '÷'],
  [/\\pm\b/g, '±'],
  [/\\le\b/g, '≤'],
  [/\\ge\b/g, '≥'],
  [/\\neq\b/g, '≠'],
  [/\\approx\b/g, '≈'],
  [/\\to\b/g, '→'],
  [/\\rightleftharpoons\b/g, '⇌'],
  [/\\infty\b/g, '∞'],
  [/\\pi\b/g, 'π'],
  [/\\alpha\b/g, 'α'], [/\\beta\b/g, 'β'], [/\\gamma\b/g, 'γ'],
  [/\\delta\b/g, 'δ'], [/\\Delta\b/g, 'Δ'], [/\\theta\b/g, 'θ'],
  [/\\lambda\b/g, 'λ'], [/\\mu\b/g, 'μ'], [/\\sigma\b/g, 'σ'],
  [/\\Sigma\b/g, 'Σ'], [/\\omega\b/g, 'ω'], [/\\Omega\b/g, 'Ω'],
  [/\\degree\b/g, '°'], [/\\circ\b/g, '°'],
  [/\\left\(/g, '('], [/\\right\)/g, ')'],
  [/\\left\[/g, '['], [/\\right\]/g, ']'],
  [/\\,/g, ' '], [/\\;/g, ' '], [/\\ /g, ' '],
];

function expandMacros(text: string): string {
  let out = text;
  for (const [re, rep] of LATEX_MACROS) out = out.replace(re, rep);
  return out;
}

function readBraceGroup(text: string, start: number): { content: string; end: number } | null {
  if (text[start] !== '{') return null;
  let depth = 1;
  let i = start + 1;
  while (i < text.length && depth > 0) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    if (depth === 0) return { content: text.slice(start + 1, i), end: i + 1 };
    i++;
  }
  return null;
}

function readBracketGroup(text: string, start: number): { content: string; end: number } | null {
  if (text[start] !== '[') return null;
  const close = text.indexOf(']', start + 1);
  if (close === -1) return null;
  return { content: text.slice(start + 1, close), end: close + 1 };
}

let globalKey = 0;

// Aplica **negrito** e *itálico* inline a um trecho de texto puro → ReactNode[]
function applyInlineStyles(str: string): ReactNode[] {
  if (!str) return [str];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) parts.push(str.slice(last, m.index));
    if (m[1] !== undefined) parts.push(<strong key={`b${globalKey++}`}>{m[1]}</strong>);
    else parts.push(<em key={`i${globalKey++}`}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < str.length) parts.push(str.slice(last));
  return parts.length ? parts : [str];
}

// Versão string→HTML de **negrito**/*itálico* (para renderMathHtml)
function applyInlineStylesHtml(str: string): string {
  return str
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
}

function Frac({ num, den }: { num: string; den: string }) {
  return (
    <span
      className="inline-flex flex-col items-center align-middle text-center mx-1"
      style={{ verticalAlign: '-0.5em', lineHeight: 1.1 }}
    >
      <span className="px-1.5 text-[0.92em]">{renderMath(num)}</span>
      <span
        className="block w-full"
        style={{ borderTop: '1px solid currentColor', height: 0 }}
      />
      <span className="px-1.5 text-[0.92em]">{renderMath(den)}</span>
    </span>
  );
}

function Sqrt({ content, index }: { content: string; index: string | null }) {
  return (
    <span className="inline-flex items-start align-middle">
      {index ? (
        <sup
          className="text-[0.65em]"
          style={{ marginRight: '-0.35em', position: 'relative', top: '-0.1em' }}
        >
          {index}
        </sup>
      ) : null}
      <span style={{ fontSize: '1.05em' }}>√</span>
      <span
        className="px-0.5"
        style={{ borderTop: '1px solid currentColor', marginTop: '0.1em' }}
      >
        {renderMath(content)}
      </span>
    </span>
  );
}

/**
 * Converte texto plano com convenções LaTeX-like em React nodes.
 *
 * Suporta:
 * - Subscript: `_X` (1 char) ou `_{...}` (múltiplos)
 * - Superscript: `^X` (1 char ou sinal) ou `^{...}` (múltiplos)
 * - Fração empilhada: `\frac{num}{den}`
 * - Raiz: `\sqrt{x}` ou `\sqrt[n]{x}`
 * - Macros: `\times`, `\cdot`, `\pi`, `\to`, `\rightleftharpoons`, etc.
 */
export function renderMath(rawText: string): ReactNode {
  if (!rawText) return '';
  const text = expandMacros(rawText);
  const out: ReactNode[] = [];
  let buf = '';
  let i = 0;

  const flush = () => {
    if (!buf) return;
    // Aplica subscript/superscript: _X / ^X = 1 char; _{...} / ^{...} = múltiplos
    const re = /\^[({]([^)}]+)[)}]|\^([\w\-+])|_[({]([^)}]+)[)}]|_(\w)/g;
    const parts: ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(buf)) !== null) {
      if (m.index > last) parts.push(...applyInlineStyles(buf.slice(last, m.index)));
      const c = m[1] ?? m[2] ?? m[3] ?? m[4];
      if (m[0].startsWith('^')) parts.push(<sup key={`s${globalKey++}`}>{c}</sup>);
      else parts.push(<sub key={`s${globalKey++}`}>{c}</sub>);
      last = m.index + m[0].length;
    }
    if (last < buf.length) parts.push(...applyInlineStyles(buf.slice(last)));
    out.push(...(parts.length ? parts : applyInlineStyles(buf)));
    buf = '';
  };

  while (i < text.length) {
    if (text.startsWith('\\frac', i)) {
      const numG = readBraceGroup(text, i + 5);
      if (numG) {
        const denG = readBraceGroup(text, numG.end);
        if (denG) {
          flush();
          out.push(<Frac key={`f${globalKey++}`} num={numG.content} den={denG.content} />);
          i = denG.end;
          continue;
        }
      }
    } else if (text.startsWith('\\sqrt', i)) {
      let pos = i + 5;
      let index: string | null = null;
      if (text[pos] === '[') {
        const idxG = readBracketGroup(text, pos);
        if (idxG) {
          index = idxG.content;
          pos = idxG.end;
        }
      }
      const contG = readBraceGroup(text, pos);
      if (contG) {
        flush();
        out.push(<Sqrt key={`r${globalKey++}`} content={contG.content} index={index} />);
        i = contG.end;
        continue;
      }
    }
    buf += text[i];
    i++;
  }
  flush();
  return <>{out}</>;
}

/* ── HTML version for string-pipeline contexts (e.g. MarkdownText) ── */

function expandMacrosHtml(text: string): string {
  return expandMacros(text);
}

function applySubSupHtml(text: string): string {
  return text.replace(
    /\^[({]([^)}]+)[)}]|\^([\w\-+])|_[({]([^)}]+)[)}]|_(\w)/g,
    (match, supBraced, supBare, subBraced, subBare) => {
      if (supBraced !== undefined) return `<sup>${supBraced}</sup>`;
      if (supBare !== undefined) return `<sup>${supBare}</sup>`;
      if (subBraced !== undefined) return `<sub>${subBraced}</sub>`;
      if (subBare !== undefined) return `<sub>${subBare}</sub>`;
      return match;
    },
  );
}

/**
 * String-based version of renderMath for contexts that need HTML strings
 * (e.g. MarkdownText which builds an HTML pipeline).
 */
export function renderMathHtml(rawText: string): string {
  if (!rawText) return '';
  const text = expandMacrosHtml(rawText);
  let result = '';
  let buf = '';
  let i = 0;

  const flush = () => {
    if (!buf) return;
    result += applyInlineStylesHtml(applySubSupHtml(buf));
    buf = '';
  };

  while (i < text.length) {
    if (text.startsWith('\\frac', i)) {
      const numG = readBraceGroup(text, i + 5);
      if (numG) {
        const denG = readBraceGroup(text, numG.end);
        if (denG) {
          flush();
          const numHtml = renderMathHtml(numG.content);
          const denHtml = renderMathHtml(denG.content);
          result += `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:-0.5em;line-height:1.1;text-align:center;margin:0 0.25em"><span style="padding:0 0.375em;font-size:0.92em">${numHtml}</span><span style="display:block;width:100%;border-top:1px solid currentColor;height:0"></span><span style="padding:0 0.375em;font-size:0.92em">${denHtml}</span></span>`;
          i = denG.end;
          continue;
        }
      }
    } else if (text.startsWith('\\sqrt', i)) {
      let pos = i + 5;
      let index: string | null = null;
      if (text[pos] === '[') {
        const idxG = readBracketGroup(text, pos);
        if (idxG) {
          index = idxG.content;
          pos = idxG.end;
        }
      }
      const contG = readBraceGroup(text, pos);
      if (contG) {
        flush();
        const contHtml = renderMathHtml(contG.content);
        const indexHtml = index
          ? `<sup style="font-size:0.65em;margin-right:-0.35em;position:relative;top:-0.1em">${index}</sup>`
          : '';
        result += `<span style="display:inline-flex;align-items:start;vertical-align:middle">${indexHtml}<span style="font-size:1.05em">√</span><span style="padding:0 0.125em;border-top:1px solid currentColor;margin-top:0.1em">${contHtml}</span></span>`;
        i = contG.end;
        continue;
      }
    }
    buf += text[i];
    i++;
  }
  flush();
  return result;
}
