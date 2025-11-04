import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const StudentProfiles: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) fetchStudents();
  }, [user?.id]);

  const fetchStudents = async () => {
    if (!user?.id) return;
    try {
      const { data: pods } = await supabase.from('pods').select('id, title, subject').eq('teacher_id', user.id);
      const podIds = pods?.map(p => p.id) || [];
      if (podIds.length === 0) { setLoading(false); return; }

      const { data: members } = await supabase.from('pod_members').select('user_id, pod_id, profiles(first_name, last_name, avatar_url)').in('pod_id', podIds);
      const studentData = await Promise.all((members || []).map(async (m: any) => {
        const pod = pods?.find(p => p.id === m.pod_id);
        const { count: messageCount } = await supabase.from('pod_messages').select('*', { count: 'exact', head: true }).eq('user_id', m.user_id).eq('pod_id', m.pod_id);
        const { count: quizCount } = await supabase.from('quiz_responses').select('*', { count: 'exact', head: true }).eq('user_id', m.user_id);
        return {
          id: m.user_id,
          name: `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.trim() || 'Student',
          avatar: m.profiles?.avatar_url,
          podName: pod?.title || '',
          messageCount: messageCount || 0,
          quizCount: quizCount || 0,
          engagement: Math.min(((messageCount || 0) + (quizCount || 0) * 2), 100)
        };
      }));

      const grouped = studentData.reduce((acc: any, s) => {
        if (!acc[s.podName]) acc[s.podName] = [];
        acc[s.podName].push(s);
        return acc;
      }, {});
      setStudents(Object.entries(grouped));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Skeleton className="h-96" />;
  if (students.length === 0) return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="p-12 text-center">
        <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">No Students Yet</h3>
        <p className="text-muted-foreground">Students will appear once they join your pods</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {students.map(([podName, studentList]: [string, any]) => (
        <Card key={podName} className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-t-lg">
            <CardTitle className="text-xl">{podName}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentList.map((student: any) => (
                <Card key={student.id} className="border-2 border-violet-100 hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold">
                          {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-bold truncate">{student.name}</h4>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {student.messageCount}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {student.engagement}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StudentProfiles;