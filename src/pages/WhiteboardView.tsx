import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Canvas as FabricCanvas, Circle, Rect, PencilBrush, Path, IText } from 'fabric';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Pencil,
  Square,
  Circle as CircleIcon,
  Type,
  Eraser,
  Trash2,
  Download,
  Undo,
  Redo,
  Save,
  Users,
} from 'lucide-react';

const WhiteboardView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [whiteboard, setWhiteboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'rectangle' | 'circle' | 'text' | 'eraser'>('select');
  const [activeColor, setActiveColor] = useState('#000000');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchWhiteboard = async () => {
      if (!id || !user?.id) return;

      try {
        const { data, error } = await supabase
          .from('whiteboards')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setWhiteboard(data);

        // Initialize canvas after we have the data
        if (canvasRef.current) {
          const canvas = new FabricCanvas(canvasRef.current, {
            width: window.innerWidth,
            height: window.innerHeight - 80,
            backgroundColor: '#ffffff',
          });

          // Load existing whiteboard data if any
          if (data.whiteboard_data && typeof data.whiteboard_data === 'object' && Object.keys(data.whiteboard_data).length > 0) {
            canvas.loadFromJSON(data.whiteboard_data as any, () => {
              canvas.renderAll();
            });
          }

          setFabricCanvas(canvas);
        }
      } catch (error: any) {
        console.error('Error fetching whiteboard:', error);
        toast({
          title: 'Failed to load whiteboard',
          description: error.message,
          variant: 'destructive',
        });
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchWhiteboard();
  }, [id, user?.id, navigate, toast]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'draw' || activeTool === 'eraser';

    if (activeTool === 'draw' && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 3;
    } else if (activeTool === 'eraser' && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = '#ffffff';
      fabricCanvas.freeDrawingBrush.width = 20;
    }
  }, [activeTool, activeColor, fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas || !id) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`whiteboard-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whiteboards',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          // Only update if the change came from another user
          if (payload.new.whiteboard_data) {
            fabricCanvas.loadFromJSON(payload.new.whiteboard_data, () => {
              fabricCanvas.renderAll();
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fabricCanvas, id]);

  const handleToolClick = (tool: typeof activeTool) => {
    if (!fabricCanvas) return;

    setActiveTool(tool);

    if (tool === 'rectangle') {
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
    } else if (tool === 'circle') {
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
    } else if (tool === 'text') {
      const text = new IText('Click to edit', {
        left: 100,
        top: 100,
        fill: activeColor,
        fontSize: 24,
        fontFamily: 'Arial',
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    toast({ title: 'Canvas cleared!' });
  };

  const handleSave = async () => {
    if (!fabricCanvas || !id) return;

    setSaving(true);
    try {
      const json = fabricCanvas.toJSON();

      const { error } = await supabase
        .from('whiteboards')
        .update({ whiteboard_data: json })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Whiteboard saved!',
        description: 'Your changes have been saved',
      });
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

  const handleDownload = () => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      multiplier: 2,
      format: 'png',
      quality: 1,
    });

    const link = document.createElement('a');
    link.download = `${whiteboard?.title || 'whiteboard'}.png`;
    link.href = dataURL;
    link.click();

    toast({ title: 'Whiteboard downloaded!' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Toolbar */}
      <div className="bg-card border-b border-primary/10 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground">{whiteboard?.title}</h1>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>Real-time collaboration</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Drawing tools */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
            <Button
              size="sm"
              variant={activeTool === 'select' ? 'default' : 'ghost'}
              onClick={() => setActiveTool('select')}
              className="h-9 w-9 p-0"
            >
              <span className="text-lg">👆</span>
            </Button>
            <Button
              size="sm"
              variant={activeTool === 'draw' ? 'default' : 'ghost'}
              onClick={() => handleToolClick('draw')}
              className="h-9 w-9 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
              onClick={() => handleToolClick('rectangle')}
              className="h-9 w-9 p-0"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeTool === 'circle' ? 'default' : 'ghost'}
              onClick={() => handleToolClick('circle')}
              className="h-9 w-9 p-0"
            >
              <CircleIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeTool === 'text' ? 'default' : 'ghost'}
              onClick={() => handleToolClick('text')}
              className="h-9 w-9 p-0"
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeTool === 'eraser' ? 'default' : 'ghost'}
              onClick={() => setActiveTool('eraser')}
              className="h-9 w-9 p-0"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          {/* Color picker */}
          <input
            type="color"
            value={activeColor}
            onChange={(e) => setActiveColor(e.target.value)}
            className="h-9 w-12 rounded border border-primary/20 cursor-pointer"
          />

          {/* Actions */}
          <div className="flex items-center gap-1 ml-2">
            <Button size="sm" variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-background to-secondary/5">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default WhiteboardView;
