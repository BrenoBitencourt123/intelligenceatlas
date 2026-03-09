/**
 * Converts math/chemistry notation in plain text to semantic HTML.
 *
 * Supported patterns:
 *   x^2, x^{-1}, x^(n+1)  →  x<sup>2</sup>, x<sup>-1</sup>, x<sup>n+1</sup>
 *   H_{2}, H_(2), CO_2     →  H<sub>2</sub>, H<sub>2</sub>, CO<sub>2</sub>
 */
export function renderMath(text: string): string {
  if (!text) return '';
  return text.replace(
    /\^[({]([^)}]+)[)}]|\^([\w\-+]+)|_[({]([^)}]+)[)}]|_([\w]+)/g,
    (_match, supBraced, supBare, subBraced, subBare) => {
      if (supBraced !== undefined) return `<sup>${supBraced}</sup>`;
      if (supBare !== undefined) return `<sup>${supBare}</sup>`;
      if (subBraced !== undefined) return `<sub>${subBraced}</sub>`;
      if (subBare !== undefined) return `<sub>${subBare}</sub>`;
      return _match;
    },
  );
}
