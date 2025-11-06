
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Check, Star, Zap, ChevronDown, Instagram, Linkedin } from "lucide-react";
import { useState } from "react";

const Pricing = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const teacherPlans = [
    {
      name: "Free",
      price: "Free",
      description: "Full-featured single pod",
      icon: Star,
      features: [
        "1 Pod (fully functional)",
        "Materials, quizzes, flashcards",
        "Notes, whiteboards, meetings",
        "Live sessions & chat",
        "Unlimited students per pod"
      ],
      buttonText: "Get Started",
      popular: false,
      type: "teacher"
    },
    {
      name: "Teach +",
      price: "$7",
      period: "/month",
      description: "Unlimited pods + career tools",
      icon: Zap,
      features: [
        "Unlimited Pods",
        "Nexus AI Command Center (full access)",
        "AI Curriculum Architect",
        "AI Lesson Orchestrator", 
        "AI Assessment Hub with auto-grading",
        "Progress Analytics Dashboard",
        "Global Resource Library",
        "Student Profile Analytics",
        "All pod features",
        "Aurora Application Builder",
        "Aurora Role Search",
        "Aurora Interview Prep"
      ],
      buttonText: "Upgrade Now",
      popular: true,
      type: "teacher"
    }
  ];

  const studentPlans = [
    {
      name: "Free",
      price: "Free",
      description: "Join & learn essentials",
      icon: Star,
      features: [
        "Join unlimited pods",
        "Learnspace AI (3 chat limit)",
        "My Resources (1 each)",
        "Phoenix AI tutor access",
        "All pod features"
      ],
      buttonText: "Get Started",
      popular: false,
      type: "student"
    },
    {
      name: "Learn +",
      price: "$7",
      period: "/month",
      description: "Unlimited AI resources",
      icon: Zap,
      features: [
        "Unlimited Learnspace chats",
        "Unlimited flashcards",
        "Unlimited quizzes",
        "Unlimited notes",
        "Advanced image analysis",
        "Phoenix AI tutor access",
        "Access to Global Resource Library",
        "Aurora Application Builder",
        "Aurora Role Search",
        "Aurora Interview Prep"
      ],
      buttonText: "Upgrade Now",
      popular: true,
      type: "student"
    }
  ];

  const faqs = [
    {
      question: "What makes Classpace different from using ChatGPT or other AI tools?",
      answer: "While AI chatbots provide general information, Classpace is purpose-built for education with context-aware features. Phoenix AI remembers your study sessions and provides personalized tutoring. The platform integrates seamlessly with teacher-created courses (Pods), tracking progress across materials and assignments. You get structured learning paths, collaborative tools, and educator support—all in one unified interface, not scattered across multiple apps."
    },
    {
      question: "What's the difference between Learn+ and Teach+ subscriptions?",
      answer: "Learn+ is for students - it unlocks unlimited Learnspace AI chats, unlimited My Resources (flashcards, quizzes, notes), Phoenix AI tutor, global resource library access, and Aurora Careers Toolkit. Teach+ is for educators - it unlocks unlimited pods, full Nexus AI teaching command center (curriculum planning, lesson generation, auto-grading, analytics, resource library), and Aurora Careers Toolkit. Both provide comprehensive educational ecosystems at $7/month."
    },
    {
      question: "What is Nexus and who can access it?",
      answer: "Nexus is an AI-powered teaching command center exclusively for Teach+ subscribers. It includes: AI Curriculum Architect for course design, AI Lesson Orchestrator for daily planning, AI Assessment Hub with auto-grading, Progress Dashboard for student analytics, Global Resource Library for sharing materials, and Student Profile Analytics. Free plan teachers can view Nexus modules to understand capabilities, but need Teach+ to access the full functionality."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes. You can cancel your Learn+ or Teach+ subscription anytime through My Plan in your dashboard. You'll continue to have access to premium features until the end of your current billing period."
    },
    {
      question: "Is there a free plan available?",
      answer: "Yes! Free plan for students includes: join unlimited pods, Learnspace AI (limited to 3 chats), My Resources (1 flashcard/quiz/note each), Phoenix AI tutor. Free plan for teachers includes: 1 pod with full features (materials, quizzes, flashcards, notes, whiteboards, meetings)."
    },
    {
      question: "Do students and teachers need separate subscriptions?",
      answer: "Yes. Teach+ is specifically for educators managing multiple classrooms and accessing comprehensive teaching tools. Learn+ is for students who want unlimited AI learning resources and career preparation. Each subscription is tailored to different educational needs at the same $7/month price."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
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
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-8 md:py-20">
        <div className="text-center mb-8 md:mb-20">
          <h1 className="text-3xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 md:mb-8 leading-tight pb-2 px-2">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base md:text-2xl text-gray-300 max-w-3xl mx-auto px-3">
            Choose the perfect plan for your needs. Separate plans for teachers and students.
          </p>
        </div>

        {/* Teacher Plans */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-2xl md:text-5xl font-bold text-center mb-4 md:mb-8 text-white px-2">
            For Teachers
          </h2>
          <p className="text-base md:text-lg text-gray-300 text-center mb-8 md:mb-12 max-w-2xl mx-auto px-3">
            Manage classrooms and create AI-powered learning pods
          </p>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            {teacherPlans.map((plan, index) => {
              const IconComponent = plan.icon;
              return (
                <Card 
                  key={index} 
                  className="relative border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 rounded-3xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900"
                >
                  <CardHeader className="text-center pb-8 pt-12 bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center shadow-xl bg-gradient-to-r from-purple-600 to-pink-600">
                      <IconComponent className="w-12 h-12 text-white" />
                    </div>
                    <CardTitle className="text-4xl font-bold mb-6 text-white">{plan.name}</CardTitle>
                    <p className="text-gray-300 mb-8 text-lg">{plan.description}</p>
                    <div className="mb-8">
                      <span className="text-6xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="text-2xl text-gray-400">{plan.period}</span>}
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 bg-gradient-to-br from-gray-800 to-gray-900">
                    <ul className="space-y-6 mb-12">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="w-6 h-6 text-green-400 mr-4 flex-shrink-0" />
                          <span className="text-gray-300 text-lg">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full py-6 text-xl font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                      onClick={() => navigate("/login")}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Student Plans */}
        <div className="mb-12 md:mb-24">
          <h2 className="text-2xl md:text-5xl font-bold text-center mb-4 md:mb-8 text-white px-2">
            For Students
          </h2>
          <p className="text-base md:text-lg text-gray-300 text-center mb-8 md:mb-12 max-w-2xl mx-auto px-3">
            Enhance your learning with AI-powered tools
          </p>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            {studentPlans.map((plan, index) => {
              const IconComponent = plan.icon;
              return (
                <Card 
                  key={index} 
                  className="relative border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 rounded-3xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900"
                >
                  <CardHeader className="text-center pb-8 pt-12 bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center shadow-xl bg-gradient-to-r from-purple-600 to-pink-600">
                      <IconComponent className="w-12 h-12 text-white" />
                    </div>
                    <CardTitle className="text-4xl font-bold mb-6 text-white">{plan.name}</CardTitle>
                    <p className="text-gray-300 mb-8 text-lg">{plan.description}</p>
                    <div className="mb-8">
                      <span className="text-6xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="text-2xl text-gray-400">{plan.period}</span>}
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 bg-gradient-to-br from-gray-800 to-gray-900">
                    <ul className="space-y-6 mb-12">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="w-6 h-6 text-green-400 mr-4 flex-shrink-0" />
                          <span className="text-gray-300 text-lg">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full py-6 text-xl font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                      onClick={() => navigate("/login")}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Enhanced FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 md:mb-16 text-white">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Collapsible 
                key={index}
                open={openFaq === index}
                onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <CollapsibleTrigger asChild>
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-700 hover:border-purple-500">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl md:text-2xl font-bold text-white text-left">
                        {faq.question}
                      </h3>
                      <ChevronDown 
                        className={`w-6 h-6 text-purple-400 transition-transform duration-200 ${
                          openFaq === index ? 'transform rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 mt-2 border border-gray-700">
                    <p className="text-gray-300 text-lg leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
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
                Learn and teach anything.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://www.instagram.com/classpace.co/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  <Instagram className="w-5 h-5 text-white" />
                </a>
                <a 
                  href="https://linkedin.com/company/classpace-app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer"
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
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/our-journey")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Our Journey
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/careers")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Careers
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/login")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Sign In
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
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/refunds")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Refunds
                  </button>
                </li>
                <li>
                  <a 
                    href="mailto:social@classpace.co"
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6 text-purple-300">Legal</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/terms")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/privacy")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/investors")}
                    className="font-bold text-lg text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Investors
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

export default Pricing;
