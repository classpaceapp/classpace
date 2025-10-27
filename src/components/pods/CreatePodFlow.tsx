import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, BookOpen, Users, Target, Sparkles } from 'lucide-react';

interface CreatePodFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

const CreatePodFlow: React.FC<CreatePodFlowProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    isPublic: false
  });

  const steps = [
    {
      title: 'Basic Information',
      description: 'Tell us about your new learning pod',
      icon: BookOpen
    },
    {
      title: 'Learning Details',
      description: 'Define the learning goals and structure',
      icon: Target
    },
    {
      title: 'Privacy Settings',
      description: 'Set who can access your pod',
      icon: Users
    },
    {
      title: 'Review & Create',
      description: 'Confirm your pod details',
      icon: Sparkles
    }
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id || !formData.title.trim()) return;

    setLoading(true);
    try {
      const podCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create the pod
      const { error } = await supabase
        .from('pods')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          subject: formData.subject.trim(),
          teacher_id: user.id,
          pod_code: podCode,
          is_public: formData.isPublic
        });

      if (error) throw error;

      toast({
        title: "Pod created successfully!",
        description: `${formData.title} has been created and you're ready to start teaching.`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Error creating pod:', error);
      const msg = error?.message || '';
      const isLimit = /check_pod_limit|RLS|policy/i.test(msg);
      toast({
        title: isLimit ? 'Limit reached on Free plan' : 'Failed to create pod',
        description: isLimit ? 'Free plan allows 1 pod. Upgrade to Premium for unlimited pods.' : (msg || 'Please try again later.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() && formData.subject.trim();
      case 2:
        return formData.description.trim();
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold">
                Pod Name *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Advanced Biology, Intro to Programming"
                className="text-lg h-12"
              />
              <p className="text-sm text-muted-foreground">
                Choose a clear, descriptive name for your learning pod
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-base font-semibold">
                Subject *
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="e.g., Mathematics, Science, Programming"
                className="text-lg h-12"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what students will learn in this pod..."
                rows={6}
                className="resize-none text-base"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Privacy Settings</h3>
              <p className="text-gray-600">Choose who can access your pod</p>
            </div>

            <div className="space-y-4">
              <Card 
                className={`border-2 cursor-pointer transition-all ${formData.isPublic ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => handleInputChange('isPublic', true)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${formData.isPublic ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {formData.isPublic && <div className="w-3 h-3 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-2">Public Pod</h4>
                      <p className="text-muted-foreground">Anyone can discover and join your pod. Great for open courses and community learning.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`border-2 cursor-pointer transition-all ${!formData.isPublic ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => handleInputChange('isPublic', false)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${!formData.isPublic ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {!formData.isPublic && <div className="w-3 h-3 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-2">Private Pod (Recommended)</h4>
                      <p className="text-muted-foreground">Only students with a join code can access. Perfect for classroom settings and controlled groups.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Create Your Pod!</h3>
              <p className="text-gray-600">Review your pod details below</p>
            </div>

            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>{formData.title}</span>
                </CardTitle>
                <CardDescription className="text-base">
                  {formData.subject}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Description</h4>
                  <p className="text-muted-foreground">{formData.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Privacy</h4>
                  <p className="text-muted-foreground">{formData.isPublic ? 'Public - Anyone can join' : 'Private - Join code required'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create New Learning Pod
          </h1>
          <p className="text-xl text-gray-600">
            {steps[currentStep - 1].description}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            const Icon = step.icon;

            return (
              <div key={stepNumber} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-200 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <span className={`text-sm font-medium mt-2 transition-colors ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 rounded transition-colors ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl">
        <CardContent className="p-8">
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !isStepValid()}
                className="px-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {loading ? 'Creating...' : 'Create Pod'}
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePodFlow;