import { useState } from "react";
import { DocumentationSlide } from "./DocumentationSlide";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Home, LogIn, GraduationCap, Boxes, Bot, BookOpen, Crown, User, MessageSquare, FileText, PenTool } from "lucide-react";

const slides = [
  {
    icon: Home,
    title: "Getting Started",
    description: "Welcome to LearnSpace - Your AI-Powered Learning Platform",
    gradient: "from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10",
    content: (
      <div className="space-y-6">
        <p>
          LearnSpace is designed to revolutionize your learning experience with AI-powered tools and collaborative features.
        </p>
        <div className="bg-muted/50 rounded-xl p-6 space-y-4">
          <h3 className="text-2xl font-bold">Key Features:</h3>
          <ul className="space-y-3 ml-4">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>Phoenix AI Tutor:</strong> Get instant help with homework and concepts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>Interactive Classes:</strong> Join teacher-created pods with rich materials</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>Collaborative Tools:</strong> Chat, notes, and whiteboards for group work</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>Progress Tracking:</strong> Monitor your learning journey</span>
            </li>
          </ul>
        </div>
      </div>
    )
  },
  {
    icon: LogIn,
    title: "Creating Your Account",
    description: "Sign up and set up your student profile",
    gradient: "from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10",
    content: (
      <div className="space-y-6">
        <div className="bg-muted/50 rounded-xl p-6 space-y-4">
          <h3 className="text-2xl font-bold">Step-by-Step:</h3>
          <ol className="space-y-4 ml-4">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">1.</span>
              <div>
                <strong>Navigate to Sign Up:</strong> Click the "Sign Up" button on the login page
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">2.</span>
              <div>
                <strong>Select "I'm a Student":</strong> Choose your role during registration
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">3.</span>
              <div>
                <strong>Enter Details:</strong> Provide your first name, last name, email, and create a password
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">4.</span>
              <div>
                <strong>Verify Email:</strong> Check your inbox and click the verification link (auto-confirmed in test mode)
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">5.</span>
              <div>
                <strong>Complete Profile:</strong> Add additional information in your profile settings
              </div>
            </li>
          </ol>
        </div>
        <p className="text-muted-foreground italic">
          💡 Tip: Use a valid email address to receive important notifications about your classes
        </p>
      </div>
    )
  },
  {
    icon: GraduationCap,
    title: "Your Dashboard",
    description: "Navigate your learning hub",
    gradient: "from-pink-500/5 to-orange-500/5 dark:from-pink-500/10 dark:to-orange-500/10",
    content: (
      <div className="space-y-6">
        <p>
          Your student dashboard is your command center for all learning activities.
        </p>
        <div className="grid gap-4">
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Boxes className="w-5 h-5 text-primary" />
              My Classes Section
            </h3>
            <p>View all classes you're enrolled in. Click any class to access materials, chat, and assignments.</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Phoenix AI Tutor
            </h3>
            <p>Quick access to your AI tutor for instant homework help and explanations.</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Subscription Status
            </h3>
            <p>Monitor your Learn+ subscription and upgrade for unlimited AI tutoring.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Boxes,
    title: "Joining Classes (Pods)",
    description: "Connect with your teachers and classmates",
    gradient: "from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10",
    content: (
      <div className="space-y-6">
        <div className="bg-muted/50 rounded-xl p-6 space-y-4">
          <h3 className="text-2xl font-bold">How to Join a Class:</h3>
          <ol className="space-y-4 ml-4">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">1.</span>
              <div>
                <strong>Get the Pod Code:</strong> Your teacher will share a unique 6-character code
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">2.</span>
              <div>
                <strong>Navigate to Pods:</strong> Click "Pods" in the left sidebar
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">3.</span>
              <div>
                <strong>Click "Join Pod":</strong> Find the button in the top-right corner
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">4.</span>
              <div>
                <strong>Enter Code:</strong> Type in the 6-character code and submit
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">5.</span>
              <div>
                <strong>Access Content:</strong> You'll instantly see the class materials and can start participating
              </div>
            </li>
          </ol>
        </div>
        <p className="text-muted-foreground italic">
          💡 Tip: You can join multiple pods from different teachers
        </p>
      </div>
    )
  },
  {
    icon: Bot,
    title: "Phoenix AI Tutor",
    description: "Your 24/7 intelligent learning companion",
    gradient: "from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10",
    content: (
      <div className="space-y-6">
        <p>
          Phoenix is your personal AI tutor, available anytime to help you understand concepts and solve problems.
        </p>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-3">Text-Based Help:</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Type questions in natural language</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Upload images of homework problems</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Get step-by-step explanations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Request practice problems</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-3">Voice Interaction:</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Click the microphone icon to speak</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Phoenix will respond with voice and text</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Perfect for hands-free learning</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="bg-primary/10 border-l-4 border-primary rounded-xl p-5">
          <p className="font-semibold">
            📚 Free tier: 5 questions per day | Learn+ tier: Unlimited questions
          </p>
        </div>
      </div>
    )
  },
  {
    icon: BookOpen,
    title: "Learnspace Features",
    description: "Study materials, notes, and collaboration tools",
    gradient: "from-green-500/5 to-teal-500/5 dark:from-green-500/10 dark:to-teal-500/10",
    content: (
      <div className="space-y-6">
        <p>Each pod you join has multiple tabs with different tools:</p>
        <div className="grid gap-4">
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Materials Tab
            </h3>
            <p>Access all course materials uploaded by your teacher. Download PDFs, view images, and access external links.</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Chat Tab
            </h3>
            <p>Real-time messaging with classmates. Ask questions, share insights, and collaborate on assignments.</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary" />
              Notes Tab
            </h3>
            <p>Create personal or shared notes. Rich text editor with formatting options to organize your learning.</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary" />
              Whiteboard Tab
            </h3>
            <p>Collaborative drawing and diagramming tool. Perfect for visual learning and group problem-solving.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Crown,
    title: "Learn+ Subscription",
    description: "Unlock premium features for enhanced learning",
    gradient: "from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10",
    content: (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border-2 border-purple-500/30">
          <h3 className="text-2xl font-bold mb-4">Learn+ Benefits ($7/month)</h3>
          <ul className="space-y-3 ml-4">
            <li className="flex items-start gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
              <span><strong>Unlimited AI Tutoring:</strong> Ask Phoenix as many questions as you need</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
              <span><strong>Advanced Image Analysis:</strong> Upload complex diagrams and graphs for detailed explanations</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
              <span><strong>Personalized Learning Insights:</strong> Track your progress and get customized recommendations</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
              <span><strong>Priority Support:</strong> Get help faster when you need it</span>
            </li>
          </ul>
        </div>
        <div className="bg-muted/50 rounded-xl p-5">
          <h3 className="text-xl font-bold mb-3">How to Subscribe:</h3>
          <ol className="space-y-2 ml-4">
            <li>1. Go to "My Plan" in the left sidebar</li>
            <li>2. Click "Upgrade to Learn+"</li>
            <li>3. Complete payment through secure Stripe checkout</li>
            <li>4. Start using unlimited features immediately</li>
          </ol>
        </div>
        <p className="text-muted-foreground italic">
          💡 Cancel anytime - you'll retain access until the end of your billing period
        </p>
      </div>
    )
  },
  {
    icon: User,
    title: "Profile & Settings",
    description: "Customize your learning experience",
    gradient: "from-orange-500/5 to-red-500/5 dark:from-orange-500/10 dark:to-red-500/10",
    content: (
      <div className="space-y-6">
        <p>Access your profile by clicking your name in the sidebar.</p>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-3">Profile Settings:</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Update Personal Info:</strong> Change your name, bio, and contact details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Avatar:</strong> Upload a profile picture</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Theme:</strong> Switch between light and dark mode</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Notifications:</strong> Manage email and in-app notifications</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-3">Security:</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Change Password:</strong> Update your password regularly for security</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Sign Out:</strong> Log out from all devices or just the current one</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
];

interface StudentDocumentationProps {
  onBack: () => void;
}

export const StudentDocumentation = ({ onBack }: StudentDocumentationProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };
  
  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };
  
  const progress = ((currentSlide + 1) / slides.length) * 100;
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Change Role
            </Button>
            <div className="text-sm font-medium text-muted-foreground">
              Section {currentSlide + 1} of {slides.length}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
      
      {/* Slide Content */}
      <div className="flex-1">
        <DocumentationSlide {...slides[currentSlide]} />
      </div>
      
      {/* Navigation Footer */}
      <div className="bg-card/50 backdrop-blur-sm border-t border-border sticky bottom-0">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-primary w-8' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            <Button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
