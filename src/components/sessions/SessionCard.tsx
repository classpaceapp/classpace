import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MessageSquare, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Session {
  id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'ended';
  messageCount?: number;
  participantCount?: number;
}

interface SessionCardProps {
  session: Session;
  onJoinSession: (sessionId: string) => void;
  onViewSession: (sessionId: string) => void;
  canJoin: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onJoinSession,
  onViewSession,
  canJoin
}) => {
  const isActive = session.status === 'active';
  const startTime = format(new Date(session.started_at), 'MMM d, h:mm a');
  const endTime = session.ended_at ? format(new Date(session.ended_at), 'h:mm a') : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {session.title || `Session ${startTime}`}
          </CardTitle>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? 'Live' : 'Ended'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{startTime}</span>
          </div>
          {endTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Ended {endTime}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {session.messageCount !== undefined && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{session.messageCount} messages</span>
            </div>
          )}
          {session.participantCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{session.participantCount} participants</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isActive && canJoin ? (
            <Button onClick={() => onJoinSession(session.id)} className="flex-1">
              Join Session
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => onViewSession(session.id)}
              className="flex-1"
            >
              View Session
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;