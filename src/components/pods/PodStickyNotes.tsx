import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { StickyNote, Trash2, Plus } from 'lucide-react';

interface StickyNote {
  id: string;
  pod_id: string;
  user_id: string;
  title: string;
  content: string;
  color: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface PodStickyNotesProps {
  podId: string;
  isTeacher: boolean;
}

const colorOptions = [
  { name: 'yellow', class: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300' },
  { name: 'pink', class: 'bg-pink-100 dark:bg-pink-900/30 border-pink-300' },
  { name: 'blue', class: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300' },
  { name: 'green', class: 'bg-green-100 dark:bg-green-900/30 border-green-300' },
  { name: 'purple', class: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300' },
  { name: 'orange', class: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300' },
];

export const PodStickyNotes = ({ podId, isTeacher }: PodStickyNotesProps) => {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: 'yellow'
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data: notesData, error: notesError } = await supabase
        .from('pod_notes')
        .select('*')
        .eq('pod_id', podId)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Fetch profiles for each note
      const notesWithProfiles = await Promise.all(
        (notesData || []).map(async (note) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', note.user_id)
            .single();

          return {
            ...note,
            profiles: profile || undefined
          };
        })
      );

      setNotes(notesWithProfiles as StickyNote[]);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Failed to load notes',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [podId]);

  const handleCreate = async () => {
    if (!user?.id || !formData.title.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter a title for your note',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('pod_notes')
        .insert({
          pod_id: podId,
          user_id: user.id,
          title: formData.title.trim(),
          content: formData.content.trim(),
          color: formData.color,
          curriculum: '',
          topic: '',
          archived: false
        });

      if (error) throw error;

      toast({
        title: 'Note created',
        description: 'Your sticky note has been created successfully'
      });

      setFormData({ title: '', content: '', color: 'yellow' });
      setShowForm(false);
      fetchNotes();
    } catch (error: any) {
      console.error('Error creating note:', error);
      toast({
        title: 'Failed to create note',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string, noteUserId: string) => {
    // Teachers can delete any note, users can only delete their own
    if (!isTeacher && noteUserId !== user?.id) {
      toast({
        title: 'Permission denied',
        description: 'You can only delete your own notes',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('pod_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Note deleted',
        description: 'The sticky note has been removed'
      });

      fetchNotes();
    } catch (error: any) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Failed to delete note',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getColorClass = (color: string) => {
    const colorOption = colorOptions.find(c => c.name === color);
    return colorOption?.class || colorOptions[0].class;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-6 w-6 text-amber-500" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Sticky Notes & Reminders
          </h2>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-amber-300 shadow-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Create Sticky Note
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter note title..."
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content (Optional)</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Add details or reminders..."
                rows={4}
                maxLength={500}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setFormData({ ...formData, color: color.name })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${color.class} ${
                      formData.color === color.name ? 'ring-2 ring-offset-2 ring-amber-500 scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreate}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                Create Note
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <StickyNote className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No sticky notes yet
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              Create your first note to add reminders and quick thoughts
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={`${getColorClass(note.color)} border-2 shadow-lg hover:shadow-xl transition-all transform hover:-rotate-1`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-200 line-clamp-2">
                    {note.title}
                  </CardTitle>
                  {(isTeacher || note.user_id === user?.id) && (
                    <Button
                      onClick={() => handleDelete(note.id, note.user_id)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {note.content && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6 mb-3">
                    {note.content}
                  </p>
                )}
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p className="font-medium">
                    By: {note.profiles?.first_name} {note.profiles?.last_name}
                  </p>
                  <p>
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
