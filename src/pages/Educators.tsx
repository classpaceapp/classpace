import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Search, GraduationCap, Sparkles, Award } from 'lucide-react';

interface TeacherProfile {
  id: string;
  user_id: string;
  years_experience: number;
  teaching_experience: string;
  qualifications: any[];
  subjects_expertise: string[];
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

const Educators: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [educators, setEducators] = useState<TeacherProfile[]>([]);
  const [filteredEducators, setFilteredEducators] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEducators();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEducators(educators);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = educators.filter((educator) => {
      const fullName = `${educator.profiles.first_name} ${educator.profiles.last_name}`.toLowerCase();
      const subjects = educator.subjects_expertise.join(' ').toLowerCase();
      return fullName.includes(query) || subjects.includes(query);
    });
    setFilteredEducators(filtered);
  }, [searchQuery, educators]);

  const fetchEducators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          years_experience,
          teaching_experience,
          qualifications,
          subjects_expertise,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .order('years_experience', { ascending: false });

      if (error) throw error;

      setEducators(data as any);
      setFilteredEducators(data as any);
    } catch (error: any) {
      console.error('Error fetching educators:', error);
      toast({
        title: 'Failed to load educators',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <DashboardLayout userRole={profile?.role === 'teacher' ? 'teacher' : 'learner'}>
      <div className="container mx-auto px-4 py-8 mt-6">
        <div className="space-y-6 pl-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Discover Educators
              </h1>
              <p className="text-muted-foreground mt-1">
                Connect with experienced teachers on Classpace
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg border-2 border-teal-300 focus:border-teal-500 focus:ring-teal-500 rounded-xl shadow-sm"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Educators Grid */}
          {!loading && (
            <>
              {filteredEducators.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-12 text-center">
                    <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No educators found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? 'Try adjusting your search criteria'
                        : 'Be the first to create a public teaching profile!'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEducators.map((educator) => (
                    <Card
                      key={educator.id}
                      className="cursor-pointer border-2 border-teal-500/20 hover:border-teal-500/50 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-teal-50/30 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/20"
                      onClick={() => navigate(`/educator/${educator.user_id}`)}
                    >
                      <CardHeader className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-4 border-teal-500/30 shadow-md">
                            <AvatarImage src={educator.profiles.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-lg font-bold">
                              {getInitials(
                                educator.profiles.first_name,
                                educator.profiles.last_name
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-xl bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
                              {educator.profiles.first_name} {educator.profiles.last_name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Award className="h-4 w-4 text-teal-600" />
                              <span className="text-sm text-muted-foreground">
                                {educator.years_experience}{' '}
                                {educator.years_experience === 1 ? 'year' : 'years'} experience
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {educator.teaching_experience && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {educator.teaching_experience}
                          </p>
                        )}
                        {educator.subjects_expertise.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-teal-600" />
                              <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                                EXPERTISE
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {educator.subjects_expertise.slice(0, 5).map((subject) => (
                                <Badge
                                  key={subject}
                                  variant="secondary"
                                  className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs"
                                >
                                  {subject}
                                </Badge>
                              ))}
                              {educator.subjects_expertise.length > 5 && (
                                <Badge
                                  variant="secondary"
                                  className="bg-teal-500/10 text-teal-600 text-xs"
                                >
                                  +{educator.subjects_expertise.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Educators;
