import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PodCard from '@/components/pods/PodCard';
import CreatePodFlow from '@/components/pods/CreatePodFlow';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, BookOpen, Activity, Sparkles, Boxes } from 'lucide-react';

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

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, subscription, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const isMounted = useRef(true);
  const requestIdRef = useRef(0);
  const hasHandledSubscription = useRef(false);

  const fetchPods = async () => {
    const currentId = ++requestIdRef.current;
    if (!user?.id) return;
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Fetch pods created by this teacher
      const { data: podsData, error } = await supabase
        .from('pods')
        .select('*')
        .eq('teacher_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get student counts for each pod
      const podsWithCounts = await Promise.all(
        (podsData || []).map(async (pod) => {
          const { count } = await supabase
            .from('pod_members')
            .select('*', { count: 'exact', head: true })
            .eq('pod_id', pod.id);

          return {
            ...pod,
            student_count: count || 0
          };
        })
      );

      if (!isMounted.current || currentId !== requestIdRef.current) return;
      setPods(podsWithCounts);
    } catch (error: any) {
      console.error('Error fetching pods:', error);
      // Avoid noisy toasts on transient network issues
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

  // Handle subscription success/cancelled from Stripe redirect
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription');
    
    if (subscriptionStatus && !hasHandledSubscription.current) {
      hasHandledSubscription.current = true;
      
      if (subscriptionStatus === 'success') {
        // Show success animation
        toast({
          title: '🎉 Subscription Active!',
          description: 'Your Teach+ subscription is now active. Refreshing your plan...',
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
     isMounted.current = true;
     fetchPods();
     return () => {
       isMounted.current = false;
     };
   }, [user?.id]);

  if (showCreateFlow) {
    return (
      <DashboardLayout userRole="teacher">
        <CreatePodFlow 
          onComplete={() => {
            setShowCreateFlow(false);
            fetchPods();
          }}
          onCancel={() => setShowCreateFlow(false)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
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
              <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 md:p-10">
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
                      Ready to inspire and educate? Here's what's happening in your classroom.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats and Subscription Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-12">
            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Total Pods</CardTitle>
                    <BookOpen className="h-8 w-8" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">{pods.length}</div>
                  <p className="text-gray-600 font-medium">
                    {pods.length === 1 ? 'pod' : 'pods'} created
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Total Students</CardTitle>
                    <Users className="h-8 w-8" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {pods.reduce((total, pod) => total + (pod.student_count || 0), 0)}
                  </div>
                  <p className="text-gray-600 font-medium">across all pods</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Active This Week</CardTitle>
                    <Activity className="h-8 w-8" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {pods.length}
                  </div>
                  <p className="text-gray-600 font-medium">
                    pods active
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Card */}
            <div>
              <SubscriptionCard />
            </div>
          </div>

          {/* Pods Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4 md:mb-8">
              <div className="flex items-center gap-2 md:gap-3">
                <Boxes className="h-5 w-5 md:h-7 md:w-7 text-foreground/70" />
                <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  My Pods
                </h2>
              </div>
              <Button
                onClick={() => setShowCreateFlow(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl md:rounded-2xl px-4 md:px-8 py-2 md:py-3 text-sm md:text-lg font-semibold shadow-xl"
              >
                <Plus className="mr-1 md:mr-3 h-4 w-4 md:h-6 md:w-6" />
                <span className="hidden sm:inline">Create Pod</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>

            {pods.length === 0 ? (
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-8">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Create Your First Pod
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 max-w-md">
                    Pods are virtual classrooms where you can organize students, share materials, and conduct engaging learning sessions.
                  </p>
                  <Button
                    onClick={() => setShowCreateFlow(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl px-8 py-4 text-lg font-semibold shadow-xl"
                  >
                    <Plus className="mr-3 h-6 w-6" />
                    Create Your First Pod
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {pods.map((pod, index) => {
                  // Lock extra pods for free tier teachers
                  const isLocked = profile?.role === 'teacher' 
                    && (subscription?.tier === 'free' || !subscription?.tier)
                    && index > 0;
                  
                  return (
                    <PodCard 
                      key={pod.id} 
                      pod={pod} 
                      userRole="teacher" 
                      basePath="/dashboard"
                      isLocked={isLocked}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherDashboard;