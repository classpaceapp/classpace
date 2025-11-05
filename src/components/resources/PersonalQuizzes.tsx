import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Plus, Loader2, Archive, Eye, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface PersonalQuiz {
  id: string;
  title: string;
  curriculum: string | null;
  year_level: string | null;
  subject: string | null;
  topic: string | null;
  subtopic: string | null;
  quiz_type: string;
  questions: any[];
  archived: boolean;
  created_at: string;
}

export const PersonalQuizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<PersonalQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [quizType, setQuizType] = useState<"mcq" | "essay">("mcq");

  const [formData, setFormData] = useState({
    title: "",
    curriculum: "",
    yearLevel: "",
    subject: "",
    topic: "",
    subtopic: "",
  });

  useEffect(() => {
    fetchQuizzes();
  }, [showArchived]);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from("personal_quizzes")
        .select("*")
        .eq("archived", showArchived)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizzes((data as PersonalQuiz[]) || []);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.title || !formData.curriculum || !formData.subject || !formData.topic) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check limit before calling API
    const activeQuizzes = quizzes.filter(q => !q.archived);
    if (activeQuizzes.length >= 1) {
      setShowLimitMessage(true);
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-personal-quiz", {
        body: {
          curriculum: formData.curriculum,
          yearLevel: formData.yearLevel || null,
          subject: formData.subject,
          topic: formData.topic,
          subtopic: formData.subtopic || null,
          quizType,
        },
      });

      if (error) throw error;

      if (data?.error === "quiz_limit_reached") {
        setShowLimitMessage(true);
        return;
      }

      if (data?.questions) {
        // Save quiz to database
        const { error: saveError } = await supabase
          .from("personal_quizzes")
          .insert({
            user_id: user?.id,
            title: formData.title,
            curriculum: formData.curriculum,
            year_level: formData.yearLevel || null,
            subject: formData.subject,
            topic: formData.topic,
            subtopic: formData.subtopic || null,
            quiz_type: quizType,
            questions: data.questions,
          });

        if (saveError) throw saveError;

        toast.success("Quiz generated successfully!");
        setFormData({
          title: "",
          curriculum: "",
          yearLevel: "",
          subject: "",
          topic: "",
          subtopic: "",
        });
        setShowForm(false);
        fetchQuizzes();
      }
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      
      // Graceful error handling
      let errorMessage = "Failed to generate quiz";
      
      if (error?.message?.includes('INPUT_TOO_LONG') || error?.message?.includes('too long')) {
        errorMessage = "Topic too detailed. Please simplify to under 100 words.";
      } else if (error?.message?.includes('RATE_LIMIT') || error?.message?.includes('429')) {
        errorMessage = "Too many requests. Please wait before generating another quiz.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from("personal_quizzes")
        .update({ archived: true })
        .eq("id", id);

      if (error) throw error;
      toast.success("Quiz archived");
      fetchQuizzes();
    } catch (error) {
      toast.error("Failed to archive quiz");
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from("personal_quizzes")
        .update({ archived: false })
        .eq("id", id);

      if (error) throw error;
      toast.success("Quiz restored");
      fetchQuizzes();
    } catch (error) {
      toast.error("Failed to restore quiz");
    }
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      "from-blue-500 via-cyan-500 to-teal-500",
      "from-purple-500 via-pink-500 to-rose-500",
      "from-orange-500 via-red-500 to-pink-500",
      "from-green-500 via-emerald-500 to-teal-500",
      "from-indigo-500 via-purple-500 to-pink-500",
      "from-yellow-500 via-orange-500 to-red-500",
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <Card className="border-2 border-blue-500/30 shadow-2xl bg-gradient-to-br from-blue-100/90 via-cyan-100/90 to-teal-100/90 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border/50 shadow-2xl bg-white/80 backdrop-blur-xl">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                AI Quiz Generator
              </CardTitle>
              <CardDescription>
                Create personalized quizzes with AI-powered web search
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
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Quiz
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
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Upgrade for More Quizzes
                </h3>
                <p className="text-muted-foreground mb-4">
                  You've created 1 quiz on the free plan. Upgrade to unlock unlimited quiz generation and advanced features!
                </p>
                <Button
                  onClick={() => window.location.href = "/my-plan"}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {showForm && !showLimitMessage && (
          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-2 border-blue-500/20 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Create New Quiz</h3>
            </div>

            <div className="mb-4">
              <Label className="mb-2 block">Quiz Type *</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={quizType === "mcq" ? "default" : "outline"}
                  onClick={() => setQuizType("mcq")}
                  className={quizType === "mcq" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" : ""}
                >
                  Multiple Choice
                </Button>
                <Button
                  type="button"
                  variant={quizType === "essay" ? "default" : "outline"}
                  onClick={() => setQuizType("essay")}
                  className={quizType === "essay" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" : ""}
                >
                  Essay Questions
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Chemistry Final Prep"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="curriculum">Curriculum *</Label>
                <Input
                  id="curriculum"
                  placeholder="e.g., IGCSE, IB, A-Level, CBSE, ICSE"
                  value={formData.curriculum}
                  onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearLevel">Year Level</Label>
                <Input
                  id="yearLevel"
                  placeholder="e.g., Year 10, Grade 11, Undergraduate"
                  value={formData.yearLevel}
                  onChange={(e) => setFormData({ ...formData, yearLevel: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Chemistry, Physics"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Organic Chemistry"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtopic">Subtopic (Optional)</Label>
                <Input
                  id="subtopic"
                  placeholder="e.g., Alkanes"
                  value={formData.subtopic}
                  onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Generate Quiz
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

        {quizzes.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-500" />
              {showArchived ? "Archived Quizzes" : "Your Quizzes"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  className="group relative overflow-hidden rounded-xl border-2 border-border/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass(index)} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className="relative p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-lg text-foreground">
                        {quiz.title}
                      </h4>
                      <div className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {quiz.quiz_type === "mcq" ? "MCQ" : "Essay"}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{quiz.curriculum} • {quiz.subject}</p>
                      <p className="text-xs">{quiz.topic}</p>
                      <p className="text-xs font-medium text-blue-600">
                        {quiz.questions.length} questions
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Take Quiz
                      </Button>
                      <Button
                        onClick={() => showArchived ? handleUnarchive(quiz.id) : handleArchive(quiz.id)}
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
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
              <FileQuestion className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {showArchived ? "No archived quizzes" : "No quizzes yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {showArchived 
                ? "You haven't archived any quizzes"
                : "Generate AI-powered quizzes to test your knowledge"}
            </p>
            {!showArchived && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Quiz
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
