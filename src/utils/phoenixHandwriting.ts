/**
 * Phoenix Handwriting Utilities
 * Generates smooth, human-like handwriting paths for formulas and text
 */

export interface HandwritingPoint {
  x: number;
  y: number;
  pressure?: number;
  time?: number;
}

export interface HandwritingStroke {
  points: HandwritingPoint[];
  color?: string;
  baseWidth?: number;
}

/**
 * Smooths a raw point array using Catmull-Rom spline interpolation
 * This creates natural, flowing curves like human handwriting
 */
export function smoothPoints(
  points: Array<{x: number; y: number}>,
  tension: number = 0.5,
  numSegments: number = 8
): Array<{x: number; y: number}> {
  if (points.length < 3) return points;
  
  const result: Array<{x: number; y: number}> = [];
  
  // Catmull-Rom spline interpolation
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    for (let t = 0; t < numSegments; t++) {
      const tt = t / numSegments;
      const tt2 = tt * tt;
      const tt3 = tt2 * tt;
      
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * tt +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * tt3
      );
      
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * tt +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * tt3
      );
      
      result.push({ x, y });
    }
  }
  
  // Add final point
  result.push(points[points.length - 1]);
  
  return result;
}

/**
 * Generates velocity-based stroke width for natural handwriting feel
 * Faster strokes = thinner lines, slower = thicker
 */
export function calculateStrokeWidths(
  points: Array<{x: number; y: number}>,
  baseWidth: number = 2,
  minWidth: number = 1,
  maxWidth: number = 4
): number[] {
  if (points.length < 2) return [baseWidth];
  
  const widths: number[] = [];
  
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      widths.push(baseWidth);
      continue;
    }
    
    const prev = points[i - 1];
    const curr = points[i];
    const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
    
    // Inverse relationship: faster (more distance) = thinner
    // Normalize distance and invert
    const normalizedVelocity = Math.min(distance / 20, 1);
    const width = baseWidth - normalizedVelocity * (baseWidth - minWidth);
    
    widths.push(Math.max(minWidth, Math.min(maxWidth, width)));
  }
  
  return widths;
}

/**
 * Converts points to smooth SVG path using quadratic Bezier curves
 * Much smoother than linear segments
 */
