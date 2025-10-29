import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PodCard from '@/components/pods/PodCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Boxes, Search, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
}

const StudentPodsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const isMounted = useRef(true);
  const requestIdRef = useRef(0);

  const fetchPods = async () => {
    const currentId = ++requestIdRef.current;
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { data: memberPods, error } = await supabase
        .from('pod_members')
        .select(`
          pod_id,
          pods (
            *
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const podsWithDetails = await Promise.all(
        (memberPods || []).map(async (member: any) => {
          const pod = member.pods;
          if (!pod) return null;

          const { count } = await supabase
            .from('pod_members')
            .select('*', { count: 'exact', head: true })
            .eq('pod_id', pod.id);

          const { data: teacherProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', pod.teacher_id)
            .single();
          
          return {
            ...pod,
            teacher_name: teacherProfile 
              ? `${teacherProfile.first_name} ${teacherProfile.last_name}` 
              : 'Unknown Teacher',
            student_count: count || 0
          };
        })
      );

      if (!isMounted.current || currentId !== requestIdRef.current) return;
      setPods(podsWithDetails.filter(Boolean) as Pod[]);
    } catch (error: any) {
      console.error('Error fetching pods:', error);
      if (isMounted.current && error?.message && !/Failed to fetch/i.test(error.message)) {
        toast({
          title: "Failed to load pods",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const joinByCode = async () => {
    try {
      const code = joinCode.trim().toUpperCase();
      if (!code) return;
      const { data, error } = await supabase.rpc('join_pod_with_code', { code });
      if (error) throw error;
      toast({ title: 'Joined pod', description: 'You have been added to the pod.' });
      setJoinCode('');
      await fetchPods();
    } catch (err: any) {
      toast({ title: 'Join failed', description: err.message === 'INVALID_CODE' ? 'Invalid code' : err.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchPods();
    return () => {
      isMounted.current = false;
    };
  }, [user?.id]);

  return (
    <DashboardLayout userRole="learner">
      {loading ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
          <div className="mb-8">
            <Skeleton className="h-12 w-80 mb-4 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
          <div className="mb-12">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Boxes className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    My Classes
                  </h1>
                  <p className="text-xl text-gray-600 mt-2">
                    All your enrolled classes in one place
                  </p>
                </div>
              </div>
            </div>
          </div>

          {pods.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 text-center shadow-2xl">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-8 mx-auto">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Classes Yet</h3>
              <p className="text-lg text-gray-600">Join classes from your dashboard to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pods.map((pod) => (
                <PodCard key={pod.id} pod={pod} userRole="learner" basePath="/student-dashboard" />
              ))}
            </div>
          )}

          {/* Discovery and Join Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Discover Public Classes</CardTitle>
                  <Search className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <p className="text-gray-600 mb-4">
                  Search for public classes and join them instantly
                </p>
                <Button 
                  onClick={() => navigate('/discover-pods')} 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg"
                  size="lg"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Browse Public Classes
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Join with a Code</CardTitle>
                  <KeyRound className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Input 
                  value={joinCode} 
                  onChange={(e) => setJoinCode(e.target.value)} 
                  placeholder="Enter pod code (e.g., ABC123)" 
                  className="h-12"
                />
                <Button onClick={joinByCode} className="w-full h-12" size="lg">
                  Join Class
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentPodsPage;
