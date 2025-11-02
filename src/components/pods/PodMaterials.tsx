import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AutoFlashcards } from './AutoFlashcards';

interface Material {
  id: string;
  pod_id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  category: 'notes' | 'past_papers' | 'assignments';
  file_url: string;
  file_name: string;
  file_type: string;
  created_at: string;
  submissions?: Submission[];
}

interface Submission {
  id: string;
  material_id: string;
  student_id: string;
  file_url: string;
  file_name: string;
  submitted_at: string;
}

interface PodMaterialsProps {
  podId: string;
  isTeacher: boolean;
}

export const PodMaterials: React.FC<PodMaterialsProps> = ({ podId, isTeacher }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    category: 'notes' as 'notes' | 'past_papers' | 'assignments',
  });
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('pod_materials')
        .select('*')
        .eq('pod_id', podId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch submissions for assignments
      if (data) {
        const materialsWithSubmissions = await Promise.all(
          data.map(async (material) => {
            if (material.category === 'assignments') {
              const { data: submissions } = await supabase
                .from('material_submissions')
                .select('*')
                .eq('material_id', material.id);

              return { ...material, submissions: submissions || [] } as Material;
            }
            return material as Material;
          })
        );
        setMaterials(materialsWithSubmissions);
      }
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'Failed to load materials',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadMaterial = async () => {
    if (!selectedFile || !newMaterial.title.trim() || !user?.id) return;

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${podId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('pod-materials')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pod-materials')
        .getPublicUrl(fileName);

      // Insert material record
      const { error: insertError } = await supabase.from('pod_materials').insert({
        pod_id: podId,
        uploaded_by: user.id,
        title: newMaterial.title.trim(),
        description: newMaterial.description.trim() || null,
        category: newMaterial.category,
        file_url: urlData.publicUrl,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
      });

      if (insertError) throw insertError;

      toast({ title: 'Material uploaded successfully!' });
      setNewMaterial({ title: '', description: '', category: 'notes' });
      setSelectedFile(null);
      setIsDialogOpen(false);
      fetchMaterials();
    } catch (error: any) {
      toast({
        title: 'Failed to upload material',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: 'Failed to download file',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const submitAssignment = async () => {
    if (!submissionFile || !selectedMaterial || !user?.id) return;

    setUploading(true);
    try {
      // Upload submission file
      const fileExt = submissionFile.name.split('.').pop();
      const fileName = `${podId}/submissions/${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('pod-materials')
        .upload(fileName, submissionFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pod-materials')
        .getPublicUrl(fileName);

      // Insert submission record
      const { error: insertError } = await supabase
        .from('material_submissions')
        .insert({
          material_id: selectedMaterial.id,
          student_id: user.id,
          file_url: urlData.publicUrl,
          file_name: submissionFile.name,
          file_type: submissionFile.type,
        });

      if (insertError) throw insertError;

      toast({ title: 'Assignment submitted successfully!' });
      setSubmissionFile(null);
      setSubmissionDialogOpen(false);
      setSelectedMaterial(null);
      fetchMaterials();
    } catch (error: any) {
      toast({
        title: 'Failed to submit assignment',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteMaterial = async (materialId: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/pod-materials/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('pod-materials').remove([filePath]);
      }

      const { error } = await supabase
        .from('pod_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      toast({ title: 'Material deleted successfully!' });
      fetchMaterials();
    } catch (error: any) {
      toast({
        title: 'Failed to delete material',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [podId]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'notes':
        return 'bg-blue-500';
      case 'past_papers':
        return 'bg-green-500';
      case 'assignments':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'notes':
        return 'Notes';
      case 'past_papers':
        return 'Past Papers';
      case 'assignments':
        return 'Assignment';
      default:
        return category;
    }
  };

  const hasSubmitted = (material: Material) => {
    return material.submissions?.some((s) => s.student_id === user?.id);
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Auto Flashcards Module */}
      <AutoFlashcards podId={podId} />

      {/* Learning Materials */}
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5 mt-6">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Learning Materials
            </CardTitle>
            {isTeacher && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                    <Upload className="h-4 w-4" />
                    Upload Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Upload New Material</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title</label>
                      <Input
                        value={newMaterial.title}
                        onChange={(e) =>
                          setNewMaterial({ ...newMaterial, title: e.target.value })
                        }
                        placeholder="Material title..."
                        className="border-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea
                        value={newMaterial.description}
                        onChange={(e) =>
                          setNewMaterial({ ...newMaterial, description: e.target.value })
                        }
                        placeholder="Brief description..."
                        rows={3}
                        className="border-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <Select
                        value={newMaterial.category}
                        onValueChange={(value: any) =>
                          setNewMaterial({ ...newMaterial, category: value })
                        }
                      >
                        <SelectTrigger className="border-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notes">Notes</SelectItem>
                          <SelectItem value="past_papers">Past Papers</SelectItem>
                          <SelectItem value="assignments">Assignment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        File (PDF or Word)
                      </label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="border-primary/20"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={uploadMaterial}
                      disabled={!selectedFile || !newMaterial.title.trim() || uploading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {materials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {isTeacher
                ? 'No materials uploaded yet. Upload your first material!'
                : 'No materials have been shared yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {materials.map((material) => (
                <Card
                  key={material.id}
                  className="border-primary/20 hover:border-primary/40 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getCategoryColor(material.category)} text-white`}>
                            {getCategoryLabel(material.category)}
                          </Badge>
                          <h3 className="font-semibold text-lg">{material.title}</h3>
                          {!isTeacher && material.category === 'assignments' && hasSubmitted(material) && (
                            <Badge className="bg-green-500 text-white gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Submitted
                            </Badge>
                          )}
                        </div>
                        {material.description && (
                          <p className="text-sm text-muted-foreground">
                            {material.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Uploaded {format(new Date(material.created_at), 'MMM d, yyyy')} • {material.file_name}
                        </p>
                        {isTeacher && material.category === 'assignments' && (
                          <p className="text-xs text-primary font-medium">
                            {material.submissions?.length || 0} submission(s)
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadFile(material.file_url, material.file_name)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        {!isTeacher && material.category === 'assignments' && !hasSubmitted(material) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedMaterial(material);
                              setSubmissionDialogOpen(true);
                            }}
                            className="gap-2 bg-primary hover:bg-primary/90"
                          >
                            <Upload className="h-4 w-4" />
                            Submit
                          </Button>
                        )}
                        {isTeacher && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMaterial(material.id, material.file_url)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {isTeacher && material.submissions && material.submissions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-primary/10">
                        <h4 className="text-sm font-semibold mb-2">Submissions:</h4>
                        <div className="space-y-2">
                          {material.submissions.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-2 bg-secondary/50 rounded"
                            >
                              <span className="text-sm">{sub.file_name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadFile(sub.file_url, sub.file_name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Dialog */}
      <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Upload your completed assignment (PDF or Word document)
            </p>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
              className="border-primary/20"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSubmissionDialogOpen(false);
                setSubmissionFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitAssignment}
              disabled={!submissionFile || uploading}
              className="bg-primary hover:bg-primary/90"
            >
              {uploading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
