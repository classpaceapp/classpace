import React, { useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Button } from '@/components/ui/button';
import { Eraser, Pen, Square, Circle, Type, Undo, Redo, Trash2 } from 'lucide-react';

interface CollaborativeWhiteboardProps {
  sessionId: string;
  onStateChange?: (state: any) => void;
  aiDrawCommands?: any[];
}

export const CollaborativeWhiteboard: React.FC<CollaborativeWhiteboardProps> = ({
  sessionId,
  onStateChange,
  aiDrawCommands = []
}) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);

  useEffect(() => {
    // Initialize Yjs document for real-time collaboration
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create WebRTC provider for peer-to-peer sync
    const provider = new WebrtcProvider(`phoenix-session-${sessionId}`, ydoc, {
      signaling: ['wss://signaling.yjs.dev'], // Using public signaling server
    });
    providerRef.current = provider;

    console.log('[WHITEBOARD] Initialized Yjs collaboration for session:', sessionId);

    // Cleanup on unmount
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!excalidrawAPI) return;

    // Execute AI draw commands
    aiDrawCommands.forEach(command => {
      try {
        executeDrawCommand(command);
      } catch (error) {
        console.error('[WHITEBOARD] Error executing draw command:', error);
      }
    });
  }, [aiDrawCommands, excalidrawAPI]);

  const executeDrawCommand = (command: any) => {
    if (!excalidrawAPI) return;

    console.log('[WHITEBOARD] Executing AI draw command:', command);

    const elements = excalidrawAPI.getSceneElements();
    const newElements = [...elements];

    if (command.type === 'draw_text') {
      // Add text element
      const textElement = {
        type: 'text',
        x: command.position?.x || 200,
        y: command.position?.y || 150,
        text: command.content || '',
        fontSize: 20,
        fontFamily: 1,
        textAlign: 'left',
        verticalAlign: 'top',
        strokeColor: command.color || '#000000',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        roughness: 0,
        opacity: 100,
        width: command.content?.length * 12 || 100,
        height: 25,
        id: `ai-text-${Date.now()}-${Math.random()}`,
      };
      newElements.push(textElement);
    } else if (command.type === 'draw_shape') {
      // Add shape element
      const shapeElement = {
        type: command.shape === 'circle' ? 'ellipse' : command.shape,
        x: command.start?.x || 100,
        y: command.start?.y || 100,
        width: Math.abs((command.end?.x || 300) - (command.start?.x || 100)),
        height: Math.abs((command.end?.y || 200) - (command.start?.y || 100)),
        strokeColor: command.color || '#000000',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 0,
        opacity: 100,
        id: `ai-shape-${Date.now()}-${Math.random()}`,
      };
      newElements.push(shapeElement);
    }

    excalidrawAPI.updateScene({ elements: newElements });
  };

  const handleChange = (elements: any, appState: any) => {
    if (onStateChange) {
      onStateChange({ elements, appState });
    }

    // Sync with Yjs document
    if (ydocRef.current) {
      const yMap = ydocRef.current.getMap('whiteboard');
      yMap.set('elements', elements);
      yMap.set('appState', appState);
    }
  };

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border-2 border-gray-300 bg-white shadow-lg">
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
    </div>
  );
};
