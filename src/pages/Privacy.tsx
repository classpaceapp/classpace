import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database, Instagram, Linkedin } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

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

      <main className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-20">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-main rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Shield className="w-8 h-8 md:w-12 md:h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-6xl font-bold bg-gradient-main bg-clip-text text-transparent mb-6">
            Privacy Policy
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Your privacy matters to us. Here's how we protect and use your data with complete transparency.
          </p>
        </div>

        {/* Privacy Principles */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
          <div className="text-center p-6 md:p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl shadow-lg">
            <Lock className="w-10 h-10 md:w-12 md:h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg md:text-xl mb-3 text-gray-900">Secure by Default</h3>
            <p className="text-gray-600 text-sm md:text-base">End-to-end encryption for all your educational content</p>
          </div>
          <div className="text-center p-6 md:p-8 bg-gradient-to-br from-pink-50 to-pink-100 rounded-3xl shadow-lg">
            <Eye className="w-10 h-10 md:w-12 md:h-12 text-pink-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg md:text-xl mb-3 text-gray-900">Fully Transparent</h3>
            <p className="text-gray-600 text-sm md:text-base">Clear information about what data we collect and why</p>
          </div>
          <div className="text-center p-6 md:p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-lg">
            <Database className="w-10 h-10 md:w-12 md:h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg md:text-xl mb-3 text-gray-900">Your Control</h3>
            <p className="text-gray-600 text-sm md:text-base">You own your data and can export or delete it anytime</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-2xl p-8 md:p-16">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-500 mb-8 md:mb-12 text-base md:text-lg text-center">
              Last updated: January 1, 2025
            </p>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                We collect information you provide directly to us, such as when you create an account, 
                participate in AI Pods, or contact us for support.
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-3 text-base md:text-lg ml-4">
                <li>Account information (name, email, role as teacher or learner)</li>
                <li>Educational content shared in AI Pods</li>
                <li>Usage data to improve our AI recommendations</li>
                <li>Communication preferences and support interactions</li>
              </ul>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                We use the information we collect to provide, maintain, and improve Classpace:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-3 text-base md:text-lg ml-4">
                <li>Generate AI-powered summaries, quizzes, and educational content</li>
                <li>Facilitate communication between teachers and learners</li>
                <li>Track learning progress and provide personalized recommendations</li>
                <li>Send important updates about your account or our service</li>
                <li>Provide customer support and respond to your requests</li>
              </ul>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                We do not sell, rent, or share your personal information with third parties except in these specific circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-3 text-base md:text-lg ml-4">
                <li>With your explicit consent</li>
                <li>With AI service providers (OpenAI) to generate educational content</li>
                <li>To comply with legal obligations or protect our rights</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">AI and Machine Learning</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                Classpace uses AI to enhance the learning experience. Here's what you should know:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-3 text-base md:text-lg ml-4">
                <li>AI models process your educational content to generate summaries and quizzes</li>
                <li>We use anonymized usage patterns to improve AI recommendations</li>
                <li>Your personal conversations remain private and are not used to train general AI models</li>
                <li>You can opt out of AI features at any time in your account settings</li>
              </ul>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                We implement industry-standard security measures to protect your information, including 
                encryption in transit and at rest, regular security audits, and strict access controls.
              </p>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                You have the right to access, update, or delete your personal information. 
                You can also export your data or request account deletion at any time through your account settings.
              </p>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                If you have questions about this Privacy Policy, please contact us at: 
                <a href="mailto:social@classpace.co" className="text-purple-600 hover:text-purple-800 ml-2 font-semibold">
                  social@classpace.co
                </a>
              </p>
            </section>
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

            {/* ... keep existing code (other footer sections) */}
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

export default Privacy;
