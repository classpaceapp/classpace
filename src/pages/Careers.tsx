import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Briefcase, Instagram, Linkedin, Upload, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Careers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    division: '',
    coverNote: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
      setCvFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.division || !cvFile) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Convert CV to base64
      const reader = new FileReader();
      reader.readAsDataURL(cvFile);
      
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('send-career-application', {
          body: {
            name: formData.name,
            email: formData.email,
            division: formData.division,
            coverNote: formData.coverNote,
            cvBase64: base64,
            cvFilename: cvFile.name,
          },
        });

        if (error) throw error;

        toast({
          title: 'Application submitted!',
          description: "We've received your application and will be in touch soon.",
        });

        // Reset form
        setFormData({ name: '', email: '', division: '', coverNote: '' });
        setCvFile(null);
        (document.getElementById('cv-upload') as HTMLInputElement).value = '';
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Submission failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <button 
              onClick={() => navigate("/")}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <img 
                src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                alt="Classpace Logo" 
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Classpace
              </span>
            </button>
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Briefcase className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Join Our Team
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Help us revolutionize education for the{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
              AI Era
            </span>
          </p>
        </div>

        {/* Application Form */}
        <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.15),transparent_50%)]"></div>
          <CardHeader className="relative border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-purple-400" />
              Career Application
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Tell us about yourself and why you want to join Classpace
            </CardDescription>
          </CardHeader>
          <CardContent className="relative pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white text-base">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white text-base">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                    className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="division" className="text-white text-base">Division of Interest *</Label>
                <Select value={formData.division} onValueChange={(value) => setFormData({ ...formData, division: value })}>
                  <SelectTrigger className="bg-slate-900/50 border-purple-500/30 text-white h-12">
                    <SelectValue placeholder="Select a division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cv-upload" className="text-white text-base">Upload CV (PDF) *</Label>
                <div className="relative">
                  <Input
                    id="cv-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                    className="bg-slate-900/50 border-purple-500/30 text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 h-12"
                  />
                  {cvFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                      <Upload className="h-4 w-4 text-purple-400" />
                      <span>{cvFile.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverNote" className="text-white text-base">Cover Note (Optional)</Label>
                <Textarea
                  id="coverNote"
                  value={formData.coverNote}
                  onChange={(e) => setFormData({ ...formData, coverNote: e.target.value })}
                  placeholder="Tell us why you're excited about joining Classpace..."
                  rows={6}
                  className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 resize-none"
                />
              </div>

              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                  alt="Classpace Logo" 
                  className="w-10 h-10"
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Classpace
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                Empowering educators and learners with AI-powered shared workspaces.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://www.instagram.com/classpace.co/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors"
                >
                  <Instagram className="w-5 h-5 text-white" />
                </a>
                <a 
                  href="https://linkedin.com/company/classpace-app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors"
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6 text-purple-300">Product</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/pricing")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/our-journey")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Our Journey
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/careers")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Careers
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6 text-purple-300">Support</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/support")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/refunds")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Refunds
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6 text-purple-300">Legal</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/terms")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/privacy")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                © 2025 Classpace. All rights reserved.
              </p>
              <p className="text-gray-400 text-sm">
                Built for educators and learners everywhere.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Careers;
