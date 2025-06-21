
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Check, Star, Zap, ChevronDown, Instagram, Linkedin } from "lucide-react";
import { useState } from "react";

const Pricing = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for trying out Classpace",
      icon: Star,
      features: [
        "2 AI Pods",
        "Basic AI summaries",
        "5 quiz generations per month",
        "Email support",
        "Up to 3 students per pod"
      ],
      buttonText: "Get Started",
      popular: false
    },
    {
      name: "Educator",
      price: "$18",
      period: "/month",
      description: "Ideal for individual teachers",
      icon: Zap,
      features: [
        "Unlimited AI Pods",
        "Advanced AI summaries & flashcards",
        "Unlimited quiz & content generation",
        "Priority support",
        "Up to 25 students per pod",
        "Progress tracking & analytics",
        "File uploads (PDFs, audio)",
        "Weekly recap emails"
      ],
      buttonText: "Start Free Trial",
      popular: true
    }
  ];

  const faqs = [
    {
      question: "Can I change plans anytime?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges accordingly."
    },
    {
      question: "Is there a free trial?",
      answer: "The Educator plan comes with a 14-day free trial. No credit card required to get started. The Starter plan is always free with basic features."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "You can export all your data at any time. After cancellation, your data is retained for 30 days before being permanently deleted, giving you time to reconsider or export your content."
    },
    {
      question: "Do you offer discounts for schools?",
      answer: "Yes! We offer special pricing for educational institutions, nonprofits, and bulk purchases. Contact our sales team for a custom quote."
    }
  ];

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

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-20">
          <h1 className="text-4xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Choose the perfect plan for your teaching needs. All plans include our core AI features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16 md:mb-24">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={index} 
                className={`relative border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 rounded-3xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 ${
                  plan.popular ? 'ring-4 ring-purple-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-12 bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className={`w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center shadow-xl ${
                    plan.popular ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-700'
                  }`}>
                    <IconComponent className={`w-12 h-12 ${plan.popular ? 'text-white' : 'text-gray-300'}`} />
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
                    className={`w-full py-6 text-xl font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0' 
                        : 'bg-gray-700 hover:bg-gray-600 text-white border-0'
                    }`}
                    onClick={() => navigate("/login")}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
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
                  href="https://www.linkedin.com/company/105928104/admin/dashboard/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

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
