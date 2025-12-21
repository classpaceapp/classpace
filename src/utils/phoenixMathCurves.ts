/**
 * Phoenix Mathematical Curve Generation
 * Generates smooth, mathematically precise curves for whiteboard rendering
 */

export type MathFunctionType = 
  | 'sin' | 'cos' | 'tan' 
  | 'parabola' | 'cubic' | 'exponential' | 'logarithm'
  | 'absolute' | 'sqrt' | 'reciprocal'
  | 'linear';

export interface MathCurveParams {
  function: MathFunctionType;
  xMin: number;      // Domain start (in canvas coordinates)
  xMax: number;      // Domain end (in canvas coordinates)
  yCenter: number;   // Y-axis center line
  amplitude: number; // Vertical scaling
  period?: number;   // For trig functions (in pixels)
  samples?: number;  // Number of points to generate (default 100)
  coefficient?: number; // For parabola (a in ax²), exponential base, etc.
  verticalShift?: number; // Shift the curve up/down
  horizontalShift?: number; // Shift left/right (phase shift)
}

export interface CoordinateSystemParams {
  originX: number;    // X position of origin
  originY: number;    // Y position of origin
  width: number;      // Width of the coordinate system
  height: number;     // Height of the coordinate system
  xMin: number;       // Minimum x value label
  xMax: number;       // Maximum x value label
  yMin: number;       // Minimum y value label
  yMax: number;       // Maximum y value label
  xStep?: number;     // Step between x tick marks
  yStep?: number;     // Step between y tick marks
  showGrid?: boolean; // Whether to show grid lines
  labels?: boolean;   // Whether to show labels
}

export interface MathSymbolPath {
  points: Array<{x: number; y: number}>;
  strokeWidth?: number;
}

/**
 * Generates smooth curve points for a mathematical function
 * Returns points with high enough sampling for smooth rendering
 */
export function generateMathCurvePoints(
  params: MathCurveParams,
  canvasWidth: number,
  canvasHeight: number
): Array<{x: number; y: number}> {
  const {
    function: fn,
    xMin,
    xMax,
    yCenter,
    amplitude,
    period = 200,
    samples = 100,
    coefficient = 1,
    verticalShift = 0,
    horizontalShift = 0
  } = params;
  
  const points: Array<{x: number; y: number}> = [];
  const step = (xMax - xMin) / samples;
  
  for (let i = 0; i <= samples; i++) {
    const x = xMin + i * step;
    const shiftedX = x - horizontalShift;
    let y: number;
    
    switch (fn) {
      case 'sin':
        // y = amplitude * sin(2π * x / period) + yCenter
        y = yCenter - amplitude * Math.sin((2 * Math.PI * shiftedX) / period) + verticalShift;
        break;
        
      case 'cos':
        y = yCenter - amplitude * Math.cos((2 * Math.PI * shiftedX) / period) + verticalShift;
        break;
        
      case 'tan':
        const tanVal = Math.tan((2 * Math.PI * shiftedX) / period);
        // Clamp extreme values to prevent visual artifacts
        const clampedTan = Math.max(-10, Math.min(10, tanVal));
        y = yCenter - amplitude * clampedTan + verticalShift;
        break;
        
      case 'parabola':
        // y = a(x - h)² + k where h is horizontal shift, k is vertical shift
        const normalizedX = (shiftedX - (xMin + xMax) / 2) / 100; // Normalize to reasonable scale
        y = yCenter - amplitude * coefficient * normalizedX * normalizedX + verticalShift;
        break;
        
      case 'cubic':
        const normX = (shiftedX - (xMin + xMax) / 2) / 100;
        y = yCenter - amplitude * coefficient * normX * normX * normX + verticalShift;
        break;
        
      case 'exponential':
        const expX = (shiftedX - xMin) / (xMax - xMin) * 4 - 2; // Map to [-2, 2]
        const expVal = Math.pow(coefficient || Math.E, expX);
        y = yCenter - amplitude * (expVal - 1) / (Math.E * Math.E - 1) + verticalShift;
        break;
        
      case 'logarithm':
        const logX = (shiftedX - xMin) / (xMax - xMin) * 9 + 1; // Map to [1, 10]
        y = yCenter - amplitude * Math.log(logX) / Math.log(10) + verticalShift;
        break;
        
      case 'absolute':
        const absX = (shiftedX - (xMin + xMax) / 2) / 50;
        y = yCenter - amplitude * Math.abs(absX) + verticalShift;
        break;
        
      case 'sqrt':
        const sqrtProgress = (shiftedX - xMin) / (xMax - xMin);
        if (sqrtProgress >= 0) {
          y = yCenter - amplitude * Math.sqrt(sqrtProgress) + verticalShift;
        } else {
          continue; // Skip negative domain for sqrt
        }
        break;
        
      case 'reciprocal':
        const recX = (shiftedX - (xMin + xMax) / 2) / 50;
        if (Math.abs(recX) > 0.1) {
          y = yCenter - amplitude / recX + verticalShift;
        } else {
          continue; // Skip near-zero to avoid asymptote
        }
        break;
        
      case 'linear':
      default:
        const slope = coefficient || 1;
        const linX = (shiftedX - (xMin + xMax) / 2) / 100;
        y = yCenter - amplitude * slope * linX + verticalShift;
        break;
    }
    
    // Clamp y to canvas bounds with margin
    const margin = 20;
    y = Math.max(margin, Math.min(canvasHeight - margin, y));
    
    points.push({ x: Math.round(x), y: Math.round(y) });
  }
  
  return points;
}

