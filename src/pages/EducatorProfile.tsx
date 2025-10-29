import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, GraduationCap, Award, Sparkles, ExternalLink } from 'lucide-react';

interface EducatorData {
  id: string;
  user_id: string;
  years_experience: number;
  teaching_experience: string;
  qualifications: Array<{ title: string; link: string }>;
  subjects_expertise: string[];
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

interface PublicPod {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  pod_code: string;
}

const EducatorProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [educator, setEducator] = useState<EducatorData | null>(null);
  const [publicPods, setPublicPods] = useState<PublicPod[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningPod, setJoiningPod] = useState<string | null>(null);

  useEffect(() => {
    fetchEducator();
  }, [userId]);

  const fetchEducator = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data: teacherData, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .single();

      if (teacherError) throw teacherError;

      // Fetch profile separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, bio')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch public pods for this teacher
      const { data: podsData } = await supabase
        .from('pods')
        .select('id, title, description, subject, pod_code')
        .eq('teacher_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      setEducator({
        ...teacherData,
        profiles: profileData
      } as any);
      
      setPublicPods(podsData || []);
    } catch (error: any) {
      console.error('Error fetching educator:', error);
      toast({
        title: 'Failed to load educator profile',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/educators');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleJoinPod = async (podId: string, podCode: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to join pods',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    setJoiningPod(podId);
    try {
      const { data, error } = await supabase.rpc('join_pod_with_code', {
        code: podCode,
      });

      if (error) throw error;

      toast({
        title: 'Successfully joined pod!',
        description: 'You can now access this pod from your dashboard',
      });

      // Navigate to student pod view (correct route)
      navigate(`/student/pod/${podId}`);
    } catch (error: any) {
      toast({
        title: 'Failed to join pod',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setJoiningPod(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole={profile?.role === 'teacher' ? 'teacher' : 'learner'}>
        <div className="container mx-auto px-4 py-8 mt-6">
          <div className="space-y-6 pl-8 animate-pulse">
            <div className="h-12 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!educator) {
    return (
      <DashboardLayout userRole={profile?.role === 'teacher' ? 'teacher' : 'learner'}>
        <div className="container mx-auto px-4 py-8 mt-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Educator profile not found</h2>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={profile?.role === 'teacher' ? 'teacher' : 'learner'}>
      <div className="container mx-auto px-4 py-8 mt-6">
        <div className="space-y-6 pl-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/educators')}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Educator Profile
              </h1>
            </div>
          </div>

          {/* Profile Card */}
          <Card className="border-2 border-teal-500/30 shadow-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
            <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-b border-teal-500/20">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24 border-4 border-teal-500/40 shadow-lg">
                  <AvatarImage src={educator.profiles.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-2xl font-bold">
                    {getInitials(educator.profiles.first_name, educator.profiles.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-3xl bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
                    {educator.profiles.first_name} {educator.profiles.last_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Award className="h-5 w-5 text-teal-600" />
                    <span className="text-lg text-muted-foreground font-medium">
                      {educator.years_experience} {educator.years_experience === 1 ? 'year' : 'years'} of teaching experience
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Bio */}
              {educator.profiles.bio && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-100 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-teal-600" />
                    About
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{educator.profiles.bio}</p>
                </div>
              )}

              {/* Teaching Experience */}
              {educator.teaching_experience && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-100 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-600" />
                    Teaching Experience
                  </h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {educator.teaching_experience}
                  </p>
                </div>
              )}

              {/* Subjects */}
              {educator.subjects_expertise.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-100">
                    Subjects of Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {educator.subjects_expertise.map((subject) => (
                      <Badge
                        key={subject}
                        className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white border-0 shadow-sm px-4 py-2 text-sm"
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Qualifications */}
              {educator.qualifications && educator.qualifications.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-100">
                    Qualifications & Certifications
                  </h3>
                  <div className="grid gap-3">
                    {educator.qualifications.map((qual, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border-2 border-teal-200 dark:border-teal-800 shadow-sm"
                      >
                        <Award className="h-5 w-5 text-teal-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{qual.title}</p>
                          {qual.link && (
                            <a
                              href={qual.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-teal-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              View credential
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Public Pods Section */}
          {publicPods.length > 0 && (
            <Card className="border-2 border-teal-500/30 shadow-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
              <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-b border-teal-500/20">
                <CardTitle className="text-2xl bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
                  Active Public Pods
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {publicPods.map((pod) => (
                    <Card
                      key={pod.id}
                      className="border-2 border-teal-200 dark:border-teal-800 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg text-teal-900 dark:text-teal-100">
                          {pod.title}
                        </CardTitle>
                        {pod.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {pod.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                            {pod.subject}
                          </Badge>
                        </div>
                        {profile?.role === 'learner' && (
                          <Button
                            onClick={() => handleJoinPod(pod.id, pod.pod_code)}
                            disabled={joiningPod === pod.id}
                            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                          >
                            {joiningPod === pod.id ? 'Joining...' : 'Join Pod'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EducatorProfile;
