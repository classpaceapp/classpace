/**
 * Phoenix Math Utilities
 * Global functions for consistent math rendering across transcript and whiteboard
 */

/**
 * Normalizes math delimiters in text for ReactMarkdown + remark-math + rehype-katex
 * Converts bracket-style [ ... ] to proper LaTeX $$ ... $$ delimiters
 * Also handles various malformed patterns the AI might produce
 */
export const normalizeMathDelimiters = (text: string): string => {
  if (!text) return text;
  
  let result = text;
  
  // Convert [ ... ] style display math to $$ ... $$ (must check it's not a markdown link)
  // Pattern: [ followed by math content followed by ] but NOT [text](url) format
  result = result.replace(/\[\s*\\([a-zA-Z]+)/g, '$$\\$1');
  result = result.replace(/\\\][\s]*$/gm, '$$');
  result = result.replace(/\s*\\\]/g, '$$');
  
  // Handle patterns like "[ \frac{...} ]" that aren't caught above
  result = result.replace(/^\[\s*([^[\]]*\\[a-zA-Z]+[^[\]]*)\s*\]$/gm, '$$$$1$$$$');
  
  // Convert \[ ... \] to $$ ... $$
  result = result.replace(/\\\[/g, '$$');
  result = result.replace(/\\\]/g, '$$');
  
  // Convert \( ... \) to $ ... $
  result = result.replace(/\\\(/g, '$');
  result = result.replace(/\\\)/g, '$');
  
  // Fix double $$$$ that might occur from nested replacements
  result = result.replace(/\${4,}/g, '$$');
  
  // Handle ( ... ) with LaTeX inside as inline math (only if it contains LaTeX commands)
  // Be careful not to break regular parentheses
  result = result.replace(/\(\s*(\\[a-zA-Z]+[^)]+)\s*\)/g, (match, inner) => {
    // Only convert if it looks like LaTeX (has backslash commands)
    if (inner.includes('\\')) {
      return `$${inner}$`;
    }
    return match;
  });
  
  return result;
};

/**
 * Converts LaTeX notation to visual Unicode characters for whiteboard display
 * This is a comprehensive conversion that handles most common math notations
 */
