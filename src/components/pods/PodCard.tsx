import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Pod {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  created_at: string;
  updated_at: string;
  student_count?: number;
  last_activity?: string;
}

interface PodCardProps {
  pod: Pod;
  userRole: 'teacher' | 'learner';
  basePath: string;
}

const PodCard: React.FC<PodCardProps> = ({ pod, userRole, basePath }) => {
  const truncatedDescription = pod.description && pod.description.length > 120 
    ? `${pod.description.substring(0, 120)}...` 
    : pod.description;

  const lastActivityDate = pod.last_activity || pod.updated_at;
  const timeAgo = formatDistanceToNow(new Date(lastActivityDate), { addSuffix: true });

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">
              {pod.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {pod.subject && (
                <Badge variant="secondary" className="text-xs">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {pod.subject}
                </Badge>
              )}
              {pod.grade_level && (
                <Badge variant="outline" className="text-xs">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  {pod.grade_level}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {truncatedDescription && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {truncatedDescription}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{pod.student_count || 0} student{(pod.student_count || 0) !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Updated {timeAgo}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Link to={`${basePath}/pods/${pod.id}`} className="w-full">
          <Button 
            className="w-full group-hover:bg-primary/90 transition-colors"
            size="sm"
          >
            {userRole === 'teacher' ? 'Manage Pod' : 'Enter Pod'}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default PodCard;