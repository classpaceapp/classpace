import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PodCard from '@/components/pods/PodCard';
import { StudentSubscriptionCard } from '@/components/subscription/StudentSubscriptionCard';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, BookOpen, Calendar, Sparkles, Search, KeyRound, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const requestIdRef = useRef(0);
  const [joinCode, setJoinCode] = useState('');
  const hasHandledSubscription = useRef(false);

  const fetchPods = async () => {
    const currentId = ++requestIdRef.current;
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Fetch pods where the student is a member
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

      // Transform data and get student counts
      const podsWithDetails = await Promise.all(
        (memberPods || []).map(async (member: any) => {
          const pod = member.pods;
          if (!pod) return null;

          const { count } = await supabase
            .from('pod_members')
            .select('*', { count: 'exact', head: true })
            .eq('pod_id', pod.id);

          // Get teacher info
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

  // Handle subscription success/cancelled from Stripe redirect
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription');
    
    if (subscriptionStatus && !hasHandledSubscription.current) {
      hasHandledSubscription.current = true;
      
      if (subscriptionStatus === 'success') {
        // Show success animation
        toast({
          title: '🎉 Subscription Active!',
          description: 'Your Learn+ subscription is now active. Refreshing your plan...',
          duration: 5000,
        });
        
        // Wait a moment for Stripe to process, then refresh subscription
        setTimeout(async () => {
          await refreshSubscription();
          toast({
            title: '✓ Plan Updated',
            description: 'Your subscription status has been refreshed.',
          });
        }, 2000);
      } else if (subscriptionStatus === 'cancelled') {
        toast({
          title: 'Subscription Cancelled',
          description: 'You cancelled the subscription process.',
          variant: 'destructive',
        });
      }
      
      // Clean up URL
      searchParams.delete('subscription');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshSubscription, toast]);

  useEffect(() => {
    fetchPods();
    return () => {
      isMounted.current = false;
    };
  }, [user?.id]);

  return (
    <DashboardLayout userRole="learner">
      {loading ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 md:p-8">
          <div className="mb-8">
            <Skeleton className="h-12 w-80 mb-4 rounded-2xl" />
            <Skeleton className="h-6 w-96 rounded-xl" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-3xl" />
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 md:p-8">
          {/* Welcome Section */}
          <div className="mb-6 md:mb-12">
            <Card className="border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-6 md:p-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
                <div className="relative flex items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center shrink-0 shadow-2xl border-2 border-white/40">
                    <Sparkles className="h-8 w-8 md:h-12 md:w-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-2">
                      Welcome back, {(profile?.first_name || '') + (profile?.last_name ? ` ${profile.last_name}` : '') || user?.email?.split('@')[0]}!
                    </h1>
                    <p className="text-base md:text-2xl text-white/95 font-medium drop-shadow-md">
                      Ready to learn something amazing today? Here's your learning overview.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Discovery and Join */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-12">
            <Card className="lg:col-span-2 border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
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
                <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter pod code (e.g., ABC123)" />
                <Button onClick={joinByCode} className="w-full">Join</Button>
              </CardContent>
            </Card>
          </div>

          {/* Stats and Subscription Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-12">
            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Total Classes</CardTitle>
                  <BookOpen className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">{pods.length}</div>
                <p className="text-gray-600 font-medium">
                  {pods.length === 1 ? 'class' : 'classes'} enrolled
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Total Classmates</CardTitle>
                  <Users className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {pods.reduce((total, pod) => total + (pod.student_count || 0), 0) - pods.length}
                </div>
                <p className="text-gray-600 font-medium">across all classes</p>
              </CardContent>
            </Card>

              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Active This Week</CardTitle>
                    <Calendar className="h-8 w-8" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {pods.length}
                  </div>
                  <p className="text-gray-600 font-medium">
                    classes active
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Card */}
            <div>
              <StudentSubscriptionCard />
            </div>
          </div>


          {/* Classes Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4 md:mb-8">
              <div className="flex items-center gap-2 md:gap-3">
                <Boxes className="h-5 w-5 md:h-7 md:w-7 text-foreground/70" />
                <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  My Classes
                </h2>
              </div>
            </div>

            {pods.length === 0 ? (
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-8">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    No Classes Yet
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 max-w-md">
                    You haven't been enrolled in any classes yet. Contact your teacher to get started with your learning journey.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {pods.map((pod) => (
                  <PodCard key={pod.id} pod={pod} userRole="learner" basePath="/student-dashboard" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;