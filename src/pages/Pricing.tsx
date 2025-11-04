
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
      description: "Basic but fully usable",
      icon: Star,
      features: [
        "1 AI Pod",
        "Core features enabled",
        "Create and run sessions",
        "Invite students",
        "Email support"
      ],
      buttonText: "Get Started",
      popular: false,
      type: "teacher"
    },
    {
      name: "Teach +",
      price: "$7",
      period: "/month",
      description: "Unlimited pods and growth",
      icon: Zap,
      features: [
        "Unlimited AI Pods",
        "Priority support",
        "Faster refresh & checks",
        "Bigger class sizes",
        "All Free features"
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
      description: "Essential learning tools",
      icon: Star,
      features: [
        "Join unlimited pods",
        "AI-powered Learnspace",
        "Limited chat history",
        "Core learning features",
        "Email support"
      ],
      buttonText: "Get Started",
      popular: false,
      type: "student"
    },
    {
      name: "Learn +",
      price: "$7",
      period: "/month",
      description: "Advanced AI learning",
      icon: Zap,
      features: [
        "Unlimited chat history",
        "Priority AI responses",
        "Advanced image analysis",
        "Personalized learning",
        "Early feature access"
      ],
      buttonText: "Upgrade Now",
      popular: true,
      type: "student"
    }
  ];

  const faqs = [
    {
      question: "What's the difference between Learn + and Teach + subscriptions?",
      answer: "Learn + is designed for students and includes AI tutoring with Phoenix, unlimited learning sessions, image analysis for homework help, and personalized learning insights. Teach + is for educators and provides unlimited pods, advanced analytics, AI teaching assistant, and priority support. Both are $7/month."
    },
    {
      question: "What's included in the Learn + subscription?",
      answer: "Learn + includes unlimited AI tutoring sessions with Phoenix (voice and text), advanced homework help with image analysis, personalized learning recommendations, access to collaborative whiteboards for interactive learning, and unlimited chat history storage."
    },
    {
      question: "What's included in the Teach + subscription?",
      answer: "Teach + unlocks unlimited AI pods for classroom management, advanced AI teaching assistant, comprehensive student analytics, priority support, faster refresh rates, bigger class sizes, and exclusive access to new teaching features as they're released."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes. You can cancel your Learn + or Teach + subscription anytime through your dashboard. You'll continue to have access to premium features until the end of your current billing period."
    },
    {
      question: "Is there a free plan available?",
      answer: "Yes! Both teachers and students have access to free plans. Teachers get 1 AI Pod with core features, while students can join unlimited pods and use Learnspace with limited chat history. You can upgrade to Learn + or Teach + anytime for $7/month."
    },
    {
      question: "Do students and teachers need separate subscriptions?",
      answer: "Yes. Teach + is specifically for educators managing classrooms and creating pods. Learn + is for students who want enhanced AI tutoring features with Phoenix and personalized learning. Each subscription is tailored to different needs and use cases."
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
