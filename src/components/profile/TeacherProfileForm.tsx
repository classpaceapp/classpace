import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Plus, X, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English Literature', 'English Language', 'History', 'Geography', 'Economics',
  'Business Studies', 'Psychology', 'Sociology', 'Philosophy', 'Art & Design',
  'Music', 'Drama', 'Physical Education', 'French', 'Spanish',
  'German', 'Mandarin', 'Arabic', 'Latin', 'Statistics',
  'Environmental Science', 'Political Science', 'Religious Studies', 'Media Studies',
  'Engineering', 'Law', 'Medicine', 'Architecture', 'Other'
];

interface TeacherProfile {
  years_experience: number;
  teaching_experience: string;
  qualifications: Array<{ title: string; link: string }>;
  subjects_expertise: string[];
  is_public: boolean;
}

export const TeacherProfileForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TeacherProfile>({
    years_experience: 0,
    teaching_experience: '',
    qualifications: [],
    subjects_expertise: [],
    is_public: true,
  });
  const [newQualTitle, setNewQualTitle] = useState('');
  const [newQualLink, setNewQualLink] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          years_experience: data.years_experience || 0,
          teaching_experience: data.teaching_experience || '',
          qualifications: (data.qualifications as Array<{ title: string; link: string }>) || [],
          subjects_expertise: data.subjects_expertise || [],
          is_public: data.is_public,
        });
      }
    } catch (error: any) {
      console.error('Error fetching teacher profile:', error);
      toast({
        title: 'Failed to load profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('teacher_profiles')
        .upsert(
          {
            user_id: user.id,
            years_experience: profile.years_experience,
            teaching_experience: profile.teaching_experience,
            qualifications: profile.qualifications,
            subjects_expertise: profile.subjects_expertise,
            is_public: profile.is_public,
          },
          {
            onConflict: 'user_id', // Specify the unique constraint column
          }
        );

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your teaching profile has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to save profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addQualification = () => {
    if (!newQualTitle.trim()) return;
    
    setProfile({
      ...profile,
      qualifications: [
        ...profile.qualifications,
        { title: newQualTitle, link: newQualLink },
      ],
    });
    setNewQualTitle('');
    setNewQualLink('');
  };

  const removeQualification = (index: number) => {
    setProfile({
      ...profile,
      qualifications: profile.qualifications.filter((_, i) => i !== index),
    });
  };

  const toggleSubject = (subject: string) => {
    setProfile({
      ...profile,
      subjects_expertise: profile.subjects_expertise.includes(subject)
        ? profile.subjects_expertise.filter((s) => s !== subject)
        : [...profile.subjects_expertise, subject],
    });
  };

  if (loading) {
    return (
      <Card className="border-2 border-purple-500/30 shadow-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-500/30 shadow-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Teaching Profile
            </CardTitle>
            <CardDescription className="text-sm">
              Create your public educator profile to connect with students
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="public-profile" className="text-sm font-medium">
              Public Profile
            </Label>
            <Switch
              id="public-profile"
              checked={profile.is_public}
              onCheckedChange={(checked) =>
                setProfile({ ...profile, is_public: checked })
              }
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Years of Experience */}
        <div className="space-y-2">
          <Label htmlFor="years-experience" className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            Years of Teaching Experience
          </Label>
          <Input
            id="years-experience"
            type="number"
            min="0"
            value={profile.years_experience === 0 ? '' : profile.years_experience}
            onChange={(e) =>
              setProfile({ ...profile, years_experience: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })
            }
            className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        {/* Teaching Experience */}
        <div className="space-y-2">
          <Label htmlFor="teaching-exp" className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            Describe Your Teaching Experience
          </Label>
          <Textarea
            id="teaching-exp"
            value={profile.teaching_experience}
            onChange={(e) =>
              setProfile({ ...profile, teaching_experience: e.target.value })
            }
            placeholder="Share your teaching journey, methodologies, and achievements..."
            rows={4}
            className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        {/* Qualifications */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            Qualifications & Certifications
          </Label>
          <div className="space-y-2">
            {profile.qualifications.map((qual, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{qual.title}</p>
                  {qual.link && (
                    <a
                      href={qual.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:underline truncate block"
                    >
                      {qual.link}
                    </a>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeQualification(index)}
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Qualification title"
              value={newQualTitle}
              onChange={(e) => setNewQualTitle(e.target.value)}
              className="border-purple-300 focus:border-purple-500"
            />
            <Input
              placeholder="Link (optional)"
              value={newQualLink}
              onChange={(e) => setNewQualLink(e.target.value)}
              className="border-purple-300 focus:border-purple-500"
            />
            <Button
              onClick={addQualification}
              disabled={!newQualTitle.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Subjects of Expertise */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            Subjects of Expertise
          </Label>
          <Select onValueChange={toggleSubject}>
            <SelectTrigger className="border-purple-300 focus:border-purple-500">
              <SelectValue placeholder="Select subjects..." />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {profile.subjects_expertise.map((subject) => (
              <div
                key={subject}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-sm shadow-sm"
              >
                <span>{subject}</span>
                <button
                  onClick={() => toggleSubject(subject)}
                  className="hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          {saving ? 'Saving...' : 'Save Teaching Profile'}
        </Button>
      </CardContent>
    </Card>
  );
};
