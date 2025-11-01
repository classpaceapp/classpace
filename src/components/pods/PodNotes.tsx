import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2, StickyNote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  pod_id: string;
  created_by: string;
  title: string;
  content: string;
  color: string;
  created_at: string;
  author_name?: string;
  is_teacher?: boolean;
}

interface PodNotesProps {
  podId: string;
  isTeacher: boolean;
}

const noteColors = [
  { name: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
  { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
  { name: 'green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
  { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900' },
  { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
];

export const PodNotes: React.FC<PodNotesProps> = ({ podId, isTeacher }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', color: 'yellow' });
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('pod_notes')
        .select('*')
        .eq('pod_id', podId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch pod teacher ID
      const { data: podData } = await supabase
        .from('pods')
        .select('teacher_id')
        .eq('id', podId)
        .single();

      // Fetch author profiles
      const notesData = data || [];
      const authorIds = [...new Set(notesData.map(n => n.created_by))];
      
      let profilesMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
      if (authorIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', authorIds);
        
        if (profiles) {
          profilesMap = Object.fromEntries(
            profiles.map((p: any) => [p.id, { first_name: p.first_name, last_name: p.last_name }])
          );
        }
      }

      const notesWithAuthors = notesData.map(note => {
        const profile = profilesMap[note.created_by];
        return {
          ...note,
          author_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
          is_teacher: podData?.teacher_id === note.created_by
        };
      });

      setNotes(notesWithAuthors);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Failed to load notes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim() || !user?.id) return;

    try {
      const { error } = await supabase.from('pod_notes').insert({
        pod_id: podId,
        created_by: user.id,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        color: newNote.color,
      });

      if (error) throw error;

      toast({ title: 'Note created successfully!' });
      setNewNote({ title: '', content: '', color: 'yellow' });
      setIsDialogOpen(false);
      fetchNotes();
    } catch (error: any) {
      toast({
        title: 'Failed to create note',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from('pod_notes').delete().eq('id', noteId);

      if (error) throw error;

      toast({ title: 'Note deleted successfully!' });
      setNotes(notes.filter((n) => n.id !== noteId));
      setNoteToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Failed to delete note',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [podId]);

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const getColorClasses = (colorName: string) => {
    return noteColors.find((c) => c.name === colorName) || noteColors[0];
  };

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Class Notes
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    Add Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Note</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title</label>
                      <Input
                        value={newNote.title}
                        onChange={(e) =>
                          setNewNote({ ...newNote, title: e.target.value })
                        }
                        placeholder="Note title..."
                        className="border-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Content</label>
                      <Textarea
                        value={newNote.content}
                        onChange={(e) =>
                          setNewNote({ ...newNote, content: e.target.value })
                        }
                        placeholder="Write your note here..."
                        rows={5}
                        className="border-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Color</label>
                      <div className="flex gap-2">
                        {noteColors.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setNewNote({ ...newNote, color: color.name })}
                            className={`w-10 h-10 rounded-lg ${color.bg} ${color.border} border-2 ${
                              newNote.color === color.name ? 'ring-2 ring-primary ring-offset-2' : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createNote}
                      disabled={!newNote.title.trim() || !newNote.content.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Create Note
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {notes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No notes yet. Create your first note!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => {
                const colorClasses = getColorClasses(note.color);
                return (
                  <div
                    key={note.id}
                    className={`${colorClasses.bg} ${colorClasses.border} ${colorClasses.text} border-2 rounded-lg p-4 shadow-lg transform hover:scale-105 transition-transform duration-200 relative`}
                    style={{
                      transform: `rotate(${Math.random() * 4 - 2}deg)`,
                    }}
                  >
                    {/* Author badge at the top */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-current/20">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {note.author_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs">{note.author_name}</span>
                          {note.is_teacher && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                              TEACHER
                            </span>
                          )}
                        </div>
                      </div>
                      {(isTeacher || note.created_by === user?.id) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 hover:bg-black/10"
                          onClick={() => setNoteToDelete(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{note.title}</h3>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => noteToDelete && deleteNote(noteToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
