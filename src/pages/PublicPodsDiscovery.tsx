import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Users, 
  Calendar, 
  BookOpen, 
  ArrowLeft, 
  Sparkles,
  Check,
  Loader2
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
  teacher_name?: string;
  student_count?: number;
  is_member?: boolean;
}

const PublicPodsDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningPodId, setJoiningPodId] = useState<string | null>(null);

  const fetchPublicPods = async (term?: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('pods')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false });

      if (term) {
        query = query.or(`title.ilike.%${term}%,subject.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get teacher names and student counts
      const podsWithDetails = await Promise.all(
        (data || []).map(async (pod: any) => {
          // Get teacher info
          const { data: teacherProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', pod.teacher_id)
            .single();

          // Get student count
          const { count } = await supabase
            .from('pod_members')
            .select('*', { count: 'exact', head: true })
            .eq('pod_id', pod.id);

          // Check if user is already a member
          const { data: membership } = await supabase
            .from('pod_members')
            .select('id')
            .eq('pod_id', pod.id)
            .eq('user_id', user.id)
            .maybeSingle();

          return {
            ...pod,
            teacher_name: teacherProfile 
              ? `${teacherProfile.first_name} ${teacherProfile.last_name}` 
              : 'Unknown Teacher',
            student_count: count || 0,
            is_member: !!membership,
          };
        })
      );

      setPods(podsWithDetails);
    } catch (error: any) {
      console.error('Error fetching public pods:', error);
      toast({
        title: 'Failed to load pods',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPod = async (podId: string) => {
    if (!user?.id) return;

    setJoiningPodId(podId);
    try {
      const { error } = await supabase
        .from('pod_members')
        .insert({
          pod_id: podId,
          user_id: user.id,
        });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast({
            title: 'Already a member',
            description: 'You are already a member of this pod',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Joined successfully!',
          description: 'You have been added to the pod',
        });
        
        // Refresh the pod list to update membership status
        await fetchPublicPods(searchTerm);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to join pod',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setJoiningPodId(null);
    }
  };

  const handleSearch = () => {
    fetchPublicPods(searchTerm);
  };

  useEffect(() => {
    fetchPublicPods(searchTerm);
  }, [user?.id]);

  return (
    <DashboardLayout userRole="learner">
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/student-dashboard')}
              className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-violet-600" />
                Discover Public Classes
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Explore and join public classes from teachers around the world
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by title or subject..."
                    className="pl-10 h-12 text-lg border-2 border-violet-200 focus:border-violet-500 transition-colors"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="h-12 px-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-80 animate-pulse bg-white/60 border-0" />
            ))}
          </div>
        ) : pods.length === 0 ? (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mb-6">
                <Search className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No Public Classes Found
              </h3>
              <p className="text-lg text-gray-600 max-w-md">
                {searchTerm 
                  ? `No public classes match "${searchTerm}". Try a different search term.`
                  : 'There are no public classes available at the moment.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {searchTerm ? `Results for "${searchTerm}"` : 'All Public Classes'}
              </h2>
              <p className="text-gray-600 mt-1">
                {pods.length} {pods.length === 1 ? 'class' : 'classes'} found
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pods.map((pod) => {
                const timeAgo = formatDistanceToNow(new Date(pod.updated_at), { addSuffix: true });
                
                // Generate gradient colors
                const gradients = [
                  { header: 'from-violet-500 via-purple-500 to-fuchsia-500', bg: 'from-violet-50 via-purple-50 to-fuchsia-50' },
                  { header: 'from-cyan-500 via-blue-500 to-indigo-500', bg: 'from-cyan-50 via-blue-50 to-indigo-50' },
                  { header: 'from-emerald-500 via-teal-500 to-cyan-500', bg: 'from-emerald-50 via-teal-50 to-cyan-50' },
                  { header: 'from-rose-500 via-pink-500 to-purple-500', bg: 'from-rose-50 via-pink-50 to-purple-50' },
                  { header: 'from-amber-500 via-orange-500 to-red-500', bg: 'from-amber-50 via-orange-50 to-red-50' },
                ];
                const gradientIndex = Math.abs(pod.title.charCodeAt(0) % gradients.length);
                const gradient = gradients[gradientIndex];

                return (
                  <Card 
                    key={pod.id} 
                    className={`group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 border-0 overflow-hidden bg-gradient-to-br ${gradient.bg}`}
                  >
                    <div className={`h-2 bg-gradient-to-r ${gradient.header}`} />
                    
                    <CardHeader className="pb-3 pt-5">
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {pod.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`bg-gradient-to-r ${gradient.header} text-white border-0 shadow-md text-xs px-3 py-1`}>
                          <BookOpen className="w-3 h-3 mr-1" />
                          {pod.subject}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {pod.description && (
                        <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
                          {pod.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/60 px-3 py-2 rounded-lg">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{pod.student_count || 0} students enrolled</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/60 px-3 py-2 rounded-lg">
                          <Calendar className="w-4 h-4" />
                          <span>Updated {timeAgo}</span>
                        </div>
                      </div>

                      {pod.is_member ? (
                        <Button 
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg font-semibold cursor-default"
                          disabled
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Already Joined
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleJoinPod(pod.id)}
                          disabled={joiningPodId === pod.id}
                          className={`w-full bg-gradient-to-r ${gradient.header} text-white border-0 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-semibold`}
                        >
                          {joiningPodId === pod.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Joining...
                            </>
                          ) : (
                            'Join Class'
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PublicPodsDiscovery;
