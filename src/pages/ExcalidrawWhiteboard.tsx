import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas as FabricCanvas, Circle, Rect, IText } from 'fabric';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Pencil, Square, Circle as CircleIcon, Type, Eraser, Trash2, Save, MousePointer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Tool = 'select' | 'draw' | 'rectangle' | 'circle' | 'text' | 'eraser';

export default function CollaborativeWhiteboard() {
  const { whiteboardId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [whiteboard, setWhiteboard] = useState<any>(null);
  const [participants, setParticipants] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<Tool>('draw');
  const [activeColor, setActiveColor] = useState('#000000');
  const [saving, setSaving] = useState(false);

  // Debounce timer for auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!whiteboardId) return;

    const fetchWhiteboard = async () => {
      const { data, error } = await supabase
        .from('whiteboards')
        .select('*')
        .eq('id', whiteboardId)
        .single();

      if (error) {
        console.error('Error fetching whiteboard:', error);
        toast({
          title: 'Error loading whiteboard',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setWhiteboard(data);

      // Initialize Fabric canvas
      if (canvasRef.current) {
        const canvas = new FabricCanvas(canvasRef.current, {
          width: window.innerWidth,
          height: window.innerHeight - 80,
          backgroundColor: '#1e1b4b',
          isDrawingMode: true,
        });

        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = '#ffffff';
          canvas.freeDrawingBrush.width = 3;
        }

        // Load existing data
        const wbData = data.whiteboard_data as any;
        if (wbData?.fabricJson) {
          try {
            canvas.loadFromJSON(wbData.fabricJson, () => {
              canvas.renderAll();
            });
          } catch (e) {
            console.error('Error loading whiteboard data:', e);
          }
        }

        setFabricCanvas(canvas);
      }
    };

    fetchWhiteboard();

    // Set up presence tracking
    const channel = supabase.channel(`whiteboard:${whiteboardId}`, {
      config: {
        presence: { key: user?.id },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setParticipants(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user?.id,
            userName: user?.user_metadata?.first_name || 'User',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [whiteboardId, user?.id]);

  // Handle resize
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleResize = () => {
      fabricCanvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 80,
      });
      fabricCanvas.renderAll();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fabricCanvas]);

  // Update tool mode
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'draw' || activeTool === 'eraser';
    fabricCanvas.selection = activeTool === 'select';

    if (fabricCanvas.freeDrawingBrush) {
      if (activeTool === 'draw') {
        fabricCanvas.freeDrawingBrush.color = activeColor;
        fabricCanvas.freeDrawingBrush.width = 3;
      } else if (activeTool === 'eraser') {
        fabricCanvas.freeDrawingBrush.color = '#1e1b4b'; // Match background
        fabricCanvas.freeDrawingBrush.width = 20;
      }
    }
  }, [activeTool, activeColor, fabricCanvas]);

  // Auto-save on changes
  useEffect(() => {
    if (!fabricCanvas || !whiteboardId) return;

    const handleChange = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await supabase
            .from('whiteboards')
            .update({
              whiteboard_data: { fabricJson: fabricCanvas.toJSON() },
              updated_at: new Date().toISOString(),
            })
            .eq('id', whiteboardId);
        } catch (error) {
          console.error('Error auto-saving:', error);
        }
      }, 2000);
    };

    fabricCanvas.on('object:added', handleChange);
    fabricCanvas.on('object:modified', handleChange);
    fabricCanvas.on('object:removed', handleChange);

    return () => {
      fabricCanvas.off('object:added', handleChange);
      fabricCanvas.off('object:modified', handleChange);
      fabricCanvas.off('object:removed', handleChange);
    };
  }, [fabricCanvas, whiteboardId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      fabricCanvas?.dispose();
    };
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

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#1e1b4b';
    fabricCanvas.renderAll();
  };

  const handleSave = async () => {
    if (!fabricCanvas || !whiteboardId) return;

    setSaving(true);
    try {
      await supabase
        .from('whiteboards')
        .update({
          whiteboard_data: { fabricJson: fabricCanvas.toJSON() },
          updated_at: new Date().toISOString(),
        })
        .eq('id', whiteboardId);

      toast({ title: 'Whiteboard saved!' });
    } catch (error: any) {
      toast({
        title: 'Failed to save',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!whiteboard) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-white/10 p-2 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-sm md:text-xl font-bold text-white truncate max-w-[150px] md:max-w-none">
              {whiteboard.title}
            </h1>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
          <Button
            size="sm"
            variant={activeTool === 'select' ? 'default' : 'ghost'}
            onClick={() => {
              setActiveTool('select');
              if (fabricCanvas) fabricCanvas.isDrawingMode = false;
            }}
            className={cn("h-8 w-8 p-0", activeTool === 'select' ? "bg-white text-slate-900" : "text-white hover:bg-white/20")}
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === 'draw' ? 'default' : 'ghost'}
            onClick={() => handleToolClick('draw')}
            className={cn("h-8 w-8 p-0", activeTool === 'draw' ? "bg-white text-slate-900" : "text-white hover:bg-white/20")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
            onClick={() => handleToolClick('rectangle')}
            className={cn("h-8 w-8 p-0", activeTool === 'rectangle' ? "bg-white text-slate-900" : "text-white hover:bg-white/20")}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === 'circle' ? 'default' : 'ghost'}
            onClick={() => handleToolClick('circle')}
            className={cn("h-8 w-8 p-0", activeTool === 'circle' ? "bg-white text-slate-900" : "text-white hover:bg-white/20")}
          >
            <CircleIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === 'text' ? 'default' : 'ghost'}
            onClick={() => handleToolClick('text')}
            className={cn("h-8 w-8 p-0", activeTool === 'text' ? "bg-white text-slate-900" : "text-white hover:bg-white/20")}
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === 'eraser' ? 'default' : 'ghost'}
            onClick={() => handleToolClick('eraser')}
            className={cn("h-8 w-8 p-0", activeTool === 'eraser' ? "bg-white text-slate-900" : "text-white hover:bg-white/20")}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        {/* Color & Actions */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={activeColor}
            onChange={(e) => setActiveColor(e.target.value)}
            className="h-8 w-10 rounded border border-white/20 cursor-pointer bg-transparent"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="text-white hover:bg-white/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-slate-900 hover:bg-white/90"
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-full">
            <Users className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">{participants}</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
}