/**
 * Generates coordinate system elements (axes, ticks, labels)
 */
export function generateCoordinateSystem(
  params: CoordinateSystemParams,
  canvasWidth: number,
  canvasHeight: number
): {
  axes: Array<{points: Array<{x: number; y: number}>; strokeWidth: number}>;
  ticks: Array<{points: Array<{x: number; y: number}>; strokeWidth: number}>;
  labels: Array<{text: string; x: number; y: number; fontSize: number}>;
  gridLines?: Array<{points: Array<{x: number; y: number}>; strokeWidth: number; color: string}>;
} {
  const {
    originX,
    originY,
    width,
    height,
    xMin,
    xMax,
    yMin,
    yMax,
    xStep = 1,
    yStep = 1,
    showGrid = false,
    labels: showLabels = true
  } = params;
  
  const axes: Array<{points: Array<{x: number; y: number}>; strokeWidth: number}> = [];
  const ticks: Array<{points: Array<{x: number; y: number}>; strokeWidth: number}> = [];
  const labels: Array<{text: string; x: number; y: number; fontSize: number}> = [];
  const gridLines: Array<{points: Array<{x: number; y: number}>; strokeWidth: number; color: string}> = [];
  
  // Calculate scale factors
  const xScale = width / (xMax - xMin);
  const yScale = height / (yMax - yMin);
  
  // X-axis (horizontal line)
  const xAxisLeft = originX - Math.abs(xMin) * xScale;
  const xAxisRight = originX + xMax * xScale;
  axes.push({
    points: [
      { x: xAxisLeft, y: originY },
      { x: xAxisRight, y: originY }
    ],
    strokeWidth: 2
  });
  
  // X-axis arrow
  axes.push({
    points: [
      { x: xAxisRight, y: originY },
      { x: xAxisRight - 10, y: originY - 5 },
      { x: xAxisRight, y: originY },
      { x: xAxisRight - 10, y: originY + 5 }
    ],
    strokeWidth: 2
  });
  
  // Y-axis (vertical line)
  const yAxisTop = originY - yMax * yScale;
  const yAxisBottom = originY + Math.abs(yMin) * yScale;
  axes.push({
    points: [
      { x: originX, y: yAxisBottom },
      { x: originX, y: yAxisTop }
    ],
    strokeWidth: 2
  });
  
  // Y-axis arrow
  axes.push({
    points: [
      { x: originX, y: yAxisTop },
      { x: originX - 5, y: yAxisTop + 10 },
      { x: originX, y: yAxisTop },
      { x: originX + 5, y: yAxisTop + 10 }
    ],
    strokeWidth: 2
  });
  
  // X-axis ticks and labels
  for (let val = xMin; val <= xMax; val += xStep) {
    if (val === 0) continue; // Skip origin
    
    const tickX = originX + val * xScale;
    
    // Tick mark
    ticks.push({
      points: [
        { x: tickX, y: originY - 5 },
        { x: tickX, y: originY + 5 }
      ],
      strokeWidth: 1
    });
    
    // Label
    if (showLabels) {
      // Format special values like π
      let labelText = formatAxisValue(val, 'x');
      labels.push({
        text: labelText,
        x: tickX - 10,
        y: originY + 20,
        fontSize: 14
      });
    }
    
    // Grid line
    if (showGrid) {
      gridLines.push({
        points: [
          { x: tickX, y: yAxisTop },
          { x: tickX, y: yAxisBottom }
        ],
        strokeWidth: 0.5,
        color: '#e5e7eb'
      });
    }
  }
  
  // Y-axis ticks and labels
  for (let val = yMin; val <= yMax; val += yStep) {
    if (val === 0) continue; // Skip origin
    
    const tickY = originY - val * yScale;
    
    // Tick mark
    ticks.push({
      points: [
        { x: originX - 5, y: tickY },
        { x: originX + 5, y: tickY }
      ],
      strokeWidth: 1
    });
    
    // Label
    if (showLabels) {
      labels.push({
        text: val.toString(),
        x: originX - 25,
        y: tickY + 5,
        fontSize: 14
      });
    }
    
    // Grid line
    if (showGrid) {
      gridLines.push({
        points: [
          { x: xAxisLeft, y: tickY },
          { x: xAxisRight, y: tickY }
        ],
        strokeWidth: 0.5,
        color: '#e5e7eb'
      });
    }
  }
  
  // Axis labels (x and y)
  if (showLabels) {
    labels.push({
      text: 'x',
      x: xAxisRight - 5,
      y: originY + 25,
      fontSize: 16
    });
    labels.push({
      text: 'y',
      x: originX + 10,
      y: yAxisTop + 5,
      fontSize: 16
    });
  }
  
  return { axes, ticks, labels, gridLines: showGrid ? gridLines : undefined };
}

/**
 * Format axis values with special notation (π, fractions, etc.)
 */
function formatAxisValue(val: number, axis: 'x' | 'y'): string {
  // Check for π multiples (with tolerance)
  const piMultiple = val / Math.PI;
  if (Math.abs(piMultiple - Math.round(piMultiple)) < 0.01) {
    const rounded = Math.round(piMultiple);
    if (rounded === 0) return '0';
    if (rounded === 1) return 'π';
    if (rounded === -1) return '-π';
    return `${rounded}π`;
  }
  
  // Check for π/2 multiples
  const halfPiMultiple = val / (Math.PI / 2);
  if (Math.abs(halfPiMultiple - Math.round(halfPiMultiple)) < 0.01) {
    const rounded = Math.round(halfPiMultiple);
    if (rounded === 1) return 'π/2';
    if (rounded === -1) return '-π/2';
    if (rounded === 3) return '3π/2';
    if (rounded === -3) return '-3π/2';
  }
  
  // Default: just show the number
  return val % 1 === 0 ? val.toString() : val.toFixed(1);
}

/**
 * Generates smooth freehand paths for mathematical symbols
 */
export function generateMathSymbolPath(
  symbol: 'integral' | 'derivative' | 'partial' | 'sum' | 'product' | 'sqrt' | 'infinity',
  x: number,
  y: number,
  size: number = 40
): MathSymbolPath[] {
  const paths: MathSymbolPath[] = [];
  
  switch (symbol) {
    case 'integral':
      // ∫ - S-shaped curve
      paths.push({
        points: generateSCurve(x, y, size),
        strokeWidth: 2
      });
      break;
      
    case 'derivative':
      // d/dx style
      paths.push({
        points: [
          { x: x, y: y - size/2 },
          { x: x + size * 0.6, y: y - size/2 },
        ],
        strokeWidth: 2
      });
      // Vertical line for fraction
      paths.push({
        points: [
          { x: x, y: y - size * 0.3 },
          { x: x + size * 0.6, y: y - size * 0.3 },
        ],
        strokeWidth: 1
      });
      break;
      
    case 'partial':
      // ∂ - curved shape
      paths.push({
        points: generatePartialSymbol(x, y, size),
        strokeWidth: 2
      });
      break;
      
    case 'sum':
      // Σ - sigma shape
      paths.push({
        points: generateSigmaSymbol(x, y, size),
        strokeWidth: 2
      });
      break;
      
    case 'product':
      // Π - pi shape
      paths.push({
        points: [
          { x: x, y: y },
          { x: x + size, y: y },
          { x: x + size, y: y + size },
        ],
        strokeWidth: 2
      });
      paths.push({
        points: [
          { x: x, y: y },
          { x: x, y: y + size },
        ],
        strokeWidth: 2
      });
      break;
      
    case 'sqrt':
      // √ - check mark with horizontal line
      paths.push({
        points: generateSqrtSymbol(x, y, size),
        strokeWidth: 2
      });
      break;
      
    case 'infinity':
      // ∞ - figure eight on its side
      paths.push({
        points: generateInfinitySymbol(x, y, size),
        strokeWidth: 2
      });
      break;
  }
  
  return paths;
}