export function pointsToSmoothSVGPath(points: Array<{x: number; y: number}>): string {
  if (points.length < 2) return '';
  
  // First smooth the points
  const smoothed = smoothPoints(points, 0.5, 4);
  
  // Convert to quadratic Bezier path
  let path = `M ${smoothed[0].x.toFixed(1)} ${smoothed[0].y.toFixed(1)}`;
  
  for (let i = 1; i < smoothed.length - 1; i++) {
    const curr = smoothed[i];
    const next = smoothed[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    
    path += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  
  // Line to final point
  const last = smoothed[smoothed.length - 1];
  path += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  
  return path;
}

/**
 * Mathematical symbol stroke definitions
 * Pre-defined paths for drawing symbols with natural handwriting style
 */
export interface SymbolStrokeDef {
  strokes: Array<Array<{x: number; y: number}>>; // Multiple strokes for multi-part symbols
}

/**
 * Generates strokes for common mathematical symbols with human-like variation
 */
export function generateSymbolStrokes(
  symbol: string,
  x: number,
  y: number,
  size: number = 30
): SymbolStrokeDef {
  const strokes: Array<Array<{x: number; y: number}>> = [];
  
  // Add slight random variation for natural look (max 2px)
  const jitter = () => (Math.random() - 0.5) * 2;
  
  switch (symbol) {
    case 'integral':
    case '∫':
      // S-curve with hooks at top and bottom
      const integralStroke: Array<{x: number; y: number}> = [];
      for (let t = 0; t <= 1; t += 0.05) {
        const xOffset = Math.sin(t * Math.PI) * size * 0.15;
        integralStroke.push({
          x: x + xOffset + jitter(),
          y: y - size/2 + t * size + jitter()
        });
      }
      // Top serif
      integralStroke.unshift({ x: x + size * 0.2 + jitter(), y: y - size/2 - size * 0.1 + jitter() });
      // Bottom serif
      integralStroke.push({ x: x - size * 0.15 + jitter(), y: y + size/2 + size * 0.1 + jitter() });
      strokes.push(integralStroke);
      break;
      
    case 'sum':
    case '∑':
    case 'Σ':
      strokes.push([
        { x: x + size + jitter(), y: y + jitter() },
        { x: x + jitter(), y: y + jitter() },
        { x: x + size * 0.5 + jitter(), y: y + size * 0.5 + jitter() },
        { x: x + jitter(), y: y + size + jitter() },
        { x: x + size + jitter(), y: y + size + jitter() }
      ]);
      break;
      
    case 'product':
    case '∏':
    case 'Π':
      // Top bar
      strokes.push([
        { x: x + jitter(), y: y + jitter() },
        { x: x + size + jitter(), y: y + jitter() }
      ]);
      // Left leg
      strokes.push([
        { x: x + size * 0.2 + jitter(), y: y + jitter() },
        { x: x + size * 0.2 + jitter(), y: y + size + jitter() }
      ]);
      // Right leg
      strokes.push([
        { x: x + size * 0.8 + jitter(), y: y + jitter() },
        { x: x + size * 0.8 + jitter(), y: y + size + jitter() }
      ]);
      break;
      
    case 'sqrt':
    case '√':
      strokes.push([
        { x: x + jitter(), y: y + size * 0.3 + jitter() },
        { x: x + size * 0.15 + jitter(), y: y + size * 0.45 + jitter() },
        { x: x + size * 0.35 + jitter(), y: y + size + jitter() },
        { x: x + size * 0.5 + jitter(), y: y + jitter() },
        { x: x + size * 1.5 + jitter(), y: y + jitter() }
      ]);
      break;
      
    case 'partial':
    case '∂':
      const partialStroke: Array<{x: number; y: number}> = [];
      // Main loop
      for (let t = 0; t <= 1.5 * Math.PI; t += 0.1) {
        partialStroke.push({
          x: x + size * 0.5 + size * 0.3 * Math.cos(t) + jitter(),
          y: y + size * 0.5 + size * 0.3 * Math.sin(t) + jitter()
        });
      }
      // Tail going up-left
      partialStroke.push({ x: x + size * 0.4 + jitter(), y: y - size * 0.2 + jitter() });
      strokes.push(partialStroke);
      break;
      
    case 'infinity':
    case '∞':
      const infStroke: Array<{x: number; y: number}> = [];
      for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
        const scale = size * 0.3;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        infStroke.push({
          x: x + size * 0.5 + scale * Math.cos(t) / denom + jitter(),
          y: y + size * 0.5 + scale * Math.sin(t) * Math.cos(t) / denom + jitter()
        });
      }
      strokes.push(infStroke);
      break;
      
    case 'derivative':
    case 'd/dx':
      // 'd' letter
      const dStroke: Array<{x: number; y: number}> = [];
      for (let t = 0; t <= 2 * Math.PI; t += 0.2) {
        dStroke.push({
          x: x + size * 0.15 + size * 0.1 * Math.cos(t) + jitter(),
          y: y + size * 0.6 + size * 0.15 * Math.sin(t) + jitter()
        });
      }
      dStroke.push({ x: x + size * 0.25 + jitter(), y: y + jitter() });
      strokes.push(dStroke);
      
      // Fraction line
      strokes.push([
        { x: x - size * 0.1 + jitter(), y: y + size * 0.5 + jitter() },
        { x: x + size * 0.6 + jitter(), y: y + size * 0.5 + jitter() }
      ]);
      
      // 'dx' below
      strokes.push([
        { x: x + size * 0.1 + jitter(), y: y + size * 0.7 + jitter() },
        { x: x + size * 0.2 + jitter(), y: y + size * 0.9 + jitter() }
      ]);
      strokes.push([
        { x: x + size * 0.3 + jitter(), y: y + size * 0.6 + jitter() },
        { x: x + size * 0.5 + jitter(), y: y + size * 0.9 + jitter() }
      ]);
      break;
      
    default:
      // Generic: just a dot at position
      strokes.push([
        { x: x + jitter(), y: y + jitter() },
        { x: x + 1 + jitter(), y: y + 1 + jitter() }
      ]);
  }
  
  return { strokes };
}

/**
 * Generates handwriting-style points for a text string
 * Used for writing equations and formulas naturally on whiteboard
 */
export function generateTextAsHandwriting(
  text: string,
  startX: number,
  startY: number,
  fontSize: number = 24
): HandwritingStroke[] {
  const strokes: HandwritingStroke[] = [];
  const charWidth = fontSize * 0.6;
  let currentX = startX;
  
  // Character path definitions (simplified strokes)
  const charPaths: Record<string, Array<Array<{dx: number; dy: number}>>> = {
    // Numbers
    '0': [[{dx: 0.3, dy: 0}, {dx: 0.6, dy: 0.3}, {dx: 0.6, dy: 0.7}, {dx: 0.3, dy: 1}, {dx: 0, dy: 0.7}, {dx: 0, dy: 0.3}, {dx: 0.3, dy: 0}]],
    '1': [[{dx: 0.2, dy: 0.2}, {dx: 0.4, dy: 0}, {dx: 0.4, dy: 1}]],
    '2': [[{dx: 0.1, dy: 0.2}, {dx: 0.3, dy: 0}, {dx: 0.6, dy: 0.1}, {dx: 0.5, dy: 0.4}, {dx: 0, dy: 1}, {dx: 0.6, dy: 1}]],
    '3': [[{dx: 0.1, dy: 0.1}, {dx: 0.4, dy: 0}, {dx: 0.5, dy: 0.3}, {dx: 0.3, dy: 0.5}], [{dx: 0.3, dy: 0.5}, {dx: 0.5, dy: 0.7}, {dx: 0.4, dy: 1}, {dx: 0.1, dy: 0.9}]],
    '4': [[{dx: 0.5, dy: 0}, {dx: 0, dy: 0.6}, {dx: 0.6, dy: 0.6}], [{dx: 0.5, dy: 0.3}, {dx: 0.5, dy: 1}]],
    '5': [[{dx: 0.5, dy: 0}, {dx: 0, dy: 0}, {dx: 0, dy: 0.4}, {dx: 0.4, dy: 0.4}, {dx: 0.5, dy: 0.7}, {dx: 0.3, dy: 1}, {dx: 0, dy: 0.9}]],
    // Letters
    'x': [[{dx: 0, dy: 0.3}, {dx: 0.5, dy: 1}], [{dx: 0.5, dy: 0.3}, {dx: 0, dy: 1}]],
    'y': [[{dx: 0, dy: 0.3}, {dx: 0.25, dy: 0.7}], [{dx: 0.5, dy: 0.3}, {dx: 0.1, dy: 1.2}]],
    '+': [[{dx: 0.25, dy: 0.4}, {dx: 0.25, dy: 0.8}], [{dx: 0.05, dy: 0.6}, {dx: 0.45, dy: 0.6}]],
    '-': [[{dx: 0.1, dy: 0.5}, {dx: 0.5, dy: 0.5}]],
    '=': [[{dx: 0.1, dy: 0.4}, {dx: 0.5, dy: 0.4}], [{dx: 0.1, dy: 0.6}, {dx: 0.5, dy: 0.6}]],
    '(': [[{dx: 0.4, dy: 0}, {dx: 0.2, dy: 0.3}, {dx: 0.2, dy: 0.7}, {dx: 0.4, dy: 1}]],
    ')': [[{dx: 0.2, dy: 0}, {dx: 0.4, dy: 0.3}, {dx: 0.4, dy: 0.7}, {dx: 0.2, dy: 1}]],
    '^': [[{dx: 0.1, dy: 0.2}, {dx: 0.25, dy: 0}, {dx: 0.4, dy: 0.2}]],
    '²': [[{dx: 0, dy: 0}, {dx: 0.15, dy: -0.15}, {dx: 0.3, dy: -0.1}, {dx: 0.15, dy: 0.1}, {dx: 0, dy: 0.15}, {dx: 0.3, dy: 0.15}]],
    '³': [[{dx: 0, dy: -0.1}, {dx: 0.15, dy: -0.2}, {dx: 0.25, dy: -0.1}, {dx: 0.15, dy: 0}], [{dx: 0.15, dy: 0}, {dx: 0.25, dy: 0.1}, {dx: 0.15, dy: 0.2}]],
  };
  
  for (const char of text) {
    const lowerChar = char.toLowerCase();
    const jitter = () => (Math.random() - 0.5) * 2;
    
    if (charPaths[char] || charPaths[lowerChar]) {
      const paths = charPaths[char] || charPaths[lowerChar];
      for (const path of paths) {
        const points: HandwritingPoint[] = path.map(p => ({
          x: currentX + p.dx * charWidth + jitter(),
          y: startY + p.dy * fontSize + jitter()
        }));
        strokes.push({ points, baseWidth: 2 });
      }
    }
    
    currentX += charWidth;
  }
  
  return strokes;
}

/**
 * Clamps coordinates to stay within canvas bounds
 */
export function clampToBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
  margin: number = 30
): { x: number; y: number } {
  return {
    x: Math.max(margin, Math.min(canvasWidth - width - margin, x)),
    y: Math.max(margin, Math.min(canvasHeight - height - margin, y))
  };
}

/**
 * Global boundary constraints for Phoenix whiteboard actions
 */
export interface WhiteboardBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  safeMargin: number;
}

export function getWhiteboardBounds(canvasWidth: number, canvasHeight: number): WhiteboardBounds {
  const safeMargin = 40;
  return {
    minX: safeMargin,
    maxX: canvasWidth - safeMargin,
    minY: safeMargin,
    maxY: canvasHeight - safeMargin,
    safeMargin
  };
}

/**
 * Adjusts all points in a path to stay within bounds
 */
export function constrainPathToBounds(
  points: Array<{x: number; y: number}>,
  bounds: WhiteboardBounds
): Array<{x: number; y: number}> {
  return points.map(p => ({
    x: Math.max(bounds.minX, Math.min(bounds.maxX, p.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, p.y))
  }));
}
