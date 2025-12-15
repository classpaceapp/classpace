import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, Mail, Send, List, Plus, Trash2, RefreshCw, 
  Search, Filter, UserCheck, Crown, GraduationCap, BookOpen,
  Sparkles, Zap, Target, TrendingUp
} from 'lucide-react';
import LoadingAnimation from '@/components/LoadingAnimation';

const AUTHORIZED_EMAIL = "social@classpace.co";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  subscription_tier: string;
  subscription_status: string;
}

interface BrevoList {
  id: number;
  name: string;
  totalSubscribers?: number;
}

const MarketingDashboard = () => {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [lists, setLists] = useState<BrevoList[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Email composer state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [selectedList, setSelectedList] = useState<string>('');
  
  // Custom list dialog state
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Wait for auth to fully load before checking authorization
  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);
    }
  }, [loading]);

  // Check if user email matches (case-insensitive)
  const isAuthorized = user?.email?.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase();

  useEffect(() => {
    if (authChecked && isAuthorized) {
      fetchData();
    }
  }, [authChecked, isAuthorized]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, listsRes] = await Promise.all([
        supabase.functions.invoke('marketing-admin', {
          body: { action: 'get-users' }
        }),
        supabase.functions.invoke('marketing-admin', {
          body: { action: 'get-lists' }
        })
      ]);

      if (usersRes.error) throw usersRes.error;
      if (listsRes.error) throw listsRes.error;

      setUsers(usersRes.data || []);
      setLists(listsRes.data || []);
    } catch (error: any) {
      console.error('Marketing dashboard error:', error);
      toast.error('Failed to fetch data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setupAndSyncLists = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('marketing-admin', {
        body: { action: 'sync-all-users' }
      });
      
      if (error) throw error;
      toast.success(`Synced ${data.synced} users to Brevo lists`);
      fetchData();
    } catch (error: any) {
      toast.error('Sync failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Show loading while auth is being checked
  if (loading || !authChecked) {
    return <LoadingAnimation />;
  }

  // Redirect if not authorized (after auth is fully loaded)
  if (!isAuthorized) {
    console.log('Marketing dashboard access denied:', { 
      userEmail: user?.email, 
      expected: AUTHORIZED_EMAIL,
      isLoggedIn: !!user 
    });
    return <Navigate to="/" replace />;
  }

  const sendEmail = async () => {
    if (!emailSubject || emailSubject.trim().length < 3) {
      toast.error('Subject must be at least 3 characters');
      return;
    }

    if (!emailContent || emailContent.trim().length < 11) {
      toast.error('Email content must be at least 11 characters (Brevo requirement)');
      return;
    }

    if ((selectedList === 'selected-users' || !selectedList) && selectedUsers.length === 0) {
      toast.error('Please select recipients');
      return;
    }

    setIsSending(true);
    try {
      const payload: any = {
        action: 'send-email',
        subject: emailSubject,
        htmlContent: emailContent,
      };

      if (selectedList && selectedList !== 'selected-users') {
        payload.listId = parseInt(selectedList);
      } else {
        const selectedEmails = users
          .filter(u => selectedUsers.includes(u.id))
          .map(u => u.email)
          .filter(Boolean);
        payload.to = selectedEmails;
      }

      const { data, error } = await supabase.functions.invoke('marketing-admin', {
        body: payload
      });

      if (error) throw error;
      toast.success('Email sent successfully!');
      setEmailSubject('');
      setEmailContent('');
      setSelectedUsers([]);
      setSelectedList('');
    } catch (error: any) {
      toast.error('Failed to send email: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const createCustomList = async () => {
    if (!newListName || selectedUsers.length === 0) {
      toast.error('Please provide a name and select users');
      return;
    }

    try {
      const selectedEmails = users
        .filter(u => selectedUsers.includes(u.id))
        .map(u => u.email)
        .filter(Boolean);

      const { data, error } = await supabase.functions.invoke('marketing-admin', {
        body: {
          action: 'create-custom-list',
          name: newListName,
          userEmails: selectedEmails,
        }
      });

      if (error) throw error;
      toast.success(`Created list "${newListName}" with ${selectedEmails.length} contacts`);
      setShowCreateList(false);
      setNewListName('');
      setSelectedUsers([]);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to create list: ' + error.message);
    }
  };

  const deleteList = async (listId: number) => {
    try {
      const { error } = await supabase.functions.invoke('marketing-admin', {
        body: { action: 'delete-list', listId }
      });

      if (error) throw error;
      toast.success('List deleted');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete list: ' + error.message);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredUsers.map(u => u.id);
    setSelectedUsers(filteredIds);
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesTier = tierFilter === 'all' || u.subscription_tier === tierFilter;
    return matchesSearch && matchesRole && matchesTier;
  });

  const stats = {
    totalUsers: users.length,
    learners: users.filter(u => u.role === 'learner').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    premium: users.filter(u => u.subscription_tier?.includes('premium')).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/25">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Marketing Command Center
              </h1>
              <p className="text-slate-400 mt-1">Engage your community with powerful email campaigns</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500' },
            { label: 'Learners', value: stats.learners, icon: GraduationCap, color: 'from-green-500 to-emerald-500' },
            { label: 'Teachers', value: stats.teachers, icon: BookOpen, color: 'from-orange-500 to-amber-500' },
            { label: 'Premium', value: stats.premium, icon: Crown, color: 'from-purple-500 to-pink-500' },
          ].map((stat, i) => (
            <Card key={i} className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl overflow-hidden group hover:border-slate-700/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-800/50 p-1 backdrop-blur-xl">
            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              User Directory
            </TabsTrigger>
            <TabsTrigger value="compose" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <Mail className="w-4 h-4 mr-2" />
              Email Composer
            </TabsTrigger>
            <TabsTrigger value="lists" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <List className="w-4 h-4 mr-2" />
              Newsletter Lists
            </TabsTrigger>
          </TabsList>

          {/* User Directory Tab */}
          <TabsContent value="users">
            <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-400" />
                      User Directory
                    </CardTitle>
                    <CardDescription>Browse and select users for campaigns</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={setupAndSyncLists}
                      disabled={isSyncing}
                      className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Sync to Brevo'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 text-white">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="learner">Learners</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 text-white">
                      <SelectValue placeholder="Subscription" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="learner_premium">Learn+</SelectItem>
                      <SelectItem value="teacher_premium">Teach+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selection actions */}
                <div className="flex items-center gap-4 mb-4">
                  <Button variant="ghost" size="sm" onClick={selectAllFiltered} className="text-purple-300 hover:text-purple-200">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Select All ({filteredUsers.length})
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection} className="text-slate-400 hover:text-slate-300">
                    Clear Selection
                  </Button>
                  {selectedUsers.length > 0 && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {selectedUsers.length} selected
                    </Badge>
                  )}
                  {selectedUsers.length > 0 && (
                    <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Create List from Selection
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-800">
                        <DialogHeader>
                          <DialogTitle className="text-white">Create Custom List</DialogTitle>
                          <DialogDescription>Create a new Brevo list with {selectedUsers.length} selected users</DialogDescription>
                        </DialogHeader>
                        <Input
                          placeholder="List name..."
                          value={newListName}
                          onChange={e => setNewListName(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowCreateList(false)}>Cancel</Button>
                          <Button onClick={createCustomList} className="bg-gradient-to-r from-purple-500 to-pink-500">
                            Create List
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* User list */}
                <ScrollArea className="h-[500px] pr-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredUsers.map(u => (
                        <div
                          key={u.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                            selectedUsers.includes(u.id)
                              ? 'bg-purple-500/20 border-purple-500/50'
                              : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
                          }`}
                          onClick={() => toggleUserSelection(u.id)}
                        >
                          <Checkbox 
                            checked={selectedUsers.includes(u.id)}
                            className="border-slate-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white truncate">
                                {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'No name'}
                              </span>
                              <Badge variant="outline" className={
                                u.role === 'teacher' 
                                  ? 'border-orange-500/50 text-orange-300 text-xs' 
                                  : 'border-green-500/50 text-green-300 text-xs'
                              }>
                                {u.role}
                              </Badge>
                              {u.subscription_tier?.includes('premium') && (
                                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                                  <Crown className="w-3 h-3 mr-1" />
                                  {u.subscription_tier === 'teacher_premium' ? 'Teach+' : 'Learn+'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 truncate">{u.email}</p>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(u.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Composer Tab */}
          <TabsContent value="compose">
            <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Email Composer
                </CardTitle>
                <CardDescription>Craft beautiful emails for your audience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recipients */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Send to</label>
                  <Select value={selectedList} onValueChange={setSelectedList}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white">
                      <SelectValue placeholder="Select a list or use selected users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected-users">Selected Users ({selectedUsers.length})</SelectItem>
                      <Separator className="my-2" />
                      {lists.map(list => (
                        <SelectItem key={list.id} value={list.id.toString()}>
                          {list.name} ({list.totalSubscribers || 0} contacts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(selectedList === 'selected-users' || !selectedList) && selectedUsers.length === 0 && (
                    <p className="text-xs text-amber-400">Select users from the User Directory tab or choose a list</p>
                  )}
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Subject</label>
                  <Input
                    placeholder="Enter email subject..."
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Content (HTML supported)</label>
                  <Textarea
                    placeholder="Write your email content here... HTML is supported for rich formatting."
                    value={emailContent}
                    onChange={e => setEmailContent(e.target.value)}
                    rows={12}
                    className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 font-mono text-sm"
                  />
                </div>

                {/* Send button */}
                <Button
                  onClick={sendEmail}
                  disabled={isSending || ((selectedList === 'selected-users' || !selectedList) && selectedUsers.length === 0) || !emailSubject || !emailContent}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 text-lg"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Newsletter Lists Tab */}
          <TabsContent value="lists">
            <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Newsletter Lists
                    </CardTitle>
                    <CardDescription>Manage your Brevo contact lists</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={fetchData}
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {lists.length === 0 ? (
                    <div className="text-center py-12">
                      <List className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400 mb-4">No lists found. Sync users to create default lists.</p>
                      <Button onClick={setupAndSyncLists} disabled={isSyncing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        Setup & Sync Lists
                      </Button>
                    </div>
                  ) : (
                    lists.map(list => (
                      <div
                        key={list.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            list.name.includes('learners') ? 'bg-green-500/20' :
                            list.name.includes('teachers') ? 'bg-orange-500/20' :
                            list.name.includes('learn-plus') ? 'bg-blue-500/20' :
                            list.name.includes('teach-plus') ? 'bg-purple-500/20' :
                            'bg-slate-600/20'
                          }`}>
                            {list.name.includes('learners') ? <GraduationCap className="w-5 h-5 text-green-400" /> :
                             list.name.includes('teachers') ? <BookOpen className="w-5 h-5 text-orange-400" /> :
                             list.name.includes('plus') ? <Crown className="w-5 h-5 text-purple-400" /> :
                             <List className="w-5 h-5 text-slate-400" />}
                          </div>
                          <div>
                            <p className="font-medium text-white">{list.name}</p>
                            <p className="text-sm text-slate-400">{list.totalSubscribers || 0} contacts</p>
                          </div>
                        </div>
                        {!['classpace-learners', 'classpace-teachers', 'classpace-learn-plus', 'classpace-teach-plus'].includes(list.name) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteList(list.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketingDashboard;
