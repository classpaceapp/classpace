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
import { Plus, ExternalLink, Trash2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Whiteboard {
  id: string;
  pod_id: string;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
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
      const { data, error } = await supabase
        .from('whiteboards')
        .insert({
          pod_id: podId,
          title: newWhiteboardTitle.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Whiteboard created!',
        description: 'Opening in a new tab...',
      });

      // Open whiteboard in new tab (Tldraw external provider)
      const roomId = `classpace-${data.id}`;
      window.open(`https://www.tldraw.com/r/${roomId}?embed=1`, '_blank');

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

  const deleteWhiteboard = async (whiteboardId: string) => {
    try {
      const { error } = await supabase
        .from('whiteboards')
        .delete()
        .eq('id', whiteboardId)
        .eq('created_by', user?.id);

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

  const openWhiteboard = (whiteboardId: string) => {
    const roomId = `classpace-${whiteboardId}`;
    window.open(`https://www.tldraw.com/r/${roomId}?embed=1`, '_blank');
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
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Collaborative Whiteboards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5">
      <CardHeader className="border-b border-primary/10">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Collaborative Whiteboards
            </CardTitle>
            <CardDescription className="mt-2">
              Interactive whiteboards for visual learning - real-time collaboration
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
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
                  className="group relative overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="relative pb-3">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
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
                        onClick={() => openWhiteboard(whiteboard.id)}
                        className="flex-1 bg-primary/90 hover:bg-primary shadow-md"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                      {(isTeacher || whiteboard.created_by === user?.id) && (
                        <Button
                          onClick={() => deleteWhiteboard(whiteboard.id)}
                          variant="outline"
                          size="sm"
                          className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
