import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, PhoneOff, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LiveMeetingProps {
  podId: string;
  onClose: () => void;
}

interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
}

export default function LiveMeeting({ podId, onClose }: LiveMeetingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initializeMedia();
    setupRealtimeChannel();
    createLiveMeetingRecord();

    return () => {
      cleanup();
      endLiveMeetingIfLast();
    };
  }, []);

  const createLiveMeetingRecord = async () => {
    try {
      // Check if there's already an active meeting
      const { data: existing } = await supabase
        .from('live_meetings')
        .select('*')
        .eq('pod_id', podId)
        .is('ended_at', null)
        .single();

      if (existing) {
        // Meeting already exists, just join
        return;
      }

      // Create new meeting record
      await supabase.from('live_meetings').insert({
        pod_id: podId,
        started_by: user?.id,
      });
    } catch (error) {
      console.error('Error creating meeting record:', error);
    }
  };

  const endLiveMeetingIfLast = async () => {
    // Check if we're the last one in the presence channel
    const channel = channelRef.current;
    if (!channel) return;

    const state = channel.presenceState();
    const participantCount = Object.keys(state).length;

    // If we're the last one (or only one), end the meeting
    if (participantCount <= 1) {
      try {
        const { data: meeting } = await supabase
          .from('live_meetings')
          .select('*')
          .eq('pod_id', podId)
          .is('ended_at', null)
          .single();

        if (meeting) {
          await supabase
            .from('live_meetings')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', meeting.id);
        }
      } catch (error) {
        console.error('Error ending meeting:', error);
      }
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: 'Camera/Microphone Error',
        description: 'Could not access camera or microphone',
        variant: 'destructive',
      });
    }
  };

  const setupRealtimeChannel = () => {
    const channel = supabase.channel(`meeting:${podId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: user?.id },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const currentParticipants: Participant[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          presences.forEach((presence: any) => {
            if (presence.userId !== user?.id) {
              currentParticipants.push({
                id: presence.userId,
                name: presence.userName,
              });
            }
          });
        });
        
        setParticipants(currentParticipants);
      })
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.to === user?.id) {
          await handleOffer(payload);
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.to === user?.id) {
          await handleAnswer(payload);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.to === user?.id) {
          await handleIceCandidate(payload);
        }
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

    channelRef.current = channel;
  };

  const createPeerConnection = (participantId: string): RTCPeerConnection => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      const videoElement = remoteVideosRef.current.get(participantId);
      if (videoElement) {
        videoElement.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            from: user?.id,
            to: participantId,
            candidate: event.candidate,
          },
        });
      }
    };

    peerConnections.set(participantId, pc);
    setPeerConnections(new Map(peerConnections));

    return pc;
  };

  const handleOffer = async (payload: any) => {
    const pc = createPeerConnection(payload.from);
    
    await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    channelRef.current?.send({
      type: 'broadcast',
      event: 'answer',
      payload: {
        from: user?.id,
        to: payload.from,
        answer,
      },
    });
  };

  const handleAnswer = async (payload: any) => {
    const pc = peerConnections.get(payload.from);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
    }
  };

  const handleIceCandidate = async (payload: any) => {
    const pc = peerConnections.get(payload.from);
    if (pc && payload.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor',
          },
        });

        const screenTrack = screenStream.getVideoTracks()[0];

        // Display screen in separate video element
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
          // Force video to play
          await screenVideoRef.current.play();
        }

        // Send screen track to all peers as an additional track
        peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
        toast({
          title: 'Screen Share Error',
          description: 'Could not share screen',
          variant: 'destructive',
        });
      }
    } else {
      // Stop screen sharing
      if (screenVideoRef.current && screenVideoRef.current.srcObject) {
        const tracks = (screenVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        screenVideoRef.current.srcObject = null;
      }

      // Restore camera track in all peer connections
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }

      setScreenSharing(false);
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (screenVideoRef.current && screenVideoRef.current.srcObject) {
      const tracks = (screenVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }

    peerConnections.forEach((pc) => pc.close());
    channelRef.current?.unsubscribe();
  };

  const leaveMeeting = () => {
    cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Live Meeting</h2>
              <p className="text-sm text-white/60">{participants.length + 1} participants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Local Video */}
          <Card className="relative overflow-hidden border-2 border-purple-500/30 bg-slate-900/50 backdrop-blur-xl">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-slate-800">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-gradient-to-r from-purple-500/90 to-pink-500/90 rounded-full">
                  <span className="text-sm font-medium text-white">You {screenSharing && '(Screen)'}</span>
                </div>
                {!videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                    <VideoOff className="h-12 w-12 text-white/40" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Screen Share Video (when active) */}
          {screenSharing && (
            <Card className="relative overflow-hidden border-2 border-green-500/50 bg-slate-900/50 backdrop-blur-xl">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-slate-800">
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-gradient-to-r from-green-500/90 to-emerald-500/90 rounded-full">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Your Screen
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remote Videos */}
          {participants.map((participant) => (
            <Card
              key={participant.id}
              className="relative overflow-hidden border-2 border-purple-500/20 bg-slate-900/50 backdrop-blur-xl"
            >
              <CardContent className="p-0">
                <div className="relative aspect-video bg-slate-800">
                  <video
                    ref={(el) => {
                      if (el) remoteVideosRef.current.set(participant.id, el);
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-slate-800/90 rounded-full">
                    <span className="text-sm font-medium text-white">{participant.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-6">
        <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto">
          <Button
            onClick={toggleVideo}
            size="lg"
            variant={videoEnabled ? 'outline' : 'destructive'}
            className={`rounded-full h-14 w-14 p-0 ${
              videoEnabled
                ? 'border-white/20 hover:bg-white/10'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {videoEnabled ? (
              <Video className="h-6 w-6" />
            ) : (
              <VideoOff className="h-6 w-6" />
            )}
          </Button>

          <Button
            onClick={toggleAudio}
            size="lg"
            variant={audioEnabled ? 'outline' : 'destructive'}
            className={`rounded-full h-14 w-14 p-0 ${
              audioEnabled
                ? 'border-white/20 hover:bg-white/10'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {audioEnabled ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </Button>

          <Button
            onClick={toggleScreenShare}
            size="lg"
            variant="outline"
            className={`rounded-full h-14 w-14 p-0 border-white/20 hover:bg-white/10 ${
              screenSharing ? 'bg-purple-500/20 border-purple-500/50' : ''
            }`}
          >
            {screenSharing ? (
              <MonitorOff className="h-6 w-6" />
            ) : (
              <Monitor className="h-6 w-6" />
            )}
          </Button>

          <Button
            onClick={leaveMeeting}
            size="lg"
            className="rounded-full h-14 px-8 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
          >
            <PhoneOff className="h-6 w-6 mr-2" />
            Leave Meeting
          </Button>
        </div>
      </div>
    </div>
  );
}
