import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, FileText } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const PublicAssessment: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [answers, setAnswers] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (code) fetchAssessment();
  }, [code]);

  const fetchAssessment = async () => {
    if (!code) return;

    const { data, error } = await supabase
      .from('nexus_assessments')
      .select('*')
      .eq('public_link_code', code)
      .single();

    if (error || !data) {
      toast({
        title: "Assessment Not Found",
        description: "This assessment link is invalid or has been deleted",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    setAssessment(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user && !studentName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to submit",
        variant: "destructive"
      });
      return;
    }

    if (!answers.trim()) {
      toast({
        title: "Answers Required",
        description: "Please provide your answers before submitting",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('assessment_responses')
        .insert({
          assessment_id: assessment.id,
          user_id: user?.id || null,
          student_name: user ? null : studentName,
          answers: { response: answers }
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Submitted Successfully!",
        description: "Your responses have been recorded"
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderMathContent = (text: string) => {
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2);
        return <BlockMath key={index} math={math} />;
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1);
        return <InlineMath key={index} math={math} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assessment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-2 border-red-200">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Not Found</h2>
            <p className="text-muted-foreground">This assessment link is invalid or has been deleted</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Submitted Successfully!</h2>
            <p className="text-muted-foreground">Your responses have been recorded. You may now close this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 shadow-2xl mb-6">
          <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">{assessment.title}</CardTitle>
            <CardDescription className="text-violet-100">
              {assessment.assessment_type} • {assessment.num_questions} questions • {assessment.total_marks} marks
            </CardDescription>
            <p className="text-sm text-violet-100 mt-2">
              {assessment.curriculum} • Year {assessment.year_level}
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="whitespace-pre-wrap font-serif leading-relaxed mb-6">
              {renderMathContent(assessment.questions)}
            </div>

            <div className="space-y-4 border-t pt-6">
              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="answers">Your Answers *</Label>
                <Textarea
                  id="answers"
                  placeholder="Type your answers here. Please number your answers to match the questions."
                  value={answers}
                  onChange={(e) => setAnswers(e.target.value)}
                  rows={15}
                  className="font-mono"
                />
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {submitting ? "Submitting..." : "Submit Assessment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicAssessment;