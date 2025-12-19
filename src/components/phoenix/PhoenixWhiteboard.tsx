import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, Path, IText, FabricObject } from 'fabric';
import { PhoenixCursor } from './PhoenixCursor';
import type { WhiteboardAction } from '@/hooks/usePhoenixRealtime';
import { Button } from '@/components/ui/button';
import { Pencil, Square, Circle as CircleIcon, Type, Eraser, Trash2, MousePointer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhoenixWhiteboardProps {
  onStateChange?: (state: any) => void;
  isConnected?: boolean;
}

export interface PhoenixWhiteboardRef {
  executeAction: (action: WhiteboardAction) => void;
  captureScreenshot: () => Promise<string>;
  getState: () => any;
}

type Tool = 'select' | 'draw' | 'rectangle' | 'circle' | 'text' | 'eraser';

export const PhoenixWhiteboard = forwardRef<PhoenixWhiteboardRef, PhoenixWhiteboardProps>(({
  onStateChange,
  isConnected = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('draw');
  const [activeColor, setActiveColor] = useState('#000000');
  
  // Phoenix cursor state
  const [cursorPosition, setCursorPosition] = useState({ x: 400, y: 300 });
  const [isCursorVisible, setIsCursorVisible] = useState(false);
  const [isCursorActive, setIsCursorActive] = useState(false);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: '#ffffff',
      isDrawingMode: true,
    });

    // Initialize free drawing brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = 3;
    }

    // Handle canvas changes
    canvas.on('object:added', () => {
      if (onStateChange) {
        onStateChange(canvas.toJSON());
      }
    });

    canvas.on('object:modified', () => {
      if (onStateChange) {
        onStateChange(canvas.toJSON());
      }
    });

    setFabricCanvas(canvas);

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      canvas.setDimensions({ width: newWidth, height: newHeight });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Update tool mode
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'draw' || activeTool === 'eraser';
    fabricCanvas.selection = activeTool === 'select';

    if (activeTool === 'draw' && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 3;
    } else if (activeTool === 'eraser' && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = '#ffffff';
      fabricCanvas.freeDrawingBrush.width = 20;
    }
  }, [activeTool, activeColor, fabricCanvas]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    executeAction: (action: WhiteboardAction) => executeWhiteboardAction(action),
    captureScreenshot: async () => {
      if (!fabricCanvas) return '';
      try {
        const dataURL = fabricCanvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 1,
        });
        // Remove the data URL prefix to get just the base64
        return dataURL.split(',')[1] || '';
      } catch (error) {
        console.error('[WHITEBOARD] Screenshot error:', error);
        return '';
      }
    },
    getState: () => fabricCanvas?.toJSON() || {}
  }));

  const executeWhiteboardAction = useCallback((action: WhiteboardAction) => {
    if (!fabricCanvas) {
      console.warn('[WHITEBOARD] Canvas not ready');
      return;
    }

    console.log('[WHITEBOARD] Executing action:', action.type, action.params);

    switch (action.type) {
      case 'move_cursor':
        handleMoveCursor(action.params as { x: number; y: number; duration?: number });
        break;
      case 'draw_freehand':
        handleDrawFreehand(action.params as { points: Array<{ x: number; y: number }>; color?: string; strokeWidth?: number });
        break;
      case 'draw_text':
        handleDrawText(action.params as { text: string; x: number; y: number; fontSize?: number; color?: string });
        break;
      case 'draw_shape':
        handleDrawShape(action.params as { shape: string; x: number; y: number; width: number; height: number; color?: string; fill?: string });
        break;
      case 'draw_equation':
        handleDrawEquation(action.params as { latex: string; x: number; y: number; fontSize?: number });
        break;
      case 'highlight_area':
        handleHighlightArea(action.params as { x: number; y: number; width: number; height: number; color?: string });
        break;
      case 'clear_whiteboard':
        handleClearWhiteboard();
        break;
      case 'capture_screenshot':
        // Handled by parent
        break;
    }
  }, [fabricCanvas]);

  const handleMoveCursor = useCallback((params: { x: number; y: number; duration?: number }) => {
    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition({ x: params.x, y: params.y });
    
    setTimeout(() => {
      setIsCursorActive(false);
    }, params.duration || 500);
  }, []);

  const handleDrawFreehand = useCallback((params: { points: Array<{ x: number; y: number }>; color?: string; strokeWidth?: number }) => {
    if (!fabricCanvas || !params.points?.length) return;

    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition(params.points[0]);

    // Create SVG path string from points
    let pathStr = `M ${params.points[0].x} ${params.points[0].y}`;
    for (let i = 1; i < params.points.length; i++) {
      pathStr += ` L ${params.points[i].x} ${params.points[i].y}`;
    }

    const path = new Path(pathStr, {
      stroke: params.color || '#000000',
      strokeWidth: params.strokeWidth || 3,
      fill: '',
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
    });

    fabricCanvas.add(path);
    fabricCanvas.renderAll();
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [fabricCanvas]);

  const handleDrawText = useCallback((params: { text: string; x: number; y: number; fontSize?: number; color?: string }) => {
    if (!fabricCanvas) return;

    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition({ x: params.x, y: params.y });

    const text = new IText(params.text, {
      left: params.x,
      top: params.y,
      fill: params.color || '#000000',
      fontSize: params.fontSize || 20,
      fontFamily: 'Arial',
    });

    fabricCanvas.add(text);
    fabricCanvas.renderAll();
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [fabricCanvas]);

  const handleDrawShape = useCallback((params: { 
    shape: string; 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
    color?: string; 
    fill?: string 
  }) => {
    if (!fabricCanvas) return;

    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition({ x: params.x, y: params.y });

    let shape: FabricObject | null = null;

    if (params.shape === 'rectangle') {
      shape = new Rect({
        left: params.x,
        top: params.y,
        width: params.width,
        height: params.height,
        fill: params.fill || 'transparent',
        stroke: params.color || '#000000',
        strokeWidth: 2,
      });
    } else if (params.shape === 'circle' || params.shape === 'ellipse') {
      shape = new Circle({
        left: params.x,
        top: params.y,
        radius: Math.min(params.width, params.height) / 2,
        fill: params.fill || 'transparent',
        stroke: params.color || '#000000',
        strokeWidth: 2,
      });
    } else if (params.shape === 'arrow' || params.shape === 'line') {
      const pathStr = `M ${params.x} ${params.y} L ${params.x + params.width} ${params.y + params.height}`;
      shape = new Path(pathStr, {
        stroke: params.color || '#000000',
        strokeWidth: 2,
        fill: '',
      });
    }

    if (shape) {
      fabricCanvas.add(shape);
      fabricCanvas.renderAll();
    }
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [fabricCanvas]);

  const handleDrawEquation = useCallback((params: { latex: string; x: number; y: number; fontSize?: number }) => {
    if (!fabricCanvas) return;

    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition({ x: params.x, y: params.y });

    // Convert LaTeX-style syntax to visual Unicode characters
    let visualText = params.latex
      // Powers
      .replace(/\^2/g, '²').replace(/\^3/g, '³').replace(/\^4/g, '⁴')
      .replace(/\^0/g, '⁰').replace(/\^1/g, '¹').replace(/\^5/g, '⁵')
      .replace(/\^6/g, '⁶').replace(/\^7/g, '⁷').replace(/\^8/g, '⁸').replace(/\^9/g, '⁹')
      .replace(/\^n/g, 'ⁿ').replace(/\^i/g, 'ⁱ')
      .replace(/\^{(\d+)}/g, (_, p) => p.split('').map((d: string) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(d)] || d).join(''))
      // Subscripts
      .replace(/_0/g, '₀').replace(/_1/g, '₁').replace(/_2/g, '₂').replace(/_3/g, '₃')
      .replace(/_4/g, '₄').replace(/_5/g, '₅').replace(/_6/g, '₆').replace(/_7/g, '₇')
      .replace(/_8/g, '₈').replace(/_9/g, '₉').replace(/_n/g, 'ₙ').replace(/_i/g, 'ᵢ')
      .replace(/_{(\d+)}/g, (_, p) => p.split('').map((d: string) => '₀₁₂₃₄₅₆₇₈₉'[parseInt(d)] || d).join(''))
      // Fractions
      .replace(/\\frac\{1\}\{2\}/g, '½').replace(/\\frac\{1\}\{3\}/g, '⅓')
      .replace(/\\frac\{1\}\{4\}/g, '¼').replace(/\\frac\{2\}\{3\}/g, '⅔')
      .replace(/\\frac\{3\}\{4\}/g, '¾').replace(/\\frac\{1\}\{5\}/g, '⅕')
      .replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '$1/$2')
      // Greek letters
      .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\gamma/g, 'γ')
      .replace(/\\delta/g, 'δ').replace(/\\epsilon/g, 'ε').replace(/\\theta/g, 'θ')
      .replace(/\\lambda/g, 'λ').replace(/\\mu/g, 'μ').replace(/\\pi/g, 'π')
      .replace(/\\sigma/g, 'σ').replace(/\\phi/g, 'φ').replace(/\\omega/g, 'ω')
      .replace(/\\Delta/g, 'Δ').replace(/\\Sigma/g, 'Σ').replace(/\\Pi/g, 'Π')
      .replace(/\\Omega/g, 'Ω').replace(/\\Gamma/g, 'Γ')
      // Math symbols
      .replace(/\\sqrt\{(.+?)\}/g, '√($1)').replace(/\\sqrt/g, '√')
      .replace(/\\infty/g, '∞').replace(/\\pm/g, '±').replace(/\\mp/g, '∓')
      .replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\cdot/g, '·')
      .replace(/\\neq/g, '≠').replace(/\\leq/g, '≤').replace(/\\geq/g, '≥')
      .replace(/\\approx/g, '≈').replace(/\\equiv/g, '≡')
      .replace(/\\rightarrow/g, '→').replace(/\\leftarrow/g, '←')
      .replace(/\\leftrightarrow/g, '↔').replace(/\\Rightarrow/g, '⇒')
      .replace(/\\int/g, '∫').replace(/\\sum/g, '∑').replace(/\\prod/g, '∏')
      .replace(/\\partial/g, '∂').replace(/\\nabla/g, '∇')
      // Clean up any remaining LaTeX commands
      .replace(/\\/g, '');

    const text = new IText(visualText, {
      left: params.x,
      top: params.y,
      fill: '#1e40af',
      fontSize: params.fontSize || 28,
      fontFamily: 'Arial, "Segoe UI Symbol", sans-serif',
    });

    fabricCanvas.add(text);
    fabricCanvas.renderAll();
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [fabricCanvas]);

  const handleHighlightArea = useCallback((params: { x: number; y: number; width: number; height: number; color?: string }) => {
    if (!fabricCanvas) return;

    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition({ x: params.x, y: params.y });

    const highlight = new Rect({
      left: params.x,
      top: params.y,
      width: params.width,
      height: params.height,
      fill: params.color || 'rgba(255, 255, 0, 0.3)',
      stroke: '',
      strokeWidth: 0,
      opacity: 0.5,
    });

    fabricCanvas.add(highlight);
    fabricCanvas.renderAll();
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [fabricCanvas]);

  const handleClearWhiteboard = useCallback(() => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    setIsCursorVisible(false);
  }, [fabricCanvas]);

  const handleToolClick = (tool: Tool) => {
    if (!fabricCanvas) return;
    setActiveTool(tool);

    if (tool === 'rectangle') {
      fabricCanvas.isDrawingMode = false;
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 2,
        width: 150,
        height: 100,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
      fabricCanvas.renderAll();
    } else if (tool === 'circle') {
      fabricCanvas.isDrawingMode = false;
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 2,
        radius: 50,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
      fabricCanvas.renderAll();
    } else if (tool === 'text') {
      fabricCanvas.isDrawingMode = false;
      const text = new IText('Click to edit', {
        left: 100,
        top: 100,
        fill: activeColor,
        fontSize: 24,
        fontFamily: 'Arial',
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      fabricCanvas.renderAll();
    }
  };

  // Show cursor when Phoenix is active (voice connected OR text mode with session)
  useEffect(() => {
    if (isConnected) {
      setIsCursorVisible(true);
    }
    // Don't hide cursor if disconnected - may still be in text mode
  }, [isConnected]);

  return (
    <div className="relative h-full w-full flex flex-col rounded-2xl overflow-hidden border-2 border-gray-200 bg-white shadow-xl">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
          <Button
            size="sm"
            variant={activeTool === 'select' ? 'default' : 'ghost'}
            onClick={() => {
              setActiveTool('select');
              if (fabricCanvas) fabricCanvas.isDrawingMode = false;
            }}
            className={cn("h-8 w-8 p-0", activeTool === 'select' && "bg-orange-500 hover:bg-orange-600")}
            title="Select"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === 'draw' ? 'default' : 'ghost'}
            onClick={() => handleToolClick('draw')}
            className={cn("h-8 w-8 p-0", activeTool === 'draw' && "bg-orange-500 hover:bg-orange-600")}
            title="Draw"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
            onClick={() => handleToolClick('rectangle')}
            className={cn("h-8 w-8 p-0", activeTool === 'rectangle' && "bg-orange-500 hover:bg-orange-600")}
            title="Rectangle"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === 'circle' ? 'default' : 'ghost'}
            onClick={() => handleToolClick('circle')}
            className={cn("h-8 w-8 p-0", activeTool === 'circle' && "bg-orange-500 hover:bg-orange-600")}
            title="Circle"
          >
            <CircleIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === 'text' ? 'default' : 'ghost'}
            onClick={() => handleToolClick('text')}
            className={cn("h-8 w-8 p-0", activeTool === 'text' && "bg-orange-500 hover:bg-orange-600")}
            title="Text"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === 'eraser' ? 'default' : 'ghost'}
            onClick={() => handleToolClick('eraser')}
            className={cn("h-8 w-8 p-0", activeTool === 'eraser' && "bg-orange-500 hover:bg-orange-600")}
            title="Eraser"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        {/* Color picker */}
        <input
          type="color"
          value={activeColor}
          onChange={(e) => setActiveColor(e.target.value)}
          className="h-8 w-10 rounded border border-gray-300 cursor-pointer"
          title="Pick color"
        />

        {/* Clear button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleClearWhiteboard}
          className="h-8 ml-auto"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>

        {/* Connection indicator */}
        {isConnected && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-700">Phoenix Active</span>
          </div>
        )}
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {/* Phoenix AI Cursor - positioned outside canvas wrapper to avoid Fabric.js DOM conflicts */}
        {isCursorVisible && isConnected && (
          <PhoenixCursor
            x={cursorPosition.x}
            y={cursorPosition.y}
            isVisible={true}
            isActive={isCursorActive}
          />
        )}

        {/* Fabric Canvas - isolated in its own div to prevent React/Fabric.js DOM conflicts */}
        <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
});

PhoenixWhiteboard.displayName = 'PhoenixWhiteboard';
