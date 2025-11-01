import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  ArrowRight,
  Sparkles,
  Crown
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
  isLocked?: boolean;
}

const PodCard: React.FC<PodCardProps> = ({ pod, userRole, basePath, isLocked = false }) => {
  const truncatedDescription = pod.description && pod.description.length > 120 
    ? `${pod.description.substring(0, 120)}...` 
    : pod.description;

  const lastActivityDate = pod.updated_at;
  const timeAgo = formatDistanceToNow(new Date(lastActivityDate), { addSuffix: true });

  // Generate unique color schemes based on pod title
  const colorSchemes = [
    {
      gradient: 'from-violet-600 via-fuchsia-600 to-pink-600',
      glow: 'shadow-violet-500/50',
      bg: 'from-violet-500/10 via-fuchsia-500/10 to-pink-500/10',
      badge: 'from-violet-500 to-fuchsia-600',
      iconBg: 'from-violet-500 to-fuchsia-600',
      accent: 'violet',
    },
    {
      gradient: 'from-cyan-600 via-blue-600 to-indigo-600',
      glow: 'shadow-blue-500/50',
      bg: 'from-cyan-500/10 via-blue-500/10 to-indigo-500/10',
      badge: 'from-cyan-500 to-blue-600',
      iconBg: 'from-cyan-500 to-blue-600',
      accent: 'blue',
    },
    {
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      glow: 'shadow-emerald-500/50',
      bg: 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10',
      badge: 'from-emerald-500 to-teal-600',
      iconBg: 'from-emerald-500 to-teal-600',
      accent: 'emerald',
    },
    {
      gradient: 'from-rose-600 via-pink-600 to-fuchsia-600',
      glow: 'shadow-rose-500/50',
      bg: 'from-rose-500/10 via-pink-500/10 to-fuchsia-500/10',
      badge: 'from-rose-500 to-pink-600',
      iconBg: 'from-rose-500 to-pink-600',
      accent: 'rose',
    },
    {
      gradient: 'from-amber-600 via-orange-600 to-red-600',
      glow: 'shadow-orange-500/50',
      bg: 'from-amber-500/10 via-orange-500/10 to-red-500/10',
      badge: 'from-amber-500 to-orange-600',
      iconBg: 'from-amber-500 to-orange-600',
      accent: 'orange',
    },
    {
      gradient: 'from-lime-600 via-green-600 to-emerald-600',
      glow: 'shadow-lime-500/50',
      bg: 'from-lime-500/10 via-green-500/10 to-emerald-500/10',
      badge: 'from-lime-500 to-green-600',
      iconBg: 'from-lime-500 to-green-600',
      accent: 'lime',
    },
  ];

  const schemeIndex = Math.abs(pod.title.charCodeAt(0) % colorSchemes.length);
  const scheme = colorSchemes[schemeIndex];

  return (
    <Card className={`group relative hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-0 overflow-hidden bg-card backdrop-blur-xl ${isLocked ? 'opacity-75' : ''}`}>
      {/* Animated Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${scheme.bg} opacity-50 group-hover:opacity-70 transition-opacity duration-500`} />
      
      {/* Glow Effect on Hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl ${scheme.glow}`} />
      
      {/* Top Accent Bar with Animated Shimmer */}
      <div className="relative h-1.5 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${scheme.gradient}`} />
        <div className={`absolute inset-0 bg-gradient-to-r ${scheme.gradient} opacity-0 group-hover:opacity-100 animate-shimmer transition-opacity`} />
      </div>

      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border-2 border-amber-500/50 rounded-3xl p-8 shadow-2xl text-center max-w-xs">
            <div className="relative mb-4 mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 blur-xl opacity-60" />
              <div className="relative w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl">
                <Crown className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Pod Locked
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade to <span className="font-bold text-amber-600">Teach+</span> to unlock this pod
            </p>
            <p className="text-xs text-muted-foreground/70">Free plan includes 1 active pod</p>
          </div>
        </div>
      )}
      
      <CardHeader className="relative pb-4 pt-6">
        <div className="flex items-start gap-4">
          {/* Gradient Icon */}
          <div className="relative flex-shrink-0">
            <div className={`absolute inset-0 bg-gradient-to-br ${scheme.iconBg} blur-lg opacity-60 group-hover:opacity-80 transition-opacity`} />
            <div className={`relative w-14 h-14 bg-gradient-to-br ${scheme.iconBg} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
              <BookOpen className="w-7 h-7 text-white" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-xl font-bold mb-2 line-clamp-2 bg-gradient-to-r ${scheme.gradient} bg-clip-text text-transparent group-hover:scale-[1.02] transition-transform origin-left`}>
              {pod.title}
            </h3>
            <Badge className={`bg-gradient-to-r ${scheme.badge} text-white border-0 shadow-md hover:shadow-lg transition-shadow`}>
              {pod.subject}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pb-4 space-y-4">
        {truncatedDescription && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {truncatedDescription}
          </p>
        )}

        {/* Stats Row with Glass Morphism */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 group-hover:border-border transition-colors">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">
              {pod.student_count || 0} student{(pod.student_count || 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 group-hover:border-border transition-colors">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">{timeAgo}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative pt-2 pb-6">
        {isLocked ? (
          <Button 
            disabled
            className="w-full bg-muted text-muted-foreground cursor-not-allowed"
          >
            Locked - Upgrade Required
          </Button>
        ) : (
          <Link to={userRole === 'teacher' ? `/pod/${pod.id}` : `/student/pod/${pod.id}`} className="w-full">
            <Button 
              className={`w-full bg-gradient-to-r ${scheme.gradient} text-white border-0 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-semibold group/btn relative overflow-hidden`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {userRole === 'teacher' ? 'Manage Pod' : 'Enter Pod'}
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

export default PodCard;
