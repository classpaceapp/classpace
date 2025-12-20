import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, Path, IText, FabricObject } from 'fabric';
import { PhoenixCursor } from './PhoenixCursor';
import type { WhiteboardAction } from '@/hooks/usePhoenixRealtime';
import { Button } from '@/components/ui/button';
import { Pencil, Square, Circle as CircleIcon, Type, Eraser, Trash2, MousePointer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  latexToVisualUnicode, 
  normalizeCoordinates, 
  WhiteboardLayoutManager,
  estimateTextWidth,
  estimateTextHeight
} from '@/utils/phoenixMathUtils';

interface PhoenixWhiteboardProps {
  onStateChange?: (state: any) => void;
  isConnected?: boolean;
}

export interface WhiteboardLayoutItem {
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  text?: string;
}

export interface PhoenixWhiteboardRef {
  executeAction: (action: WhiteboardAction) => void;
  captureScreenshot: () => Promise<string>;
  getState: () => any;
  loadState: (state: any) => void;
  clear: () => void;
  getWhiteboardLayout: () => { items: WhiteboardLayoutItem[]; canvasWidth: number; canvasHeight: number; nextY: number };
  getLayoutManager: () => WhiteboardLayoutManager | null;
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
  
  // Layout manager for smart positioning
  const layoutManagerRef = useRef<WhiteboardLayoutManager | null>(null);
  
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

    // Initialize layout manager
    layoutManagerRef.current = new WhiteboardLayoutManager(width, height);

