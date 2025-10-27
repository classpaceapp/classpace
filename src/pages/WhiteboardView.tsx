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
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          throw new Error('Whiteboard not found or access denied');
        }

        setWhiteboard(data);

        // Initialize canvas after we have the data
        if (canvasRef.current) {
          const canvas = new FabricCanvas(canvasRef.current, {
            width: window.innerWidth,
            height: window.innerHeight - 80,
            backgroundColor: '#ffffff',
          });

          // Initialize free drawing brush for Fabric v6 and default modes
          if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = activeColor;
            canvas.freeDrawingBrush.width = 3;
          }
          canvas.isDrawingMode = false;
          canvas.selection = true;

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
    fabricCanvas.selection = activeTool === 'select';

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

  // Cleanup Fabric canvas on unmount
  useEffect(() => {
    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
  }, [fabricCanvas]);

  const handleToolClick = (tool: typeof activeTool) => {
    if (!fabricCanvas) return;

    setActiveTool(tool);
    
    // Toggle modes
    fabricCanvas.isDrawingMode = tool === 'draw' || tool === 'eraser';
    fabricCanvas.selection = tool === 'select';

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
      fabricCanvas.renderAll();
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
      fabricCanvas.renderAll();
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
      fabricCanvas.renderAll();
    } else if (tool === 'eraser') {
      fabricCanvas.isDrawingMode = true;
      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = '#ffffff';
        fabricCanvas.freeDrawingBrush.width = 20;
      }
    } else if (tool === 'draw') {
      fabricCanvas.isDrawingMode = true;
      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = activeColor;
        fabricCanvas.freeDrawingBrush.width = 3;
      }
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
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Toolbar - Fixed positioning with higher z-index */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 shadow-2xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">{whiteboard?.title}</h1>
          <div className="flex items-center gap-2 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium">Real-time collaboration</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Drawing tools */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-1.5">
            <Button
              size="sm"
              variant={activeTool === 'select' ? 'default' : 'ghost'}
              onClick={() => {
                setActiveTool('select');
                if (fabricCanvas) fabricCanvas.isDrawingMode = false;
              }}
              className={`h-10 w-10 p-0 ${activeTool === 'select' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'}`}
              title="Select"
            >
              <span className="text-lg">👆</span>
            </Button>
            <Button
              size="sm"
              variant={activeTool === 'draw' ? 'default' : 'ghost'}
              onClick={() => handleToolClick('draw')}
              className={`h-10 w-10 p-0 ${activeTool === 'draw' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'}`}
              title="Draw"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
              onClick={() => handleToolClick('rectangle')}
              className={`h-10 w-10 p-0 ${activeTool === 'rectangle' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'}`}
              title="Rectangle"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeTool === 'circle' ? 'default' : 'ghost'}
              onClick={() => handleToolClick('circle')}
              className={`h-10 w-10 p-0 ${activeTool === 'circle' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'}`}
              title="Circle"
            >
              <CircleIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeTool === 'text' ? 'default' : 'ghost'}
              onClick={() => handleToolClick('text')}
              className={`h-10 w-10 p-0 ${activeTool === 'text' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'}`}
              title="Text"
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeTool === 'eraser' ? 'default' : 'ghost'}
              onClick={() => {
                setActiveTool('eraser');
                handleToolClick('eraser');
              }}
              className={`h-10 w-10 p-0 ${activeTool === 'eraser' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'}`}
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
            className="h-10 w-14 rounded-lg border-2 border-white/30 cursor-pointer bg-white/10 backdrop-blur-sm"
            title="Pick color"
          />

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleClear}
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDownload}
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={saving}
              className="bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

export default WhiteboardView;
