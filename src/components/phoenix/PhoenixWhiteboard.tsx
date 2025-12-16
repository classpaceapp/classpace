import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import { PhoenixCursor } from './PhoenixCursor';
import type { WhiteboardAction } from '@/hooks/usePhoenixRealtime';

interface PhoenixWhiteboardProps {
  onStateChange?: (state: any) => void;
  isConnected?: boolean;
}

export interface PhoenixWhiteboardRef {
  executeAction: (action: WhiteboardAction) => void;
  captureScreenshot: () => Promise<string>;
  getState: () => any;
}

export const PhoenixWhiteboard = forwardRef<PhoenixWhiteboardRef, PhoenixWhiteboardProps>(({
  onStateChange,
  isConnected = false
}, ref) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 500, y: 350 });
  const [isCursorVisible, setIsCursorVisible] = useState(false);
  const [isCursorActive, setIsCursorActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    executeAction: (action: WhiteboardAction) => executeWhiteboardAction(action),
    captureScreenshot: async () => {
      if (!excalidrawAPI) return '';
      try {
        const blob = await exportToBlob({
          elements: excalidrawAPI.getSceneElements(),
          appState: excalidrawAPI.getAppState(),
          files: excalidrawAPI.getFiles(),
          mimeType: 'image/png',
        });
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('[WHITEBOARD] Screenshot error:', error);
        return '';
      }
    },
    getState: () => excalidrawAPI?.getSceneElements() || []
  }));

  const executeWhiteboardAction = useCallback((action: WhiteboardAction) => {
    if (!excalidrawAPI) {
      console.warn('[WHITEBOARD] Excalidraw API not ready');
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
        // This is handled by the parent component
        break;
    }
  }, [excalidrawAPI]);

  const handleMoveCursor = useCallback((params: { x: number; y: number; duration?: number }) => {
    setIsCursorVisible(true);
    setIsCursorActive(true);
    
    // Animate cursor movement
    setCursorPosition({ x: params.x, y: params.y });
    
    // Reset active state after animation
    setTimeout(() => {
      setIsCursorActive(false);
    }, params.duration || 500);
  }, []);

  const handleDrawFreehand = useCallback((params: { points: Array<{ x: number; y: number }>; color?: string; strokeWidth?: number }) => {
    if (!excalidrawAPI || !params.points?.length) return;

    // Show cursor at first point
    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition(params.points[0]);

    const elements = excalidrawAPI.getSceneElements();
    
    // Create freedraw element
    const freedrawElement = {
      type: 'freedraw',
      x: params.points[0].x,
      y: params.points[0].y,
      strokeColor: params.color || '#000000',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: params.strokeWidth || 2,
      roughness: 0,
      opacity: 100,
      points: params.points.map((p, i) => [p.x - params.points[0].x, p.y - params.points[0].y, i === 0 ? 0 : 0.5]),
      simulatePressure: true,
      id: `phoenix-draw-${Date.now()}`,
    };

    excalidrawAPI.updateScene({ elements: [...elements, freedrawElement] });
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [excalidrawAPI]);

  const handleDrawText = useCallback((params: { text: string; x: number; y: number; fontSize?: number; color?: string }) => {
    if (!excalidrawAPI) return;

    // Show cursor at position
    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition({ x: params.x, y: params.y });

    const elements = excalidrawAPI.getSceneElements();
    
    const textElement = {
      type: 'text',
      x: params.x,
      y: params.y,
      text: params.text,
      fontSize: params.fontSize || 20,
      fontFamily: 1,
      textAlign: 'left',
      verticalAlign: 'top',
      strokeColor: params.color || '#000000',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
      width: params.text.length * (params.fontSize || 20) * 0.6,
      height: (params.fontSize || 20) * 1.5,
      id: `phoenix-text-${Date.now()}`,
    };

    excalidrawAPI.updateScene({ elements: [...elements, textElement] });
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [excalidrawAPI]);

  const handleDrawShape = useCallback((params: { 
    shape: string; 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
    color?: string; 
    fill?: string 
  }) => {
    if (!excalidrawAPI) return;

    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition({ x: params.x, y: params.y });

    const elements = excalidrawAPI.getSceneElements();
    
    let shapeType = params.shape;
    if (params.shape === 'circle') shapeType = 'ellipse';
    if (params.shape === 'line') shapeType = 'line';
    if (params.shape === 'arrow') shapeType = 'arrow';

    const shapeElement: any = {
      type: shapeType,
      x: params.x,
      y: params.y,
      width: params.width,
      height: params.height,
      strokeColor: params.color || '#000000',
      backgroundColor: params.fill || 'transparent',
      fillStyle: params.fill ? 'solid' : 'hachure',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
      id: `phoenix-shape-${Date.now()}`,
    };

    // For arrows and lines, we need points
    if (shapeType === 'arrow' || shapeType === 'line') {
      shapeElement.points = [[0, 0], [params.width, params.height]];
    }

    excalidrawAPI.updateScene({ elements: [...elements, shapeElement] });
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [excalidrawAPI]);

  const handleDrawEquation = useCallback((params: { latex: string; x: number; y: number; fontSize?: number }) => {
    if (!excalidrawAPI) return;

    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition({ x: params.x, y: params.y });

    // For now, render LaTeX as text (Excalidraw doesn't natively support LaTeX)
    // In production, you'd want to render to image and embed
    const elements = excalidrawAPI.getSceneElements();
    
    const textElement = {
      type: 'text',
      x: params.x,
      y: params.y,
      text: params.latex,
      fontSize: params.fontSize || 24,
      fontFamily: 3, // Monospace for equations
      textAlign: 'left',
      verticalAlign: 'top',
      strokeColor: '#1e40af',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
      width: params.latex.length * (params.fontSize || 24) * 0.6,
      height: (params.fontSize || 24) * 1.5,
      id: `phoenix-equation-${Date.now()}`,
    };

    excalidrawAPI.updateScene({ elements: [...elements, textElement] });
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [excalidrawAPI]);

  const handleHighlightArea = useCallback((params: { x: number; y: number; width: number; height: number; color?: string }) => {
    if (!excalidrawAPI) return;

    setIsCursorVisible(true);
    setIsCursorActive(true);
    setCursorPosition({ x: params.x, y: params.y });

    const elements = excalidrawAPI.getSceneElements();
    
    const highlightElement = {
      type: 'rectangle',
      x: params.x,
      y: params.y,
      width: params.width,
      height: params.height,
      strokeColor: 'transparent',
      backgroundColor: params.color || 'rgba(255, 255, 0, 0.3)',
      fillStyle: 'solid',
      strokeWidth: 0,
      roughness: 0,
      opacity: 50,
      id: `phoenix-highlight-${Date.now()}`,
    };

    excalidrawAPI.updateScene({ elements: [...elements, highlightElement] });
    
    setTimeout(() => setIsCursorActive(false), 300);
  }, [excalidrawAPI]);

  const handleClearWhiteboard = useCallback(() => {
    if (!excalidrawAPI) return;
    excalidrawAPI.resetScene();
    setIsCursorVisible(false);
  }, [excalidrawAPI]);

  const handleChange = useCallback((elements: any, appState: any) => {
    if (onStateChange) {
      onStateChange({ elements, appState });
    }
  }, [onStateChange]);

  // Show cursor when connected
  useEffect(() => {
    if (isConnected && !isCursorVisible) {
      setIsCursorVisible(true);
    }
    if (!isConnected) {
      setIsCursorVisible(false);
    }
  }, [isConnected]);

  return (
    <div ref={containerRef} className="relative h-full w-full rounded-2xl overflow-hidden border-2 border-gray-200 bg-white shadow-xl">
      {/* Phoenix AI Cursor */}
      <PhoenixCursor
        x={cursorPosition.x}
        y={cursorPosition.y}
        isVisible={isCursorVisible && isConnected}
        isActive={isCursorActive}
      />

      {/* Excalidraw Canvas */}
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
        initialData={{
          appState: {
            viewBackgroundColor: '#ffffff',
            currentItemStrokeColor: '#000000',
            currentItemBackgroundColor: 'transparent',
          },
        }}
        UIOptions={{
          canvasActions: {
            clearCanvas: true,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
          },
        }}
      />

      {/* Connection indicator */}
      {isConnected && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-700">Phoenix Active</span>
        </div>
      )}
    </div>
  );
});

PhoenixWhiteboard.displayName = 'PhoenixWhiteboard';
