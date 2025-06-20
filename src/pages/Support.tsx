
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Book, Video, Mail, Phone, Clock } from "lucide-react";

const Support = () => {
  const navigate = useNavigate();

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "Available 9 AM - 6 PM EST",
      action: "Start Chat",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us detailed questions or feedback",
      availability: "Response within 24 hours",
      action: "Send Email",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Talk directly with our technical team",
      availability: "Premium plan subscribers",
      action: "Schedule Call",
      color: "from-green-500 to-blue-500"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png"  
              alt="Classpace Logo" 
              className="w-10 h-10"
            />
            <span className="text-2xl font-bold bg-gradient-main bg-clip-text text-transparent">
              Classpace
            </span>
          </div>
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-main rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-main bg-clip-text text-transparent mb-4">
            How Can We Help?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to support you every step of your Classpace journey. 
            Find answers, get help, and make the most of your AI-powered teaching experience.
          </p>
        </div>

        {/* Support Options */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {supportOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${option.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-2">{option.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-4">{option.description}</p>
                  <div className="flex items-center justify-center mb-6 text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {option.availability}
                  </div>
                  <Button className="w-full bg-gradient-main hover:opacity-90 text-white">
                    {option.action}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Self-Help Resources */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Self-Help <span className="bg-gradient-main bg-clip-text text-transparent">Resources</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {resources.map((resource, index) => {
              const IconComponent = resource.icon;
              return (
                <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">{resource.title}</h3>
                    <p className="text-gray-600 mb-4">{resource.description}</p>
                    <span className="text-sm text-purple-600 font-medium">{resource.articles}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-8 last:border-b-0">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {faq.question}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 bg-gradient-main rounded-3xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-xl mb-8 opacity-90">
            Our support team is standing by to help you succeed with Classpace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              Contact Support
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-3 text-lg font-semibold"
              onClick={() => navigate("/login")}
            >
              Try Classpace Free
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Support;
