import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Upload, FileText, Search, Target, Loader2, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const StudentCareers = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('application-builder');
  
  // Application Builder state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [jobRoleUrl, setJobRoleUrl] = useState('');
  const [applicationRequest, setApplicationRequest] = useState('');
  const [generatingApplication, setGeneratingApplication] = useState(false);
  const [applicationResult, setApplicationResult] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Role Search state
  const [searchMode, setSearchMode] = useState<'structured' | 'natural'>('structured');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [naturalQuery, setNaturalQuery] = useState('');
  const [searchingRoles, setSearchingRoles] = useState(false);
  const [roleResults, setRoleResults] = useState('');

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setCvFile(file);
  };

  const typeWriterEffect = async (html: string, setter: (val: string) => void) => {
    // Types HTML by paragraphs so formatting and links stay intact once a paragraph is complete
    setIsTyping(true);

    const stripTags = (s: string) => s.replace(/<[^>]+>/g, '');
    const paragraphs = html.match(/<p[^>]*>.*?<\/p>/gms) || [`<p>${stripTags(html)}</p>`];

    let builtHtml = '';
    for (const paraHtml of paragraphs) {
      const plain = stripTags(paraHtml);
      let typed = '';
      for (let i = 0; i < plain.length; i++) {
        typed += plain[i];
        const current = builtHtml + `<p>${typed}</p>`;
        setter(current);
        await new Promise((r) => setTimeout(r, 16));
      }
      // Replace the typed text paragraph with the final formatted HTML paragraph (with links)
      builtHtml += paraHtml;
      setter(builtHtml);
    }

    setIsTyping(false);
  };

  const handleGenerateApplication = async () => {
    if (!cvFile || !jobRoleUrl || !applicationRequest) {
      toast({
        title: 'Missing information',
        description: 'Please provide your CV, job role URL, and specify what you need',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingApplication(true);
    setApplicationResult('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(cvFile);

      reader.onload = async () => {
        try {
          const cvBase64 = reader.result?.toString().split(',')[1];

          const { data, error } = await supabase.functions.invoke('aurora-application-builder', {
            body: {
              cvBase64,
              cvFilename: cvFile.name,
              linkedinUrl: linkedinUrl || null,
              jobRoleUrl,
              request: applicationRequest,
            },
          });

          if (error) throw error;

          if (data?.result) {
            await typeWriterEffect(data.result, setApplicationResult);
            toast({
              title: 'Application ready!',
              description: 'Aurora has generated your application materials',
            });
          }
        } catch (err: any) {
          console.error('Error generating application:', err);
          toast({
            title: 'Generation failed',
            description: err.message || 'Please try again',
            variant: 'destructive',
          });
        } finally {
          setGeneratingApplication(false);
        }
      };

      reader.onerror = () => {
        setGeneratingApplication(false);
        toast({
          title: 'Failed to read CV',
          description: 'Please try again',
          variant: 'destructive',
        });
      };
    } catch (err: any) {
      setGeneratingApplication(false);
      toast({
        title: 'Error',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleRoleSearch = async () => {
    if (searchMode === 'structured' && (!industry || !location)) {
      toast({
        title: 'Missing information',
        description: 'Please select both industry and location',
        variant: 'destructive',
      });
      return;
    }

    if (searchMode === 'natural' && !naturalQuery) {
      toast({
        title: 'Missing information',
        description: 'Please describe what you\'re looking for',
        variant: 'destructive',
      });
      return;
    }

    setSearchingRoles(true);
    setRoleResults('');

    try {
      const { data, error } = await supabase.functions.invoke('aurora-role-search', {
        body: {
          mode: searchMode,
          industry: searchMode === 'structured' ? industry : undefined,
          location: searchMode === 'structured' ? location : undefined,
          naturalQuery: searchMode === 'natural' ? naturalQuery : undefined,
        },
      });

      if (error) throw error;

      if (data?.result) {
        await typeWriterEffect(data.result, setRoleResults);
        toast({
          title: 'Search complete!',
          description: 'Aurora found matching opportunities',
        });
      }
    } catch (err: any) {
      console.error('Error searching roles:', err);
      toast({
        title: 'Search failed',
        description: err.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSearchingRoles(false);
    }
  };

  return (
    <DashboardLayout userRole="learner">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 blur-2xl opacity-40" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-10 h-10 text-white animate-[spin_8s_linear_infinite]" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Careers Toolkit
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powered by{' '}
            <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Aurora
            </span>
            {' '}— Your intelligent career companion
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-16 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 p-2 rounded-2xl">
            <TabsTrigger 
              value="application-builder" 
              className="gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-xl rounded-xl transition-all duration-300 font-semibold"
            >
              <FileText className="h-5 w-5" />
              Application Builder
            </TabsTrigger>
            <TabsTrigger 
              value="role-search" 
              className="gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-xl rounded-xl transition-all duration-300 font-semibold"
            >
              <Search className="h-5 w-5" />
              Role Search
            </TabsTrigger>
            <TabsTrigger 
              value="interview-prep" 
              className="gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-xl rounded-xl transition-all duration-300 font-semibold"
            >
              <Target className="h-5 w-5" />
              Interview Prep
            </TabsTrigger>
          </TabsList>

          {/* Application Builder */}
          <TabsContent value="application-builder" className="space-y-6">
            <Card className="border-2 border-emerald-400/30 shadow-2xl bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/50 dark:from-gray-950 dark:via-emerald-950/20 dark:to-teal-950/20">
              <CardHeader className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40 border-b-2 border-emerald-200 dark:border-emerald-800">
                <CardTitle className="flex items-center gap-3 text-3xl font-extrabold">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  Application Builder
                </CardTitle>
                <CardDescription className="text-base mt-2 text-muted-foreground">
                  Upload your CV and job details — Aurora will craft perfect cover letters and application responses
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cv-upload" className="text-base font-semibold">Your CV (PDF) *</Label>
                  <div className="relative">
                    <Input
                      id="cv-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleCvUpload}
                      className="cursor-pointer h-12 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 dark:file:bg-emerald-950 dark:file:text-emerald-300"
                    />
                    {cvFile && (
                      <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <Upload className="h-5 w-5 text-emerald-600" />
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">{cvFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin-url" className="text-base font-semibold">LinkedIn Profile (Optional)</Label>
                  <Input
                    id="linkedin-url"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/your-profile"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job-role-url" className="text-base font-semibold">Job Role Link *</Label>
                  <Input
                    id="job-role-url"
                    type="url"
                    value={jobRoleUrl}
                    onChange={(e) => setJobRoleUrl(e.target.value)}
                    placeholder="https://company.com/careers/role"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="request" className="text-base font-semibold">What do you need? *</Label>
                  <Textarea
                    id="request"
                    value={applicationRequest}
                    onChange={(e) => setApplicationRequest(e.target.value)}
                    placeholder="E.g., 'Write a compelling cover letter' or 'Answer these application questions: [paste questions]'"
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleGenerateApplication}
                  disabled={generatingApplication || isTyping}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
                >
                  {generatingApplication ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                      Aurora is working...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6 mr-2" />
                      Generate with Aurora
                    </>
                  )}
                </Button>

                {applicationResult && (
                  <Card className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 border-2 border-emerald-300 dark:border-emerald-700 shadow-2xl">
                    <CardHeader className="bg-gradient-to-r from-emerald-100/50 via-teal-100/50 to-cyan-100/50 dark:from-emerald-950/50 dark:via-teal-950/50 dark:to-cyan-950/50">
                      <CardTitle className="text-emerald-700 dark:text-emerald-300 flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        Aurora's Response
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div 
                        className="prose prose-lg dark:prose-invert max-w-none [&_a]:text-teal-600 [&_a]:hover:text-teal-700 [&_a]:underline [&_a]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: applicationResult }}
                      />
                      {!isTyping && (
                        <Button
                          variant="outline"
                          className="mt-6 border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 font-semibold"
                          onClick={() => {
                            navigator.clipboard.writeText(applicationResult.replace(/<[^>]*>/g, ''));
                            toast({ title: 'Copied!', description: 'Response copied to clipboard' });
                          }}
                        >
                          Copy to Clipboard
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role Search */}
          <TabsContent value="role-search" className="space-y-6">
            <Card className="border-2 border-teal-400/30 shadow-2xl bg-gradient-to-br from-white via-teal-50/50 to-cyan-50/50 dark:from-gray-950 dark:via-teal-950/20 dark:to-cyan-950/20">
              <CardHeader className="bg-gradient-to-r from-teal-100 via-cyan-100 to-blue-100 dark:from-teal-950/40 dark:via-cyan-950/40 dark:to-blue-950/40 border-b-2 border-teal-200 dark:border-teal-800">
                <CardTitle className="flex items-center gap-3 text-3xl font-extrabold">
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl shadow-lg">
                    <Search className="h-7 w-7 text-white" />
                  </div>
                  Role Search
                </CardTitle>
                <CardDescription className="text-base mt-2 text-muted-foreground">
                  Tell Aurora what you're looking for — get perfectly matched opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex gap-4">
                  <Button
                    variant={searchMode === 'structured' ? 'default' : 'outline'}
                    onClick={() => setSearchMode('structured')}
                    className="flex-1"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Structured Search
                  </Button>
                  <Button
                    variant={searchMode === 'natural' ? 'default' : 'outline'}
                    onClick={() => setSearchMode('natural')}
                    className="flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Natural Language
                  </Button>
                </div>

                {searchMode === 'structured' ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Industry *</Label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Location *</Label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., London, UK"
                        className="h-11"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Describe what you're looking for *</Label>
                    <Textarea
                      value={naturalQuery}
                      onChange={(e) => setNaturalQuery(e.target.value)}
                      placeholder="E.g., 'I'm looking for software engineering roles in London for someone with a UK work visa, interested in AI and machine learning'"
                      rows={5}
                      className="resize-none"
                    />
                  </div>
                )}

                <Button
                  onClick={handleRoleSearch}
                  disabled={searchingRoles || isTyping}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-700 hover:via-cyan-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
                >
                  {searchingRoles ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                      Aurora is searching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6 mr-2" />
                      Search with Aurora
                    </>
                  )}
                </Button>

                {roleResults && (
                  <Card className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-teal-950/30 dark:via-cyan-950/30 dark:to-blue-950/30 border-2 border-teal-300 dark:border-teal-700 shadow-2xl">
                    <CardHeader className="bg-gradient-to-r from-teal-100/50 via-cyan-100/50 to-blue-100/50 dark:from-teal-950/50 dark:via-cyan-950/50 dark:to-blue-950/50">
                      <CardTitle className="text-teal-700 dark:text-teal-300 flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        Aurora's Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div 
                        className="prose prose-lg dark:prose-invert max-w-none [&_a]:text-teal-600 [&_a]:hover:text-teal-700 [&_a]:underline [&_a]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: roleResults }}
                      />
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interview Prep */}
          <TabsContent value="interview-prep">
            <Card className="border-2 border-blue-400/30 shadow-2xl bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/20">
              <CardHeader className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border-b-2 border-blue-200 dark:border-blue-800">
                <CardTitle className="flex items-center gap-3 text-3xl font-extrabold">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  Interview Prep
                </CardTitle>
                <CardDescription className="text-base mt-2 text-muted-foreground">
                  Coming Soon — Comprehensive interview preparation powered by Aurora
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="text-center py-16">
                  <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 rounded-2xl mb-6 shadow-lg">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-xl text-blue-700 dark:text-blue-300">Coming Soon</span>
                  </div>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Aurora will soon help you prepare for interviews with personalized coaching and practice sessions
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StudentCareers;
