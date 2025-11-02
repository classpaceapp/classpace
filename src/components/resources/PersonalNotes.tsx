import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Loader2, Archive, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PersonalNotesViewer } from "./PersonalNotesViewer";

interface Note {
  id: string;
  title: string;
  curriculum: string;
  topic: string;
  subtopic: string | null;
  additional_details: string | null;
  content: string;
  archived: boolean;
  created_at: string;
}

export const PersonalNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    curriculum: "",
    topic: "",
    subtopic: "",
    additionalDetails: "",
  });

  useEffect(() => {
    fetchNotes();
  }, [showArchived]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("personal_notes")
        .select("*")
        .eq("archived", showArchived)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.title || !formData.curriculum || !formData.topic) {
      toast.error("Please fill in title, curriculum, and topic");
      return;
    }

    // Check limit before calling API
    const activeNotes = notes.filter(note => !note.archived);
    if (activeNotes.length >= 1) {
      setShowLimitMessage(true);
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-personal-notes", {
        body: {
          title: formData.title,
          curriculum: formData.curriculum,
          topic: formData.topic,
          subtopic: formData.subtopic || null,
          additionalDetails: formData.additionalDetails || null,
        },
      });

      if (error) throw error;

      if (data?.error === "LIMIT_REACHED") {
        setShowLimitMessage(true);
        return;
      }

      if (data?.success) {
        toast.success("Notes generated successfully!");
        setFormData({
          title: "",
          curriculum: "",
          topic: "",
          subtopic: "",
          additionalDetails: "",
        });
        setShowForm(false);
        fetchNotes();
      }
    } catch (error: any) {
      console.error("Error generating notes:", error);
      toast.error(error.message || "Failed to generate notes");
    } finally {
      setGenerating(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from("personal_notes")
        .update({ archived: true })
        .eq("id", id);

      if (error) throw error;
      toast.success("Notes archived");
      fetchNotes();
    } catch (error) {
      toast.error("Failed to archive notes");
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from("personal_notes")
        .update({ archived: false })
        .eq("id", id);

      if (error) throw error;
      toast.success("Notes restored");
      fetchNotes();
    } catch (error) {
      toast.error("Failed to restore notes");
    }
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      "from-emerald-500 via-teal-500 to-cyan-500",
      "from-blue-500 via-indigo-500 to-purple-500",
      "from-orange-500 via-amber-500 to-yellow-500",
      "from-pink-500 via-rose-500 to-red-500",
      "from-violet-500 via-purple-500 to-fuchsia-500",
      "from-lime-500 via-green-500 to-emerald-500",
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <Card className="border-2 border-emerald-500/30 shadow-2xl bg-gradient-to-br from-emerald-100/90 via-teal-100/90 to-cyan-100/90 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedNote) {
    return (
      <PersonalNotesViewer
        noteId={selectedNote}
        onClose={() => {
          setSelectedNote(null);
          fetchNotes();
        }}
      />
    );
  }

  return (
    <Card className="border-2 border-border/50 shadow-2xl bg-white/80 backdrop-blur-xl">
      <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                AI Study Notes
              </CardTitle>
              <CardDescription>
                Generate comprehensive study notes with AI-powered web search
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowArchived(!showArchived)}
              variant="outline"
              className="border-2"
            >
              {showArchived ? <Eye className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
              {showArchived ? "View Active" : "View Archived"}
            </Button>
            {!showForm && !showLimitMessage && !showArchived && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Notes
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {showLimitMessage && (
          <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Upgrade for More Notes
                </h3>
                <p className="text-muted-foreground mb-4">
                  You've created 1 note set on the free plan. Upgrade to unlock unlimited note generation and advanced features!
                </p>
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {showForm && !showLimitMessage && (
          <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-2 border-emerald-500/20 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-semibold">Create New Study Notes</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Notes Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Calculus Fundamentals"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="curriculum">Curriculum *</Label>
                <Input
                  id="curriculum"
                  placeholder="e.g., IGCSE, IB, A-Level"
                  value={formData.curriculum}
                  onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Differentiation"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="subtopic">Subtopic (Optional)</Label>
                <Input
                  id="subtopic"
                  placeholder="e.g., Chain Rule"
                  value={formData.subtopic}
                  onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="additionalDetails">Additional Details (Optional)</Label>
                <Textarea
                  id="additionalDetails"
                  placeholder="Specify format preferences: e.g., bullet points, detailed paragraphs, include examples, etc."
                  value={formData.additionalDetails}
                  onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
                  className="bg-background/50 min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Notes
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                disabled={generating}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {notes.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              {showArchived ? "Archived Notes" : "Your Study Notes"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note, index) => (
                <div
                  key={note.id}
                  className="group relative overflow-hidden rounded-xl border-2 border-border/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass(index)} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className="relative p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-lg text-foreground">
                        {note.title}
                      </h4>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{note.curriculum} • {note.topic}</p>
                      {note.subtopic && <p className="text-xs">{note.subtopic}</p>}
                      <p className="text-xs text-emerald-600">
                        Created {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => setSelectedNote(note.id)}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => showArchived ? handleUnarchive(note.id) : handleArchive(note.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !showForm && !showLimitMessage && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {showArchived ? "No archived notes" : "No notes yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {showArchived 
                ? "You haven't archived any notes"
                : "Generate AI-powered study notes to enhance your learning"}
            </p>
            {!showArchived && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Notes
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};