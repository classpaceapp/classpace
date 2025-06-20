
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Book, Video, Mail, Clock, Instagram, Linkedin } from "lucide-react";

const Support = () => {
  const navigate = useNavigate();

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "Coming Soon",
      action: "Coming Soon",
      color: "from-blue-500 to-cyan-500",
      disabled: true
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us detailed questions or feedback",
      availability: "Response within 24 hours",
      action: "Send Email",
      color: "from-purple-500 to-pink-500",
      disabled: false
    }
  ];

  const resources = [
    {
      icon: Book,
      title: "Knowledge Base",
      description: "Comprehensive guides and tutorials",
      articles: "50+ articles"
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      articles: "25+ videos"
    },
    {
      icon: MessageCircle,
      title: "Community Forum",
      description: "Connect with other educators",
      articles: "Active community"
    }
  ];

  const faqs = [
    {
      question: "How do I create my first AI Pod?",
      answer: "After signing up, click 'Create New Pod' from your dashboard. Give it a name, add students via email invites, and start your first conversation. The AI will begin learning and building memory from your interactions."
    },
    {
      question: "Can students access AI features?",
      answer: "Students can interact with the AI within their assigned Pods, ask questions, and receive personalized summaries. However, advanced features like creating quizzes and managing Pod settings are teacher-exclusive."
    },
    {
      question: "How secure is my educational data?",
      answer: "We use enterprise-grade encryption for all data. Your Pod conversations are private, and we never use your content to train general AI models. You maintain full ownership and control of your educational materials."
    },
    {
      question: "What file types can I upload?",
      answer: "Classpace supports PDFs, Word documents, PowerPoint presentations, images (PNG, JPG), and audio files (MP3, WAV). Each file is processed by our AI to generate relevant summaries and learning materials."
    },
    {
      question: "How does the AI remember past conversations?",
      answer: "Each Pod maintains a persistent memory of all interactions, uploaded materials, and generated content. This allows the AI to provide contextual responses and track learning progress over time."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png"  
                alt="Classpace Logo" 
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <span className="text-xl md:text-2xl font-bold bg-gradient-main bg-clip-text text-transparent">
                Classpace
              </span>
            </div>
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-20">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-main rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-main bg-clip-text text-transparent mb-4">
            How Can We Help?
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to support you every step of your Classpace journey. 
            Find answers, get help, and make the most of your AI-powered teaching experience.
          </p>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-16 md:mb-24 max-w-4xl mx-auto">
          {supportOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-3xl overflow-hidden">
                <CardHeader className="text-center pb-4 bg-gradient-to-br from-gray-50 to-white">
                  <div className={`w-16 h-16 bg-gradient-to-r ${option.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2 text-gray-900">{option.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center p-8">
                  <p className="text-gray-600 mb-6 text-lg">{option.description}</p>
                  <div className="flex items-center justify-center mb-8 text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {option.availability}
                  </div>
                  {option.disabled ? (
                    <Button 
                      disabled
                      className="w-full bg-gray-200 text-gray-400 py-3 rounded-xl cursor-not-allowed"
                    >
                      {option.action}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-gradient-main hover:opacity-90 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => window.location.href = 'mailto:social@classpace.co'}
                    >
                      {option.action}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Self-Help Resources */}
        <div className="mb-16 md:mb-24">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-900 mb-8 md:mb-16">
            Self-Help <span className="bg-gradient-main bg-clip-text text-transparent">Resources</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {resources.map((resource, index) => {
              const IconComponent = resource.icon;
              return (
                <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 rounded-3xl overflow-hidden group">
                  <CardContent className="p-8 text-center bg-gradient-to-br from-gray-50 to-white group-hover:from-purple-50 group-hover:to-pink-50 transition-all duration-500">
                    <div className="w-16 h-16 bg-gradient-main rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900">{resource.title}</h3>
                    <p className="text-gray-600 mb-6">{resource.description}</p>
                    <span className="text-sm text-purple-600 font-semibold bg-purple-100 px-4 py-2 rounded-full">
                      {resource.articles}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-2xl p-8 md:p-16">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-900 mb-12 md:mb-16">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8 md:space-y-12">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-8 md:pb-12 last:border-b-0">
                <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-900">
                  {faq.question}
                </h3>
                <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Brand Section */}
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
                Learn and teach anything, together.
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
                  href="https://www.linkedin.com/company/105928104/admin/dashboard/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-purple-300">Product</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/pricing")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/our-journey")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Our Journey
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/login")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Sign In
                  </button>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-purple-300">Support</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/support")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/refunds")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Refunds
                  </button>
                </li>
                <li>
                  <a 
                    href="mailto:social@classpace.co"
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-purple-300">Legal</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/terms")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/privacy")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
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

export default Support;
