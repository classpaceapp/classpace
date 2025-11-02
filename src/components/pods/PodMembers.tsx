import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'teacher' | 'learner';
  is_teacher: boolean;
  email: string | null;
}

interface PodMembersProps {
  podId: string;
  teacherId: string;
}

export const PodMembers: React.FC<PodMembersProps> = ({ podId, teacherId }) => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      setLoading(true);

      // Fetch teacher profile
      const { data: teacherProfile, error: teacherError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, email')
        .eq('id', teacherId)
        .single();

      if (teacherError) throw teacherError;

      // Fetch pod members (students)
      const { data: podMembers, error: membersError } = await supabase
        .from('pod_members')
        .select('user_id')
        .eq('pod_id', podId);

      if (membersError) throw membersError;

      // Fetch profiles for all members
      const memberIds = podMembers?.map(m => m.user_id) || [];
      let memberProfiles: any[] = [];
      
      if (memberIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, role, email')
          .in('id', memberIds);
        if (profilesError) throw profilesError;
        memberProfiles = profiles || [];
      }

      // Combine teacher and students
      const teacher: Member = {
        id: teacherProfile.id,
        user_id: teacherProfile.id,
        first_name: teacherProfile.first_name,
        last_name: teacherProfile.last_name,
        avatar_url: teacherProfile.avatar_url,
        role: teacherProfile.role as 'teacher' | 'learner',
        is_teacher: true,
        email: teacherProfile.email,
      };

      const students: Member[] = (memberProfiles || []).map((profile) => ({
        id: profile.id,
        user_id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        role: profile.role as 'teacher' | 'learner',
        is_teacher: false,
        email: profile.email,
      }));

      setMembers([teacher, ...students]);
    } catch (error: any) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Failed to load members',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [podId, teacherId]);

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const teacher = members.find(m => m.is_teacher);
  const students = members.filter(m => !m.is_teacher);

  return (
    <Card className="border-2 border-emerald-500/30 shadow-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
      <CardHeader className="border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            Pod Members
          </CardTitle>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {members.length} {members.length === 1 ? 'Member' : 'Members'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* Teacher Section */}
        {teacher && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <GraduationCap className="h-4 w-4" />
              <span>TEACHER</span>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-6 border-2 border-amber-300/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-md opacity-50"></div>
                  <Avatar className="h-16 w-16 border-4 border-white shadow-xl relative">
                    <AvatarImage src={teacher.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xl font-bold">
                      {teacher.first_name?.charAt(0) || 'T'}
                      {teacher.last_name?.charAt(0) || ''}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {teacher.first_name && teacher.last_name 
                        ? `${teacher.first_name} ${teacher.last_name}`
                        : teacher.email || 'Teacher'}
                    </h3>
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-md">
                      TEACHER
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    Pod Instructor
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <User className="h-4 w-4" />
            <span>STUDENTS ({students.length})</span>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">No students have joined yet</p>
              <p className="text-sm mt-1">Share your pod code to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="bg-white dark:bg-gray-900 rounded-xl p-4 border-2 border-emerald-200/50 dark:border-emerald-900/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-emerald-300 shadow-md">
                      <AvatarImage src={student.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold">
                        {student.first_name?.charAt(0) || 'S'}
                        {student.last_name?.charAt(0) || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {student.first_name && student.last_name 
                          ? `${student.first_name} ${student.last_name}`
                          : student.email || 'Student'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Student
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
