import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Plus, ExternalLink, Trash2, Calendar, Palette } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Whiteboard {
  id: string;
  pod_id: string;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  whiteboard_data?: any;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface WhiteboardTabProps {
  podId: string;
  isTeacher: boolean;
}

export const WhiteboardTab: React.FC<WhiteboardTabProps> = ({ podId, isTeacher }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWhiteboardTitle, setNewWhiteboardTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchWhiteboards = async () => {
    try {
      const { data, error } = await supabase
        .from('whiteboards')
        .select(`
          *,
          profiles!whiteboards_created_by_fkey(first_name, last_name)
        `)
        .eq('pod_id', podId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWhiteboards(data || []);
    } catch (error: any) {
      console.error('Error fetching whiteboards:', error);
      toast({
        title: 'Failed to load whiteboards',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createWhiteboard = async () => {
    if (!newWhiteboardTitle.trim() || !user?.id) return;

    setCreating(true);
    try {
      // Generate a unique room ID and encryption key for Excalidraw.com
      const roomId = crypto.randomUUID();
      const encryptionKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Create the Excalidraw.com collaboration URL
      const excalidrawUrl = `https://excalidraw.com/#room=${roomId},${encryptionKey}`;
      
      // Store only the URL link in the database
      const { data, error } = await supabase
        .from('whiteboards')
        .insert({
          pod_id: podId,
          title: newWhiteboardTitle.trim(),
          created_by: user.id,
          whiteboard_data: { url: excalidrawUrl }
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Whiteboard created!',
        description: 'Opening Excalidraw in a new tab...',
      });

      // Open Excalidraw.com with the collaboration room
      window.open(excalidrawUrl, '_blank');

      setNewWhiteboardTitle('');
      setCreateDialogOpen(false);
      fetchWhiteboards();
    } catch (error: any) {
      toast({
        title: 'Failed to create whiteboard',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteWhiteboard = async (whiteboardId: string, createdBy: string) => {
    // Check authorization: both teachers and students can delete whiteboards
    if (!isTeacher && createdBy !== user?.id) {
      toast({
        title: 'Permission denied',
        description: 'You can only delete whiteboards you created',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('whiteboards')
        .delete()
        .eq('id', whiteboardId);

      if (error) throw error;

      toast({
        title: 'Whiteboard deleted',
      });

      fetchWhiteboards();
    } catch (error: any) {
      toast({
        title: 'Failed to delete whiteboard',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openWhiteboard = (whiteboard: Whiteboard) => {
    // Open the stored Excalidraw.com URL
    const url = whiteboard.whiteboard_data?.url;
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: 'Invalid whiteboard',
        description: 'This whiteboard link is missing or corrupted',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchWhiteboards();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('whiteboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whiteboards',
          filter: `pod_id=eq.${podId}`,
        },
        () => {
          fetchWhiteboards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [podId]);

  if (loading) {
    return (
      <Card className="border-2 border-pink-500/30 shadow-2xl bg-gradient-to-br from-pink-100/90 via-rose-100/90 to-purple-100/90 dark:from-pink-900/40 dark:via-rose-900/40 dark:to-purple-900/40 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 border-b-2 border-pink-400/50 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-white/30">
              <Palette className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Collaborative Whiteboards</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-pink-500/30 shadow-2xl bg-gradient-to-br from-pink-100/90 via-rose-100/90 to-purple-100/90 dark:from-pink-900/40 dark:via-rose-900/40 dark:to-purple-900/40 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 border-b-2 border-pink-400/50 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-white/30">
              <Palette className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                Collaborative Whiteboards
              </CardTitle>
              <CardDescription className="mt-2 text-white/90 font-medium">
                Create collaborative whiteboards powered by Excalidraw - opens in a new tab
              </CardDescription>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white/30 hover:border-white/60 font-semibold shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                New Whiteboard
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Whiteboard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Whiteboard Title</Label>
                  <Input
                    id="title"
                    value={newWhiteboardTitle}
                    onChange={(e) => setNewWhiteboardTitle(e.target.value)}
                    placeholder="e.g., Math Problem Solving Session"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !creating) {
                        createWhiteboard();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={createWhiteboard}
                  disabled={creating || !newWhiteboardTitle.trim()}
                  className="w-full"
                >
                  {creating ? 'Creating...' : 'Create & Open'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {whiteboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No whiteboards yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first collaborative whiteboard to start visual learning
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {whiteboards.map((whiteboard) => (
                <Card
                  key={whiteboard.id}
                  className="group relative overflow-hidden border-2 border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/20 bg-gradient-to-br from-white to-pink-50/50 dark:from-card dark:to-pink-950/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="relative pb-3 bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-950/30 dark:to-rose-950/30">
                    <CardTitle className="text-lg line-clamp-2 font-bold bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent group-hover:from-pink-700 group-hover:to-rose-700 transition-all">
                      {whiteboard.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Created {formatDistanceToNow(new Date(whiteboard.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {whiteboard.profiles && (
                      <p className="text-xs text-muted-foreground mt-1">
                        by {whiteboard.profiles.first_name} {whiteboard.profiles.last_name}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="relative pt-0">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openWhiteboard(whiteboard)}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg font-semibold"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                      <Button
                        onClick={() => deleteWhiteboard(whiteboard.id, whiteboard.created_by)}
                        variant="outline"
                        size="sm"
                        className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