    // Initialize free drawing brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = 3;
    }

    // Handle canvas changes
    canvas.on('object:added', () => {
      updateLayoutManager(canvas);
      if (onStateChange) {
        onStateChange(canvas.toJSON());
      }
    });

    canvas.on('object:modified', () => {
      updateLayoutManager(canvas);
      if (onStateChange) {
        onStateChange(canvas.toJSON());
      }
    });
    
    canvas.on('object:removed', () => {
      updateLayoutManager(canvas);
    });

    setFabricCanvas(canvas);

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      canvas.setDimensions({ width: newWidth, height: newHeight });
      canvas.renderAll();
      
      // Update layout manager dimensions
      if (layoutManagerRef.current) {
        layoutManagerRef.current = new WhiteboardLayoutManager(newWidth, newHeight);
        updateLayoutManager(canvas);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Update layout manager with current objects
  const updateLayoutManager = useCallback((canvas: FabricCanvas) => {
    if (!layoutManagerRef.current) return;
    
    const objects = canvas.getObjects();
    const regions = objects.map((obj: FabricObject) => {
      const bounds = obj.getBoundingRect();
      return {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height
      };
    });
    
    layoutManagerRef.current.updateFromObjects(regions);
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

  // Get whiteboard layout for Phoenix context
  const getWhiteboardLayout = useCallback((): { items: WhiteboardLayoutItem[]; canvasWidth: number; canvasHeight: number; nextY: number } => {
    if (!fabricCanvas) {
      return { items: [], canvasWidth: 1000, canvasHeight: 600, nextY: 50 };
    }
    
    const objects = fabricCanvas.getObjects();
    const items: WhiteboardLayoutItem[] = [];
    let maxBottom = 0;
    
    objects.forEach((obj: FabricObject) => {
      const bounds = obj.getBoundingRect();
      const item: WhiteboardLayoutItem = {
        type: obj.type || 'unknown',
        left: Math.round(bounds.left),
        top: Math.round(bounds.top),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      };
      
      // Extract text content if it's a text object
      if (obj.type === 'i-text' || obj.type === 'text') {
        item.text = (obj as IText).text?.substring(0, 50) || '';
      }
      
      items.push(item);
      
      const bottom = bounds.top + bounds.height;
      if (bottom > maxBottom) {
        maxBottom = bottom;
      }
    });
    
    // Calculate next safe Y position (with padding)
    const nextY = items.length === 0 ? 50 : Math.min(maxBottom + 50, 550);
    
    return {
      items,
      canvasWidth: fabricCanvas.width || 1000,
      canvasHeight: fabricCanvas.height || 600,
      nextY
    };
  }, [fabricCanvas]);

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
    getState: () => fabricCanvas?.toJSON() || {},
    loadState: (state: any) => {
      if (!fabricCanvas || !state) return;
      console.log('[WHITEBOARD] Loading state...');
      try {
        fabricCanvas.loadFromJSON(state, () => {
          fabricCanvas.renderAll();
          updateLayoutManager(fabricCanvas);
          console.log('[WHITEBOARD] State loaded successfully');
        });
      } catch (error) {
        console.error('[WHITEBOARD] Failed to load state:', error);
      }
    },
    clear: () => {
      if (!fabricCanvas) return;
      console.log('[WHITEBOARD] Clearing canvas');
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#ffffff';
      fabricCanvas.renderAll();
      setIsCursorVisible(false);
      
      // Clear layout manager
      if (layoutManagerRef.current) {
        layoutManagerRef.current.clear();
      }
    },
    getWhiteboardLayout,
    getLayoutManager: () => layoutManagerRef.current
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
    if (!fabricCanvas) return;
    
    const canvasWidth = fabricCanvas.width || 1000;
    const canvasHeight = fabricCanvas.height || 700;
    const pos = normalizeCoordinates(params.x, params.y, canvasWidth, canvasHeight);
    
    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition(pos);
    
    setTimeout(() => {
      setIsCursorActive(false);
    }, params.duration || 500);
  }, [fabricCanvas]);

  const handleDrawFreehand = useCallback((params: { points: Array<{ x: number; y: number }>; color?: string; strokeWidth?: number }) => {
    if (!fabricCanvas || !params.points?.length) return;

    const canvasWidth = fabricCanvas.width || 1000;
    const canvasHeight = fabricCanvas.height || 700;

    setIsCursorVisible(true);
    setIsCursorActive(true);
    
    // Normalize all points
    const normalizedPoints = params.points.map(p => normalizeCoordinates(p.x, p.y, canvasWidth, canvasHeight));
    setCursorPosition(normalizedPoints[0]);

    // Create SVG path string from normalized points
    let pathStr = `M ${normalizedPoints[0].x} ${normalizedPoints[0].y}`;
    for (let i = 1; i < normalizedPoints.length; i++) {
      pathStr += ` L ${normalizedPoints[i].x} ${normalizedPoints[i].y}`;
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

    const canvasWidth = fabricCanvas.width || 1000;
    const canvasHeight = fabricCanvas.height || 700;
    const fontSize = params.fontSize || 20;

    // Apply LaTeX to Unicode conversion for any math in the text
    const displayText = latexToVisualUnicode(params.text);
    
    // Estimate text dimensions
    const textWidth = estimateTextWidth(displayText, fontSize);
    const textHeight = estimateTextHeight(displayText, fontSize);

    setIsCursorVisible(true);
    setIsCursorActive(true);
    
    // Normalize preferred coordinates
    const preferredPos = normalizeCoordinates(params.x, params.y, canvasWidth, canvasHeight);
    
    // Use layout manager to find best position (avoiding collisions and overflow)
    let finalPos = preferredPos;
    if (layoutManagerRef.current) {
      const result = layoutManagerRef.current.findBestPosition(
        preferredPos.x, 
        preferredPos.y, 
        textWidth, 
        textHeight
      );
      finalPos = { x: result.x, y: result.y };
      
      if (result.overflow) {
        console.warn('[WHITEBOARD] Text placement had to be adjusted due to space constraints');
      }
    }
    
    setCursorPosition(finalPos);

    const text = new IText(displayText, {
      left: finalPos.x,
      top: finalPos.y,
      fill: params.color || '#000000',
      fontSize: fontSize,
      fontFamily: 'Arial, "Segoe UI Symbol", "Apple Symbols", sans-serif',
    });

    fabricCanvas.add(text);
    fabricCanvas.renderAll();
    
    // Register this text in the layout manager
    if (layoutManagerRef.current) {
      layoutManagerRef.current.addOccupiedRegion(finalPos.x, finalPos.y, textWidth, textHeight);
    }
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [fabricCanvas]);

  const handleDrawShape = useCallback((params: { 
    shape: string; 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
    x2?: number;
    y2?: number;
    color?: string; 
    fill?: string 
  }) => {
    if (!fabricCanvas) return;

    const canvasWidth = fabricCanvas.width || 1000;
    const canvasHeight = fabricCanvas.height || 700;

    setIsCursorVisible(true);
    setIsCursorActive(true);
    
    // Normalize starting coordinates from 1000x700 space to actual canvas
    const preferredStart = normalizeCoordinates(params.x, params.y, canvasWidth, canvasHeight);
    
    let shape: FabricObject | null = null;

    if (params.shape === 'rectangle') {
      const normalizedWidth = (params.width / 1000) * canvasWidth;
      const normalizedHeight = (params.height / 700) * canvasHeight;
      
      // Find best position avoiding collisions
      let finalPos = preferredStart;
      if (layoutManagerRef.current) {
        const result = layoutManagerRef.current.findBestPosition(
          preferredStart.x, preferredStart.y, normalizedWidth, normalizedHeight
        );
        finalPos = { x: result.x, y: result.y };
      }
      
      setCursorPosition(finalPos);
      
      shape = new Rect({
        left: finalPos.x,
        top: finalPos.y,
        width: normalizedWidth,
        height: normalizedHeight,
        fill: params.fill || 'transparent',
        stroke: params.color || '#000000',
        strokeWidth: 2,
      });
      
      if (layoutManagerRef.current) {
        layoutManagerRef.current.addOccupiedRegion(finalPos.x, finalPos.y, normalizedWidth, normalizedHeight);
      }
    } else if (params.shape === 'circle' || params.shape === 'ellipse') {
      const normalizedWidth = (params.width / 1000) * canvasWidth;
      const normalizedHeight = (params.height / 700) * canvasHeight;
      const radius = Math.min(normalizedWidth, normalizedHeight) / 2;
      
      // Find best position
      let finalPos = preferredStart;
      if (layoutManagerRef.current) {
        const result = layoutManagerRef.current.findBestPosition(
          preferredStart.x, preferredStart.y, radius * 2, radius * 2
        );
        finalPos = { x: result.x, y: result.y };
      }
      
      setCursorPosition(finalPos);
      
      shape = new Circle({
        left: finalPos.x,
        top: finalPos.y,
        radius: radius,
        fill: params.fill || 'transparent',
        stroke: params.color || '#000000',
        strokeWidth: 2,
      });
      
      if (layoutManagerRef.current) {
        layoutManagerRef.current.addOccupiedRegion(finalPos.x, finalPos.y, radius * 2, radius * 2);
      }
    } else if (params.shape === 'arrow' || params.shape === 'line') {
      // Lines and arrows use explicit endpoints - no collision avoidance but stay in bounds
      let start = preferredStart;
      let endX: number, endY: number;
      
      if (params.x2 !== undefined && params.y2 !== undefined) {
        const end = normalizeCoordinates(params.x2, params.y2, canvasWidth, canvasHeight);
        endX = end.x;
        endY = end.y;
      } else {
        const end = normalizeCoordinates(params.x + params.width, params.y + params.height, canvasWidth, canvasHeight);
        endX = end.x;
        endY = end.y;
      }
      
      // Clamp endpoints to stay within bounds
      const margin = 20;
      start.x = Math.max(margin, Math.min(start.x, canvasWidth - margin));
      start.y = Math.max(margin, Math.min(start.y, canvasHeight - margin));
      endX = Math.max(margin, Math.min(endX, canvasWidth - margin));
      endY = Math.max(margin, Math.min(endY, canvasHeight - margin));
      
      setCursorPosition(start);
      
      const pathStr = `M ${start.x} ${start.y} L ${endX} ${endY}`;
      shape = new Path(pathStr, {
        stroke: params.color || '#000000',
        strokeWidth: 2,
        fill: '',
      });
      
      // Add arrowhead for arrows
      if (params.shape === 'arrow') {
        const angle = Math.atan2(endY - start.y, endX - start.x);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        const arrow1X = endX - arrowLength * Math.cos(angle - arrowAngle);
        const arrow1Y = endY - arrowLength * Math.sin(angle - arrowAngle);
        const arrow2X = endX - arrowLength * Math.cos(angle + arrowAngle);
        const arrow2Y = endY - arrowLength * Math.sin(angle + arrowAngle);
        
        const arrowHeadPath = `M ${endX} ${endY} L ${arrow1X} ${arrow1Y} M ${endX} ${endY} L ${arrow2X} ${arrow2Y}`;
        const arrowHead = new Path(arrowHeadPath, {
          stroke: params.color || '#000000',
          strokeWidth: 2,
          fill: '',
        });
        fabricCanvas.add(arrowHead);
      }
    }

    if (shape) {
      fabricCanvas.add(shape);
      fabricCanvas.renderAll();
    }
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [fabricCanvas]);

  const handleDrawEquation = useCallback((params: { latex: string; x: number; y: number; fontSize?: number }) => {
    if (!fabricCanvas) return;

    const canvasWidth = fabricCanvas.width || 1000;
    const canvasHeight = fabricCanvas.height || 700;
    const fontSize = params.fontSize || 28;

    // Use the comprehensive LaTeX to Unicode converter
    const visualText = latexToVisualUnicode(params.latex);
    
    // Estimate text dimensions
    const textWidth = estimateTextWidth(visualText, fontSize);
    const textHeight = estimateTextHeight(visualText, fontSize);

    setIsCursorVisible(true);
    setIsCursorActive(true);
    
    // Normalize preferred coordinates
    const preferredPos = normalizeCoordinates(params.x, params.y, canvasWidth, canvasHeight);
    
    // Use layout manager to find best position
    let finalPos = preferredPos;
    if (layoutManagerRef.current) {
      const result = layoutManagerRef.current.findBestPosition(
        preferredPos.x, 
        preferredPos.y, 
        textWidth, 
        textHeight
      );
      finalPos = { x: result.x, y: result.y };
      
      if (result.overflow) {
        console.warn('[WHITEBOARD] Equation placement had to be adjusted due to space constraints');
      }
    }
    
    setCursorPosition(finalPos);

    const text = new IText(visualText, {
      left: finalPos.x,
      top: finalPos.y,
      fill: '#1e40af',
      fontSize: fontSize,
      fontFamily: 'Arial, "Segoe UI Symbol", "Apple Symbols", sans-serif',
    });

    fabricCanvas.add(text);
    fabricCanvas.renderAll();
    
    // Register in layout manager
    if (layoutManagerRef.current) {
      layoutManagerRef.current.addOccupiedRegion(finalPos.x, finalPos.y, textWidth, textHeight);
    }
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [fabricCanvas]);

  const handleHighlightArea = useCallback((params: { x: number; y: number; width: number; height: number; color?: string }) => {
    if (!fabricCanvas) return;

    const canvasWidth = fabricCanvas.width || 1000;
    const canvasHeight = fabricCanvas.height || 700;

    setIsCursorVisible(true);
    setIsCursorActive(true);
    
    // Normalize coordinates and dimensions
    const pos = normalizeCoordinates(params.x, params.y, canvasWidth, canvasHeight);
    setCursorPosition(pos);
    
    const normalizedWidth = (params.width / 1000) * canvasWidth;
    const normalizedHeight = (params.height / 700) * canvasHeight;
    
    // Clamp to stay within bounds
    const margin = 10;
    const clampedX = Math.max(margin, Math.min(pos.x, canvasWidth - normalizedWidth - margin));
    const clampedY = Math.max(margin, Math.min(pos.y, canvasHeight - normalizedHeight - margin));

    const highlight = new Rect({
      left: clampedX,
      top: clampedY,
      width: Math.min(normalizedWidth, canvasWidth - clampedX - margin),
      height: Math.min(normalizedHeight, canvasHeight - clampedY - margin),
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
    
    // Clear layout manager
    if (layoutManagerRef.current) {
      layoutManagerRef.current.clear();
    }
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
