import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Save, Sparkles, Palette, Image as ImageIcon, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeacherProfileForm } from '@/components/profile/TeacherProfileForm';

const Profile: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    bio: '',
    avatar_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: user?.email || '',
        phone_number: profile.phone_number || '',
        date_of_birth: profile.date_of_birth || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      await updateProfile({
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        phone_number: formData.phone_number || null,
        date_of_birth: formData.date_of_birth || null,
        bio: formData.bio || null,
        avatar_url: formData.avatar_url || null
      });

      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initials = formData.first_name && formData.last_name 
    ? `${formData.first_name[0]}${formData.last_name[0]}` 
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <DashboardLayout userRole={profile?.role === 'teacher' ? 'teacher' : 'learner'}>
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent pb-1">
            Profile Settings
          </h1>
          <p className="text-lg text-foreground/70">
            Manage your personal information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1 bg-gradient-to-br from-purple-50/80 to-pink-50/80 border-purple-200/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4">
                  <Avatar className="h-24 w-24 mx-auto border-4 border-white shadow-xl">
                  <AvatarImage src={formData.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl text-foreground">
                {formData.first_name} {formData.last_name}
              </CardTitle>
              <CardDescription className="capitalize flex items-center justify-center gap-2 text-foreground/60">
                <Palette className="h-4 w-4" />
                {profile?.role === 'teacher' ? 'Teacher' : 'Student'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !user?.id) return;
                      try {
                        setUploading(true);
                        const filePath = `${user.id}/${Date.now()}_${file.name}`;
                        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
                        if (uploadError) throw uploadError;
                        const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath);
                        const avatarUrl = publicUrl.publicUrl;
                        setFormData((prev) => ({ ...prev, avatar_url: avatarUrl }));
                        await updateProfile({ avatar_url: avatarUrl });
                        toast({ title: 'Avatar updated' });
                      } catch (err: any) {
                        toast({ title: 'Avatar upload failed', description: err.message, variant: 'destructive' });
                      } finally {
                        setUploading(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <ImageIcon className="h-3.5 w-3.5 mr-2" /> {uploading ? 'Uploading...' : 'Change Photo'}
                  </Button>
                </div>
                <div className="p-3 bg-white/60 rounded-lg border border-purple-200/50">
                  <p className="text-xs text-foreground/60 mb-1">Member since</p>
                  <p className="font-semibold text-sm text-foreground">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-100/60 to-pink-100/60 rounded-lg border border-purple-300/50">
                  <p className="text-xs text-foreground/60 mb-1">Account Status</p>
                  <p className="font-semibold text-sm text-purple-700">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Form */}
          <Card className="lg:col-span-2 bg-white/60 backdrop-blur-sm border-border">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="h-5 w-5 text-purple-600" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-foreground/60">
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-medium">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter your first name"
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter your last name"
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>

              <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="Enter your phone number"
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date of Birth
                    </Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us a bit about yourself"
                      className="bg-background/50 border-border/50 focus:border-primary/50 min-h-[120px]"
                    />
                  </div>
                </div>

              <div className="pt-5 border-t border-border">
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {profile?.role === 'teacher' && (
          <div className="mt-6">
            <TeacherProfileForm />
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;