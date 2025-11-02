import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Plus, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FlashcardViewer } from "./FlashcardViewer";
import { useAuth } from "@/contexts/AuthContext";

interface FlashcardSet {
  id: string;
  title: string;
  curriculum: string;
  topic: string;
  subtopic: string | null;
  card_count: number;
  created_at: string;
  created_by: string;
}

interface AutoFlashcardsProps {
  podId: string;
}

export const AutoFlashcards = ({ podId }: AutoFlashcardsProps) => {
  const { user, profile } = useAuth();
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [showLimitMessage, setShowLimitMessage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    curriculum: "",
    topic: "",
    subtopic: "",
    cardCount: "10",
  });

  const isTeacher = profile?.role === "teacher";
  const limit = isTeacher ? 1 : 6;

  useEffect(() => {
    fetchFlashcards();
  }, [podId]);

  const fetchFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from("pod_flashcards")
        .select("*")
        .eq("pod_id", podId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlashcardSets(data || []);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      toast.error("Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.title || !formData.curriculum || !formData.topic || !formData.cardCount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const cardCount = parseInt(formData.cardCount);
    if (cardCount < 1 || cardCount > 20) {
      toast.error("Card count must be between 1 and 20");
      return;
    }

    // Check limit before calling API
    const userFlashcards = flashcardSets.filter(set => set.created_by === user?.id);
    if (userFlashcards.length >= limit) {
      setShowLimitMessage(true);
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: {
          title: formData.title,
          curriculum: formData.curriculum,
          topic: formData.topic,
          subtopic: formData.subtopic || null,
          cardCount,
          podId,
        },
      });

      if (error) throw error;

      if (data?.error === "LIMIT_REACHED") {
        setShowLimitMessage(true);
        return;
      }

      if (data?.success) {
        toast.success("Flashcards generated successfully!");
        setFormData({
          title: "",
          curriculum: "",
          topic: "",
          subtopic: "",
          cardCount: "10",
        });
        setShowForm(false);
        fetchFlashcards();
      }
    } catch (error: any) {
      console.error("Error generating flashcards:", error);
      toast.error(error.message || "Failed to generate flashcards");
    } finally {
      setGenerating(false);
    }
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      "from-purple-500 via-pink-500 to-rose-500",
      "from-blue-500 via-cyan-500 to-teal-500",
      "from-orange-500 via-red-500 to-pink-500",
      "from-green-500 via-emerald-500 to-teal-500",
      "from-indigo-500 via-purple-500 to-pink-500",
      "from-yellow-500 via-orange-500 to-red-500",
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedSet) {
    return (
      <FlashcardViewer
        flashcardSetId={selectedSet}
        onClose={() => setSelectedSet(null)}
      />
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Flashcards
              </CardTitle>
              <CardDescription>
                Generate intelligent flashcards with AI-powered web search
              </CardDescription>
            </div>
          </div>
          {!showForm && !showLimitMessage && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Flashcards
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {showLimitMessage && (
          <div className="p-6 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isTeacher ? "Upgrade to Generate More Flashcards" : "Upgrade for More Flashcards"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isTeacher
                    ? "You've created 1 flashcard set on the free plan. Upgrade to unlock unlimited flashcard generation and advanced features!"
                    : "You've reached your limit of 6 flashcard sets. Upgrade to create unlimited flashcards and unlock premium features!"}
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
          <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold">Create New Flashcard Set</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Flashcard Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Algebra Basics"
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
                  placeholder="e.g., Quadratic Equations"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtopic">Subtopic (Optional)</Label>
                <Input
                  id="subtopic"
                  placeholder="e.g., Factoring"
                  value={formData.subtopic}
                  onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardCount">Number of Cards (1-20) *</Label>
                <Input
                  id="cardCount"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.cardCount}
                  onChange={(e) => setFormData({ ...formData, cardCount: e.target.value })}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Flashcards
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

        {flashcardSets.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Your Flashcard Sets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcardSets.map((set, index) => (
                <button
                  key={set.id}
                  onClick={() => setSelectedSet(set.id)}
                  className="group relative overflow-hidden rounded-lg border border-border/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 text-left"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass(index)} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className="relative p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-lg text-foreground group-hover:text-purple-600 transition-colors">
                        {set.title}
                      </h4>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{set.curriculum} • {set.topic}</p>
                      {set.subtopic && <p className="text-xs">{set.subtopic}</p>}
                      <p className="text-xs font-medium text-purple-600">
                        {set.card_count} cards
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : !showForm && !showLimitMessage && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No flashcards yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Generate AI-powered flashcards to enhance your learning
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Set
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
