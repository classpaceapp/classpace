import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, Download, Trash2, Search, FileText, Link as LinkIcon, File } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  resource_type: string;
  file_url: string | null;
  external_link: string | null;
  file_name: string | null;
  tags: string[];
  uploaded_by: string;
  download_count: number;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

const CATEGORIES = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Languages',
  'Arts',
  'Physical Education',
  'Computer Science',
  'Other'
];

const RESOURCE_TYPES = [
  { value: 'link', label: 'External Link', icon: LinkIcon },
  { value: 'pdf', label: 'PDF Document', icon: FileText },
  { value: 'doc', label: 'Word Document', icon: File },
  { value: 'ppt', label: 'Presentation', icon: File },
  { value: 'other', label: 'Other', icon: File }
];

export const ResourceCenterFull: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    category: '',
    resource_type: 'link',
    external_link: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teaching_resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Fetch uploader profiles separately
      const uploaderIds = [...new Set(data?.map(r => r.uploaded_by) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', uploaderIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      const resourcesWithProfiles = data?.map(r => ({
        ...r,
        profiles: profileMap.get(r.uploaded_by)
      }));

      if (error) throw error;
      setResources(resourcesWithProfiles || []);
      setFilteredResources(resourcesWithProfiles || []);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Failed to load resources',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    let filtered = resources;
    
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.resource_type === typeFilter);
    }
    
    setFilteredResources(filtered);
  }, [searchQuery, categoryFilter, typeFilter, resources]);

  const handleUpload = async () => {
    if (!newResource.title || !newResource.category) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    if (newResource.resource_type === 'link' && !newResource.external_link) {
      toast({ title: 'Please provide a link', variant: 'destructive' });
      return;
    }

    if (newResource.resource_type !== 'link' && !selectedFile) {
      toast({ title: 'Please select a file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      let fileUrl = null;
      let fileName = null;
      let fileSize = null;

      if (selectedFile && newResource.resource_type !== 'link') {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${user?.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('teaching-resources')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('teaching-resources')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
      }

      const tagsArray = newResource.tags.split(',').map(t => t.trim()).filter(Boolean);

      const { error: insertError } = await supabase
        .from('teaching_resources')
        .insert({
          title: newResource.title,
          description: newResource.description || null,
          category: newResource.category,
          resource_type: newResource.resource_type,
          file_url: fileUrl,
          external_link: newResource.resource_type === 'link' ? newResource.external_link : null,
          file_name: fileName,
          file_size: fileSize,
          tags: tagsArray,
          uploaded_by: user!.id
        });

      if (insertError) throw insertError;

      toast({ title: 'Resource uploaded successfully!' });
      setUploadDialogOpen(false);
      setNewResource({
        title: '',
        description: '',
        category: '',
        resource_type: 'link',
        external_link: '',
        tags: ''
      });
      setSelectedFile(null);
      fetchResources();
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    if (resource.external_link) {
      window.open(resource.external_link, '_blank');
    } else if (resource.file_url) {
      window.open(resource.file_url, '_blank');
    }

    // Increment download count
    await supabase
      .from('teaching_resources')
      .update({ download_count: resource.download_count + 1 })
      .eq('id', resource.id);
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Delete this resource?')) return;

    try {
      const { error } = await supabase
        .from('teaching_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({ title: 'Resource deleted' });
      fetchResources();
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg">
                <FolderOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                  Global Resource Library
                </h3>
                <p className="text-muted-foreground">
                  Share and discover teaching resources from educators worldwide
                </p>
              </div>
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Teaching Resource</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newResource.title}
                      onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                      placeholder="Resource title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newResource.description}
                      onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                      placeholder="Brief description of the resource"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={newResource.category} onValueChange={(v) => setNewResource({ ...newResource, category: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent side="bottom">
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Resource Type *</Label>
                      <Select value={newResource.resource_type} onValueChange={(v) => setNewResource({ ...newResource, resource_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="bottom">
                          {RESOURCE_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newResource.resource_type === 'link' ? (
                    <div className="space-y-2">
                      <Label htmlFor="link">External Link *</Label>
                      <Input
                        id="link"
                        type="url"
                        value={newResource.external_link}
                        onChange={(e) => setNewResource({ ...newResource, external_link: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="file">Upload File *</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newResource.tags}
                      onChange={(e) => setNewResource({ ...newResource, tags: e.target.value })}
                      placeholder="e.g., algebra, worksheets, grade 9"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpload} disabled={uploading} className="w-full">
                    {uploading ? 'Uploading...' : 'Upload Resource'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources by title, description, or tags..."
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="all">All Types</SelectItem>
                  {RESOURCE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredResources.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No resources found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => {
            const TypeIcon = RESOURCE_TYPES.find(t => t.value === resource.resource_type)?.icon || File;
            return (
              <Card key={resource.id} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        by {resource.profiles?.first_name} {resource.profiles?.last_name}
                      </p>
                    </div>
                    <TypeIcon className="h-8 w-8 text-primary flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resource.description && (
                    <p className="text-sm text-foreground/80 line-clamp-3">{resource.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{resource.category}</Badge>
                    {resource.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline">{tag}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {resource.download_count} downloads
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleDownload(resource)}>
                        <Download className="h-4 w-4 mr-1" />
                        Get
                      </Button>
                      {resource.uploaded_by === user?.id && (
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(resource.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResourceCenterFull;
