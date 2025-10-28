import { useState } from "react";
import { DocumentationSlide } from "./DocumentationSlide";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Home, LogIn, BookOpen, Boxes, Bot, Users, Crown, User, Upload, MessageSquare, BarChart } from "lucide-react";

const slides = [
  {
    icon: Home,
    title: "Getting Started",
    description: "Welcome to Classpace for Teachers",
    gradient: "from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10",
    content: (
      <div className="space-y-6">
        <p>
          Classpace empowers educators with AI-assisted teaching tools and collaborative learning environments.
        </p>
        <div className="bg-muted/50 rounded-xl p-6 space-y-4">
          <h3 className="text-2xl font-bold">Key Features for Teachers:</h3>
          <ul className="space-y-3 ml-4">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>Create Unlimited Pods:</strong> Set up virtual classrooms for different subjects or groups</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>AI Teaching Assistant:</strong> Get help creating materials and managing classes</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>Student Management:</strong> Track enrollment and monitor engagement</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>Rich Content Tools:</strong> Share materials, facilitate discussions, and collaborate</span>
            </li>
          </ul>
        </div>
      </div>
    )
  },
  {
    icon: LogIn,
    title: "Creating Your Account",
    description: "Sign up and set up your teacher profile",
    gradient: "from-cyan-500/5 to-blue-500/5 dark:from-cyan-500/10 dark:to-blue-500/10",
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
                <strong>Select "I'm a Teacher":</strong> Choose your role during registration
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
                <strong>Verify Email:</strong> Confirm your account (auto-confirmed in test mode)
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">5.</span>
              <div>
                <strong>Complete Profile:</strong> Add your teaching credentials and bio
              </div>
            </li>
          </ol>
        </div>
        <p className="text-muted-foreground italic">
          💡 Tip: Use your school email address for easier verification
        </p>
      </div>
    )
  },
  {
    icon: BookOpen,
    title: "Your Teacher Dashboard",
    description: "Command center for all your teaching activities",
    gradient: "from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10",
    content: (
      <div className="space-y-6">
        <p>
          Your teacher dashboard provides an overview of all your pods and quick access to key features.
        </p>
        <div className="grid gap-4">
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Boxes className="w-5 h-5 text-primary" />
              My Pods Section
            </h3>
            <p>View all your created pods. Each card shows the number of enrolled students and the pod code for easy sharing.</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Teaching Assistant
            </h3>
            <p>Access the AI Teaching Assistant to help create lesson plans, generate materials, and get teaching insights.</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              Quick Stats
            </h3>
            <p>Monitor total students across all pods and track engagement at a glance.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Boxes,
    title: "Creating Pods (Classes)",
    description: "Set up virtual classrooms for your students",
    gradient: "from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10",
    content: (
      <div className="space-y-6">
        <div className="bg-muted/50 rounded-xl p-6 space-y-4">
          <h3 className="text-2xl font-bold">How to Create a Pod:</h3>
          <ol className="space-y-4 ml-4">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">1.</span>
              <div>
                <strong>Click "Create Pod":</strong> Find the button on your dashboard or in the Pods section
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">2.</span>
              <div>
                <strong>Enter Pod Details:</strong>
                <ul className="mt-2 space-y-1 ml-4">
                  <li>• Pod Name (e.g., "Advanced Calculus 2025")</li>
                  <li>• Description (brief overview of the course)</li>
                  <li>• Subject/Topic</li>
                </ul>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">3.</span>
              <div>
                <strong>Set Visibility:</strong> Choose between public (discoverable) or private (invite-only)
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">4.</span>
              <div>
                <strong>Generate Pod Code:</strong> A unique 6-character code is automatically created
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl">5.</span>
              <div>
                <strong>Share with Students:</strong> Distribute the pod code via email, LMS, or in-class
              </div>
            </li>
          </ol>
        </div>
        <div className="bg-primary/10 border-l-4 border-primary rounded-xl p-5">
          <p className="font-semibold">
            📚 Free tier: 1 pod | Teach+ tier: Unlimited pods
          </p>
        </div>
      </div>
    )
  },
  {
    icon: Upload,
    title: "Managing Pod Content",
    description: "Upload and organize learning materials",
    gradient: "from-pink-500/5 to-orange-500/5 dark:from-pink-500/10 dark:to-orange-500/10",
    content: (
      <div className="space-y-6">
        <p>Each pod has multiple tabs for different types of content and interaction.</p>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-3">Materials Tab:</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Upload Files:</strong> PDFs, images, presentations (max 50MB per file)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Add Links:</strong> YouTube videos, articles, external resources</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Organize:</strong> Materials appear in chronological order</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Delete/Update:</strong> Remove or replace outdated content anytime</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-3">Best Practices:</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Use clear, descriptive file names</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Organize materials by unit or week</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Add announcements in the chat when posting new content</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Users,
    title: "Student Management",
    description: "Monitor enrollment and engagement",
    gradient: "from-green-500/5 to-teal-500/5 dark:from-green-500/10 dark:to-teal-500/10",
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-3">Student Roster:</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>View All Students:</strong> See complete list of enrolled learners in each pod</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Join Dates:</strong> Track when students enrolled</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Activity Status:</strong> Monitor last active timestamps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Remove Students:</strong> Remove students if needed (with confirmation)</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-3">Communication:</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Pod Chat:</strong> Message all students at once via the chat tab</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Announcements:</strong> Pin important messages to the top</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Direct Feedback:</strong> Respond to student questions in real-time</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: MessageSquare,
    title: "Collaboration Tools",
    description: "Chat, notes, and whiteboards for interactive learning",
    gradient: "from-teal-500/5 to-blue-500/5 dark:from-teal-500/10 dark:to-blue-500/10",
    content: (
      <div className="space-y-6">
        <div className="grid gap-4">
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold">Chat Tab</h3>
            <p>Real-time messaging for Q&A, discussions, and announcements. Messages are visible to all pod members.</p>
            <ul className="space-y-1 ml-4 mt-2 text-sm">
              <li>• Support text formatting and emojis</li>
              <li>• Messages persist across sessions</li>
              <li>• Students can interact with each other</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold">Notes Tab</h3>
            <p>Collaborative note-taking with rich text editor. Create shared notes or let students maintain personal notes.</p>
            <ul className="space-y-1 ml-4 mt-2 text-sm">
              <li>• Full formatting support (bold, italic, lists, headings)</li>
              <li>• Auto-save functionality</li>
              <li>• Great for lecture notes and summaries</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 space-y-2">
            <h3 className="text-xl font-bold">Whiteboard Tab</h3>
            <p>Interactive drawing canvas for visual explanations. Perfect for math, science, and design courses.</p>
            <ul className="space-y-1 ml-4 mt-2 text-sm">
              <li>• Drawing tools, shapes, and text</li>
              <li>• Collaborative editing in real-time</li>
              <li>• Export as images for reference</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Bot,
    title: "AI Teaching Assistant",
    description: "AI Teaching Assistant for educators",
    gradient: "from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10",
    content: (
      <div className="space-y-6">
        <p>
          Use the AI Teaching Assistant to enhance your teaching efficiency and create better learning experiences.
        </p>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-3">What the AI Teaching Assistant Can Do:</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Lesson Planning:</strong> Generate comprehensive lesson plans for any topic</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Create Assessments:</strong> Design quizzes, tests, and practice problems</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Explain Concepts:</strong> Get clear explanations to help you teach complex topics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Differentiation:</strong> Create adapted materials for different learning levels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Administrative Help:</strong> Draft emails, announcements, and policies</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-3">Pro Tips:</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Be specific in your prompts for best results</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Review and customize AI-generated content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Use it to save time on repetitive tasks</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Crown,
    title: "Teach+ Subscription",
    description: "Unlock unlimited teaching potential",
    gradient: "from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10",
    content: (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border-2 border-blue-500/30">
          <h3 className="text-2xl font-bold mb-4">Teach+ Benefits ($7/month)</h3>
          <ul className="space-y-3 ml-4">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
              <span><strong>Unlimited Pods:</strong> Create as many classes as you need</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
              <span><strong>Advanced AI Assistant:</strong> Unlimited access to teaching AI with priority processing</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
              <span><strong>Comprehensive Analytics:</strong> Track student engagement and learning outcomes</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
              <span><strong>Priority Support:</strong> Get technical help when you need it most</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
              <span><strong>Increased Storage:</strong> More space for materials and student work</span>
            </li>
          </ul>
        </div>
        <div className="bg-muted/50 rounded-xl p-5">
          <h3 className="text-xl font-bold mb-3">How to Subscribe:</h3>
          <ol className="space-y-2 ml-4">
            <li>1. Go to "My Plan" in the left sidebar</li>
            <li>2. Click "Upgrade to Teach+"</li>
            <li>3. Complete payment through secure Stripe checkout</li>
            <li>4. Create unlimited pods immediately</li>
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
    description: "Customize your teaching profile",
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
                <span><strong>Teaching Credentials:</strong> Add your qualifications and experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Bio:</strong> Write a brief introduction for students</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Profile Picture:</strong> Upload a professional photo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Contact Info:</strong> Update email and phone (optional)</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-3">Preferences:</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Notifications:</strong> Configure email alerts for student activity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Theme:</strong> Choose between light and dark mode</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Language:</strong> Set your preferred interface language</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
];

interface TeacherDocumentationProps {
  onBack: () => void;
}

export const TeacherDocumentation = ({ onBack }: TeacherDocumentationProps) => {
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