export const latexToVisualUnicode = (latex: string): string => {
  if (!latex) return latex;
  
  let result = latex;
  
  // Handle derivative notation first (before generic frac)
  result = result
    // d/dt style derivatives
    .replace(/\\frac\{d\}\{dt\}/g, 'd/dt')
    .replace(/\\frac\{d\}\{dx\}/g, 'd/dx')
    .replace(/\\frac\{d\}\{dy\}/g, 'd/dy')
    .replace(/\\frac\{d\}\{dz\}/g, 'd/dz')
    // Partial derivatives
    .replace(/\\frac\{\\partial\}\{\\partial\s*t\}/g, '∂/∂t')
    .replace(/\\frac\{\\partial\}\{\\partial\s*x\}/g, '∂/∂x')
    .replace(/\\frac\{\\partial\}\{\\partial\s*y\}/g, '∂/∂y')
    .replace(/\\frac\{\\partial\}\{\\partial\s*z\}/g, '∂/∂z')
    .replace(/\\frac\{\\partial\s*([A-Za-z])\}\{\\partial\s*([A-Za-z])\}/g, '∂$1/∂$2')
    .replace(/\\frac\{d([A-Za-z])\}\{d([A-Za-z])\}/g, 'd$1/d$2');
  
  // Handle \left and \right delimiters (remove them, keep the delimiter)
  result = result
    .replace(/\\left\s*\(/g, '(')
    .replace(/\\right\s*\)/g, ')')
    .replace(/\\left\s*\[/g, '[')
    .replace(/\\right\s*\]/g, ']')
    .replace(/\\left\s*\{/g, '{')
    .replace(/\\right\s*\}/g, '}')
    .replace(/\\left\s*\|/g, '|')
    .replace(/\\right\s*\|/g, '|')
    .replace(/\\left\s*\\{/g, '{')
    .replace(/\\right\s*\\}/g, '}')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '');
  
  // Handle \dot, \ddot, \bar, \hat, \vec, \tilde (accent marks)
  result = result
    .replace(/\\dot\{([A-Za-z])\}/g, '$1̇')
    .replace(/\\dot\s+([A-Za-z])/g, '$1̇')
    .replace(/\\ddot\{([A-Za-z])\}/g, '$1̈')
    .replace(/\\ddot\s+([A-Za-z])/g, '$1̈')
    .replace(/\\bar\{([A-Za-z])\}/g, '$1̄')
    .replace(/\\hat\{([A-Za-z])\}/g, '$1̂')
    .replace(/\\vec\{([A-Za-z])\}/g, '$1⃗')
    .replace(/\\tilde\{([A-Za-z])\}/g, '$1̃');
  
  // Common fractions
  result = result
    .replace(/\\frac\{1\}\{2\}/g, '½')
    .replace(/\\frac\{1\}\{3\}/g, '⅓')
    .replace(/\\frac\{1\}\{4\}/g, '¼')
    .replace(/\\frac\{1\}\{5\}/g, '⅕')
    .replace(/\\frac\{1\}\{6\}/g, '⅙')
    .replace(/\\frac\{1\}\{8\}/g, '⅛')
    .replace(/\\frac\{2\}\{3\}/g, '⅔')
    .replace(/\\frac\{3\}\{4\}/g, '¾')
    .replace(/\\frac\{2\}\{5\}/g, '⅖')
    .replace(/\\frac\{3\}\{5\}/g, '⅗')
    .replace(/\\frac\{4\}\{5\}/g, '⅘')
    .replace(/\\frac\{5\}\{6\}/g, '⅚')
    .replace(/\\frac\{3\}\{8\}/g, '⅜')
    .replace(/\\frac\{5\}\{8\}/g, '⅝')
    .replace(/\\frac\{7\}\{8\}/g, '⅞')
    // Generic fractions: a/b format
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  
  // Superscripts (powers)
  const superscriptMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ'
  };
  
  result = result
    .replace(/\^{([^{}]+)}/g, (_, p) => 
      p.split('').map((c: string) => superscriptMap[c] || c).join('')
    )
    .replace(/\^([0-9n+-])/g, (_, p) => superscriptMap[p] || `^${p}`);
  
  // Subscripts
  const subscriptMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'i': 'ᵢ', 'n': 'ₙ', 'o': 'ₒ',
    'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ'
  };
  
  result = result
    .replace(/_{([^{}]+)}/g, (_, p) => 
      p.split('').map((c: string) => subscriptMap[c] || c).join('')
    )
    .replace(/_([0-9aeinorstuv])/g, (_, p) => subscriptMap[p] || `_${p}`);
  
  // Greek letters
  result = result
    // Lowercase
    .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ').replace(/\\epsilon/g, 'ε').replace(/\\varepsilon/g, 'ε')
    .replace(/\\zeta/g, 'ζ').replace(/\\eta/g, 'η').replace(/\\theta/g, 'θ')
    .replace(/\\vartheta/g, 'ϑ').replace(/\\iota/g, 'ι').replace(/\\kappa/g, 'κ')
    .replace(/\\lambda/g, 'λ').replace(/\\mu/g, 'μ').replace(/\\nu/g, 'ν')
    .replace(/\\xi/g, 'ξ').replace(/\\omicron/g, 'ο').replace(/\\pi/g, 'π')
    .replace(/\\varpi/g, 'ϖ').replace(/\\rho/g, 'ρ').replace(/\\varrho/g, 'ϱ')
    .replace(/\\sigma/g, 'σ').replace(/\\varsigma/g, 'ς').replace(/\\tau/g, 'τ')
    .replace(/\\upsilon/g, 'υ').replace(/\\phi/g, 'φ').replace(/\\varphi/g, 'ϕ')
    .replace(/\\chi/g, 'χ').replace(/\\psi/g, 'ψ').replace(/\\omega/g, 'ω')
    // Uppercase
    .replace(/\\Gamma/g, 'Γ').replace(/\\Delta/g, 'Δ').replace(/\\Theta/g, 'Θ')
    .replace(/\\Lambda/g, 'Λ').replace(/\\Xi/g, 'Ξ').replace(/\\Pi/g, 'Π')
    .replace(/\\Sigma/g, 'Σ').replace(/\\Upsilon/g, 'Υ').replace(/\\Phi/g, 'Φ')
    .replace(/\\Psi/g, 'Ψ').replace(/\\Omega/g, 'Ω');
  
  // Math operators and symbols
  result = result
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    .replace(/\\sqrt\[3\]\{([^{}]+)\}/g, '∛($1)')
    .replace(/\\sqrt/g, '√')
    .replace(/\\infty/g, '∞')
    .replace(/\\pm/g, '±').replace(/\\mp/g, '∓')
    .replace(/\\times/g, '×').replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·').replace(/\\bullet/g, '•')
    .replace(/\\neq/g, '≠').replace(/\\ne/g, '≠')
    .replace(/\\leq/g, '≤').replace(/\\le/g, '≤')
    .replace(/\\geq/g, '≥').replace(/\\ge/g, '≥')
    .replace(/\\ll/g, '≪').replace(/\\gg/g, '≫')
    .replace(/\\approx/g, '≈').replace(/\\sim/g, '∼')
    .replace(/\\equiv/g, '≡').replace(/\\cong/g, '≅')
    .replace(/\\propto/g, '∝')
    .replace(/\\rightarrow/g, '→').replace(/\\to/g, '→')
    .replace(/\\leftarrow/g, '←').replace(/\\gets/g, '←')
    .replace(/\\leftrightarrow/g, '↔')
    .replace(/\\Rightarrow/g, '⇒').replace(/\\implies/g, '⇒')
    .replace(/\\Leftarrow/g, '⇐')
    .replace(/\\Leftrightarrow/g, '⇔').replace(/\\iff/g, '⇔')
    .replace(/\\uparrow/g, '↑').replace(/\\downarrow/g, '↓')
    .replace(/\\forall/g, '∀').replace(/\\exists/g, '∃')
    .replace(/\\nexists/g, '∄')
    .replace(/\\in/g, '∈').replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂').replace(/\\supset/g, '⊃')
    .replace(/\\subseteq/g, '⊆').replace(/\\supseteq/g, '⊇')
    .replace(/\\cup/g, '∪').replace(/\\cap/g, '∩')
    .replace(/\\emptyset/g, '∅').replace(/\\varnothing/g, '∅')
    .replace(/\\land/g, '∧').replace(/\\wedge/g, '∧')
    .replace(/\\lor/g, '∨').replace(/\\vee/g, '∨')
    .replace(/\\neg/g, '¬').replace(/\\lnot/g, '¬')
    .replace(/\\int/g, '∫').replace(/\\iint/g, '∬').replace(/\\iiint/g, '∭')
    .replace(/\\oint/g, '∮')
    .replace(/\\sum/g, '∑').replace(/\\prod/g, '∏')
    .replace(/\\partial/g, '∂').replace(/\\nabla/g, '∇')
    .replace(/\\degree/g, '°').replace(/\\circ/g, '°')
    .replace(/\\angle/g, '∠').replace(/\\perp/g, '⊥')
    .replace(/\\parallel/g, '∥')
    .replace(/\\prime/g, '′').replace(/\\dprime/g, '″')
    .replace(/\\star/g, '⋆').replace(/\\ast/g, '∗')
    .replace(/\\oplus/g, '⊕').replace(/\\otimes/g, '⊗')
    .replace(/\\therefore/g, '∴').replace(/\\because/g, '∵');
  
  // Text commands
  result = result
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^{}]+)\}/g, '$1')
    .replace(/\\mathit\{([^{}]+)\}/g, '$1');
  
  // Spacing
  result = result
    .replace(/\\quad/g, '  ')
    .replace(/\\qquad/g, '    ')
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\:/g, ' ')
    .replace(/\\ /g, ' ');
  
  // Clean up remaining backslashes that are LaTeX command remnants
  // But be careful not to remove meaningful escaped characters
  result = result.replace(/\\([a-zA-Z]+)/g, '$1');
  
  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
};

/**
 * Normalizes coordinates from a standard 1000x700 space to actual canvas dimensions
 */
export const normalizeCoordinates = (
  x: number, 
  y: number, 
  canvasWidth: number, 
  canvasHeight: number,
  sourceWidth: number = 1000,
  sourceHeight: number = 700
): { x: number; y: number } => {
  const scaleX = canvasWidth / sourceWidth;
  const scaleY = canvasHeight / sourceHeight;
  return {
    x: Math.round(x * scaleX),
    y: Math.round(y * scaleY)
  };
};
