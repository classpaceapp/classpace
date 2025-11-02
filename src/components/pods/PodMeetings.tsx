import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Plus, Pin, Trash2, ExternalLink, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import LiveMeeting from './LiveMeeting';

interface Meeting {
  id: string;
  pod_id: string;
  created_by: string;
  title: string;
  meeting_link: string;
  is_pinned: boolean;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export const PodMeetings: React.FC<{ podId: string }> = ({ podId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', meeting_link: '' });
  const [liveMeeting, setLiveMeeting] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState<any>(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('pod_id', podId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      const meetingsWithProfiles = await Promise.all(
        (data || []).map(async (meeting) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', meeting.created_by)
            .single();
          return { ...meeting, profiles: profile || undefined };
        })
      );
      
      setMeetings(meetingsWithProfiles);
    } catch (error: any) {
      toast({ title: 'Failed to load meetings', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async () => {
    if (!user?.id || !newMeeting.title || !newMeeting.meeting_link) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    try {
      setCreating(true);
      const { error } = await supabase
        .from('meetings')
        .insert({
          pod_id: podId,
          created_by: user.id,
          title: newMeeting.title,
          meeting_link: newMeeting.meeting_link,
          is_pinned: false,
        });

      if (error) throw error;

      toast({ title: 'Meeting created successfully!' });
      setNewMeeting({ title: '', meeting_link: '' });
      setDialogOpen(false);
      fetchMeetings();
    } catch (error: any) {
      toast({ title: 'Failed to create meeting', description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const togglePin = async (meetingId: string, currentPinned: boolean) => {
    try {
      // If pinning, unpin all others first
      if (!currentPinned) {
        await supabase
          .from('meetings')
          .update({ is_pinned: false })
          .eq('pod_id', podId);
      }

      const { error } = await supabase
        .from('meetings')
        .update({ is_pinned: !currentPinned })
        .eq('id', meetingId);

      if (error) throw error;
      toast({ title: currentPinned ? 'Meeting unpinned' : 'Meeting pinned to top' });
      fetchMeetings();
    } catch (error: any) {
      toast({ title: 'Failed to update meeting', description: error.message, variant: 'destructive' });
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;
      toast({ title: 'Meeting deleted' });
      fetchMeetings();
    } catch (error: any) {
      toast({ title: 'Failed to delete meeting', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchMeetings();
    checkActiveMeeting();

    // Subscribe to live_meetings changes
    const channel = supabase
      .channel('live-meetings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_meetings',
          filter: `pod_id=eq.${podId}`,
        },
        () => {
          checkActiveMeeting();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [podId]);

  const checkActiveMeeting = async () => {
    try {
      // Check database for active meeting
      const { data: meeting } = await supabase
        .from('live_meetings')
        .select('*')
        .eq('pod_id', podId)
        .is('ended_at', null)
        .single();

      setActiveMeeting(meeting || null);
    } catch (error) {
      setActiveMeeting(null);
    }
  };

  const startLiveMeeting = () => {
    setLiveMeeting(true);
  };

  if (liveMeeting) {
    return <LiveMeeting podId={podId} onClose={() => setLiveMeeting(false)} />;
  }

  if (loading) {
    return (
      <Card className="border-2 border-purple-500/30 shadow-2xl bg-gradient-to-br from-purple-100/90 via-pink-100/90 to-fuchsia-100/90 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-fuchsia-900/40 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Meeting Section */}
      <Card className="border-2 border-purple-500/30 shadow-2xl bg-gradient-to-br from-purple-100/90 via-pink-100/90 to-fuchsia-100/90 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-fuchsia-900/40 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 border-b-2 border-purple-400/50 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-white/30">
              <Users className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Live Meeting Room</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {activeMeeting ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30">
                <div className="relative">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  <div className="absolute inset-0 h-3 w-3 bg-green-500 rounded-full animate-ping" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Meeting in Progress</p>
                  <p className="text-sm text-muted-foreground">Other participants are in the meeting</p>
                </div>
                <Button
                  onClick={startLiveMeeting}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Meeting
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Video className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">No active meeting</p>
                <p className="text-sm text-muted-foreground mb-4">Start a live video call with your pod members</p>
                <Button
                  onClick={startLiveMeeting}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30"
                >
                  <Video className="h-5 w-5 mr-2" />
                  Start Live Meeting
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Meeting Links
          </h2>
          <p className="text-muted-foreground">Save and pin recurring meeting links</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700">
              <Plus className="h-4 w-4" />
              Add Meeting Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-2 border-teal-500/30">
            <DialogHeader>
              <DialogTitle className="text-2xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Add New Meeting Link
              </DialogTitle>
              <DialogDescription>
                Create a reusable meeting link for your pod
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Weekly Math Class"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="border-teal-500/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Google Meet Link</Label>
                <Input
                  id="link"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={newMeeting.meeting_link}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meeting_link: e.target.value })}
                  className="border-teal-500/30"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createMeeting} 
                disabled={creating}
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
              >
                {creating ? 'Creating...' : 'Create Meeting'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 md:gap-4">
        {meetings.length === 0 ? (
          <Card className="border-2 border-dashed border-teal-500/30 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/10 dark:to-cyan-950/10">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="h-12 w-12 text-teal-500 mb-4" />
              <p className="text-muted-foreground">No meeting links yet</p>
              <p className="text-sm text-muted-foreground">Click "Add Meeting Link" to create one</p>
            </CardContent>
          </Card>
        ) : (
          meetings.map((meeting) => (
            <Card 
              key={meeting.id} 
              className={`border-2 transition-all duration-300 hover:shadow-lg ${
                meeting.is_pinned 
                  ? 'border-teal-500 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 shadow-teal-500/20' 
                  : 'border-teal-500/20 bg-gradient-to-br from-teal-50/30 to-cyan-50/30 dark:from-teal-950/10 dark:to-cyan-950/10'
              }`}
            >
              <CardHeader className="pb-2 md:pb-3">
                <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-3 md:gap-0">
                  <div className="flex items-center gap-2 md:gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${meeting.is_pinned ? 'bg-teal-500' : 'bg-teal-500/70'}`}>
                      <Video className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{meeting.title}</CardTitle>
                        {meeting.is_pinned && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-500 text-white">
                            PINNED
                          </span>
                        )}
                      </div>
                      {meeting.profiles && (
                        <CardDescription className="text-sm">
                          Created by {meeting.profiles.first_name} {meeting.profiles.last_name}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePin(meeting.id, meeting.is_pinned)}
                      className={meeting.is_pinned ? 'border-teal-500 text-teal-600' : ''}
                    >
                      <Pin className={`h-4 w-4 ${meeting.is_pinned ? 'fill-current' : ''}`} />
                    </Button>
                    {user?.id === meeting.created_by && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMeeting(meeting.id)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 md:pt-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
                  <code className="flex-1 px-2 md:px-3 py-2 bg-white dark:bg-gray-800 rounded text-xs md:text-sm font-mono border border-teal-500/30 truncate">
                    {meeting.meeting_link}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => window.open(meeting.meeting_link, '_blank')}
                    className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shrink-0 h-10 md:h-9 w-full md:w-auto"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Join</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PodMeetings;