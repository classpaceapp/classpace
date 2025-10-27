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
  title: string;
  description: string | null;
  subject: string;
  teacher_id: string;
  pod_code: string;
  created_at: string;
  updated_at: string;
  student_count?: number;
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

  const lastActivityDate = pod.updated_at;
  const timeAgo = formatDistanceToNow(new Date(lastActivityDate), { addSuffix: true });

  // Generate vibrant gradient colors based on pod subject
  const gradients = [
    'from-violet-500 via-purple-500 to-fuchsia-500',
    'from-cyan-500 via-blue-500 to-indigo-500',
    'from-emerald-500 via-teal-500 to-cyan-500',
    'from-rose-500 via-pink-500 to-purple-500',
    'from-amber-500 via-orange-500 to-red-500',
    'from-lime-500 via-green-500 to-emerald-500',
  ];
  
  const bgGradients = [
    'from-violet-50 via-purple-50 to-fuchsia-50',
    'from-cyan-50 via-blue-50 to-indigo-50',
    'from-emerald-50 via-teal-50 to-cyan-50',
    'from-rose-50 via-pink-50 to-purple-50',
    'from-amber-50 via-orange-50 to-red-50',
    'from-lime-50 via-green-50 to-emerald-50',
  ];

  const gradientIndex = Math.abs(pod.title.charCodeAt(0) % gradients.length);
  const headerGradient = gradients[gradientIndex];
  const bgGradient = bgGradients[gradientIndex];

  return (
    <Card className={`group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 border-0 overflow-hidden bg-gradient-to-br ${bgGradient} backdrop-blur-xl`}>
      {/* Gradient Header */}
      <div className={`h-2 bg-gradient-to-r ${headerGradient}`} />
      
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-violet-600 group-hover:to-fuchsia-600 transition-all">
              {pod.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`bg-gradient-to-r ${headerGradient} text-white border-0 shadow-md text-xs px-3 py-1`}>
                <BookOpen className="w-3 h-3 mr-1" />
                {pod.subject}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {truncatedDescription && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
            {truncatedDescription}
          </p>
        )}

        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1.5 text-gray-600 bg-white/60 px-3 py-1.5 rounded-full">
            <Users className="w-3.5 h-3.5" />
            <span>{pod.student_count || 0} student{(pod.student_count || 0) !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 bg-white/60 px-3 py-1.5 rounded-full">
            <Calendar className="w-3.5 h-3.5" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-5">
        <Link to={userRole === 'teacher' ? `/pod/${pod.id}` : `/student/pod/${pod.id}`} className="w-full">
          <Button 
            className={`w-full bg-gradient-to-r ${headerGradient} text-white border-0 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-semibold`}
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