function generateSCurve(x: number, y: number, size: number): Array<{x: number; y: number}> {
  const points: Array<{x: number; y: number}> = [];
  const steps = 30;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // S-curve parametric equations
    const curveX = x + size * 0.2 * Math.sin(t * Math.PI);
    const curveY = y - size/2 + t * size;
    points.push({ x: Math.round(curveX), y: Math.round(curveY) });
  }
  
  // Top curl
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const curl = {
      x: x + size * 0.2 * Math.cos(t * Math.PI),
      y: y - size/2 - size * 0.1 * Math.sin(t * Math.PI)
    };
    points.unshift({ x: Math.round(curl.x), y: Math.round(curl.y) });
  }
  
  return points;
}

function generatePartialSymbol(x: number, y: number, size: number): Array<{x: number; y: number}> {
  const points: Array<{x: number; y: number}> = [];
  const steps = 25;
  
  // Main loop of ∂
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 1.5 * Math.PI;
    const px = x + size * 0.3 + size * 0.25 * Math.cos(t);
    const py = y + size * 0.3 * Math.sin(t);
    points.push({ x: Math.round(px), y: Math.round(py) });
  }
  
  // Tail going up
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    points.push({ 
      x: Math.round(x + size * 0.5 - t * size * 0.2), 
      y: Math.round(y - t * size * 0.4) 
    });
  }
  
  return points;
}

function generateSigmaSymbol(x: number, y: number, size: number): Array<{x: number; y: number}> {
  return [
    { x: x + size, y: y },
    { x: x, y: y },
    { x: x + size * 0.5, y: y + size * 0.5 },
    { x: x, y: y + size },
    { x: x + size, y: y + size }
  ];
}

function generateSqrtSymbol(x: number, y: number, size: number): Array<{x: number; y: number}> {
  return [
    { x: x, y: y + size * 0.3 },
    { x: x + size * 0.15, y: y + size * 0.5 },
    { x: x + size * 0.35, y: y + size },
    { x: x + size * 0.5, y: y },
    { x: x + size, y: y }
  ];
}

function generateInfinitySymbol(x: number, y: number, size: number): Array<{x: number; y: number}> {
  const points: Array<{x: number; y: number}> = [];
  const steps = 50;
  
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    // Lemniscate of Bernoulli parametric equations
    const scale = size * 0.4;
    const denom = 1 + Math.sin(t) * Math.sin(t);
    const px = x + size * 0.5 + scale * Math.cos(t) / denom;
    const py = y + scale * Math.sin(t) * Math.cos(t) / denom;
    points.push({ x: Math.round(px), y: Math.round(py) });
  }
  
  return points;
}

/**
 * Converts curve points to smooth Bezier path string for Fabric.js
 */
export function pointsToSmoothPath(points: Array<{x: number; y: number}>): string {
  if (points.length < 2) return '';
  
  // Use quadratic Bezier curves for smoothness
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // Calculate control point for smooth curve
    const midX = (p0.x + p2.x) / 2;
    const midY = (p0.y + p2.y) / 2;
    
    // Quadratic curve through current point
    path += ` Q ${p1.x} ${p1.y} ${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2}`;
  }
  
  // Line to final point
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  
  return path;
}

/**
 * Standard trig function periods in terms of canvas pixels
 */
export const STANDARD_PERIODS = {
  degrees360: 400, // One full cycle = 400px
  degrees180: 200, // Half cycle = 200px
  piPeriod: 200,   // π period (for tan)
  twoPi: 400,      // 2π period (for sin/cos)
};
