import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renderiza notação matemática (LaTeX via KaTeX) dentro de uma string,
 * preservando todo o restante do conteúdo (texto puro ou HTML já montado
 * pelo chamador) intacto.
 *
 * Delimitadores reconhecidos:
 *   - Display: $$...$$ ou \[...\]
 *   - Inline:  $...$   ou \(...\)
 *
 * Compatibilidade retroativa (legado): fora dos delimitadores LaTeX,
 * convertemos a sintaxe curta usada hoje no banco para <sup>/<sub>:
 *   x^2, x^{n+1}, x^(n+1)  →  x<sup>...</sup>
 *   H_2, H_{2}, H_(2)      →  H<sub>...</sub>
 *
 * A função NUNCA lança: erros de LaTeX são renderizados em vermelho pelo
 * próprio KaTeX (throwOnError: false) e, em caso de falha do try/catch,
 * o trecho original é devolvido literalmente.
 */
export function renderMath(text: string): string {
  if (!text) return '';

  // Regex unificada que captura, em ordem de prioridade:
  //   1. $$...$$       (display)
  //   2. \[...\]       (display)
  //   3. $...$         (inline, sem $ no meio)
  //   4. \(...\)       (inline)
  const mathPattern =
    /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)/g;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathPattern.exec(text)) !== null) {
    // Pedaço de texto antes da fórmula → aplica legado e concatena
    if (match.index > lastIndex) {
      result += applyLegacyNotation(text.slice(lastIndex, match.index));
    }

    const displayExpr = match[1] ?? match[2];
    const inlineExpr = match[3] ?? match[4];
    const expr = displayExpr ?? inlineExpr ?? '';
    const isDisplay = displayExpr !== undefined;

    try {
      result += katex.renderToString(expr, {
        displayMode: isDisplay,
        throwOnError: false,
        output: 'html',
      });
    } catch {
      // Defesa em profundidade: devolve o trecho original literalmente.
      result += match[0];
    }

    lastIndex = match.index + match[0].length;
  }

  // Resto do texto após a última fórmula
  if (lastIndex < text.length) {
    result += applyLegacyNotation(text.slice(lastIndex));
  }

  return result;
}

/**
 * Conversão da sintaxe legada (^ e _) para <sup>/<sub>.
 * Aplicada apenas em trechos que NÃO estão dentro de delimitadores LaTeX.
 */
function applyLegacyNotation(text: string): string {
  if (!text) return '';
  return text.replace(
    /\^[({]([^)}]+)[)}]|\^([\w\-+]+)|_[({]([^)}]+)[)}]|_([\w]+)/g,
    (match, supBraced, supBare, subBraced, subBare) => {
      if (supBraced !== undefined) return `<sup>${supBraced}</sup>`;
      if (supBare !== undefined) return `<sup>${supBare}</sup>`;
      if (subBraced !== undefined) return `<sub>${subBraced}</sub>`;
      if (subBare !== undefined) return `<sub>${subBare}</sub>`;
      return match;
    },
  );
}
