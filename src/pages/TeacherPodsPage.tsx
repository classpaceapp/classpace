import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PodCard from '@/components/pods/PodCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Boxes } from 'lucide-react';

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

const TeacherPodsPage: React.FC = () => {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const requestIdRef = useRef(0);

  const fetchPods = async () => {
    const currentId = ++requestIdRef.current;
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { data: podsData, error } = await supabase
        .from('pods')
        .select('*')
        .eq('teacher_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

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

  useEffect(() => {
    fetchPods();
    return () => {
      isMounted.current = false;
    };
  }, [user?.id]);

  return (
    <DashboardLayout userRole="teacher">
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Boxes className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    My Pods
                  </h1>
                  <p className="text-xl text-gray-600 mt-2">
                    All your created pods in one place
                  </p>
                </div>
              </div>
            </div>
          </div>

          {pods.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 text-center shadow-2xl">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-8 mx-auto">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Pods Yet</h3>
              <p className="text-lg text-gray-600">Create pods from your dashboard to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pods.map((pod, index) => {
                // If teacher is on free tier and has multiple pods, lock all except the first one
                const isLocked = !subscription?.subscribed && index > 0;
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
      )}
    </DashboardLayout>
  );
};

export default TeacherPodsPage;
