
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Clock, CheckCircle, AlertCircle, Instagram, Linkedin } from "lucide-react";

const Refunds = () => {
  const navigate = useNavigate();

  const refundSteps = [
    {
      icon: AlertCircle,
      title: "Request Refund",
      description: "Contact us within 30 days of purchase",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: Clock,
      title: "Processing Time",
      description: "Refunds are processed within 5-7 business days",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: CheckCircle,
      title: "Confirmation",
      description: "You'll receive an email confirmation once completed",
      color: "from-green-500 to-emerald-500"
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

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-main rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-main bg-clip-text text-transparent mb-4">
            Refund Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We stand behind our product. If you're not satisfied, we'll make it right.
          </p>
        </div>

        {/* Refund Process */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {refundSteps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Refund Policy Details */}
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Promise to You
          </h2>
          
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                30-Day Money-Back Guarantee
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                We offer a full refund within 30 days of your initial purchase. No questions asked. 
                We want you to be completely satisfied with Classpace.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                How to Request a Refund
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg mb-4">
                To request a refund, simply contact our support team at{" "}
                <a href="mailto:support@classpace.com" className="text-purple-600 hover:text-purple-800 font-semibold">
                  support@classpace.com
                </a>{" "}
                with your account details and reason for the refund request.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Processing Time
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                Once approved, refunds are processed within 5-7 business days. 
                The refund will appear on your original payment method.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Partial Refunds
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                For annual subscriptions, we may offer prorated refunds based on unused time. 
                Each case is reviewed individually to ensure fairness.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Contact Us
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                Have questions about our refund policy? We're here to help. Contact us at{" "}
                <a href="mailto:support@classpace.com" className="text-purple-600 hover:text-purple-800 font-semibold">
                  support@classpace.com
                </a>
                {" "}or through our support chat.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
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

export default Refunds;
