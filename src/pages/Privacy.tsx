import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database, Instagram, Linkedin } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

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

      <main className="container mx-auto px-3 md:px-4 py-6 md:py-16 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-20">
          <div className="w-16 h-16 md:w-28 md:h-28 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-2xl">
            <Shield className="w-8 h-8 md:w-14 md:h-14 text-white" />
          </div>
          <h1 className="text-3xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 md:mb-8 leading-tight pb-2 px-2">
            Privacy Policy
          </h1>
          <p className="text-base md:text-2xl text-gray-300 max-w-3xl mx-auto px-3">
            Your privacy matters to us. Here's how we protect and use your data with complete transparency.
          </p>
        </div>

        {/* Privacy Principles */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 md:mb-24">
          <div className="text-center p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700">
            <Lock className="w-12 h-12 md:w-16 md:h-16 text-purple-400 mx-auto mb-6" />
            <h3 className="font-bold text-xl md:text-2xl mb-4 text-white">Secure by Default</h3>
            <p className="text-gray-300 text-base md:text-lg">End-to-end encryption for all your educational content</p>
          </div>
          <div className="text-center p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700">
            <Eye className="w-12 h-12 md:w-16 md:h-16 text-pink-400 mx-auto mb-6" />
            <h3 className="font-bold text-xl md:text-2xl mb-4 text-white">Fully Transparent</h3>
            <p className="text-gray-300 text-base md:text-lg">Clear information about what data we collect and why</p>
          </div>
          <div className="text-center p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700">
            <Database className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mx-auto mb-6" />
            <h3 className="font-bold text-xl md:text-2xl mb-4 text-white">Your Control</h3>
            <p className="text-gray-300 text-base md:text-lg">You own your data and can export or delete it anytime</p>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-purple-900/90 via-pink-900/80 to-purple-900/90 rounded-3xl shadow-2xl p-8 md:p-16 border-2 border-purple-400/50 overflow-hidden transform perspective-1000 hover:scale-[1.02] transition-transform duration-300" style={{ boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.5), 0 0 0 1px rgba(168, 85, 247, 0.3)' }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.3),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(236,72,153,0.3),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
          <div className="relative prose prose-lg max-w-none">
            <p className="text-purple-200 mb-8 md:mb-12 text-base md:text-lg text-center font-semibold">
              Last updated: November 1, 2025
            </p>

            <section className="mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8 drop-shadow-lg">Information We Collect</h2>
              <p className="text-purple-100 leading-relaxed mb-4 text-lg md:text-xl">
                We collect information you provide directly to us, such as when you create an account, 
                participate in AI Pods, or contact us for support.
              </p>
              <ul className="list-disc list-inside text-purple-100 mb-4 space-y-3 text-lg md:text-xl ml-4">
                <li>Account information (name, email, role as teacher or learner)</li>
                <li>Educational content shared in AI Pods</li>
                <li>Usage data to improve our AI recommendations</li>
                <li>Communication preferences and support interactions</li>
              </ul>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8 drop-shadow-lg">How We Use Your Information</h2>
              <p className="text-purple-100 leading-relaxed mb-4 text-lg md:text-xl">
                We use the information we collect to provide, maintain, and improve Classpace:
              </p>
              <ul className="list-disc list-inside text-purple-100 mb-4 space-y-3 text-lg md:text-xl ml-4">
                <li>Generate AI-powered summaries, quizzes, and educational content</li>
                <li>Facilitate communication between teachers and learners</li>
                <li>Track learning progress and provide personalized recommendations</li>
                <li>Send important updates about your account or our service</li>
                <li>Provide customer support and respond to your requests</li>
              </ul>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8 drop-shadow-lg">Data Sharing and Disclosure</h2>
              <p className="text-purple-100 leading-relaxed mb-4 text-lg md:text-xl">
                We do not sell, rent, or share your personal information with third parties except in these specific circumstances:
              </p>
              <ul className="list-disc list-inside text-purple-100 mb-4 space-y-3 text-lg md:text-xl ml-4">
                <li>With your explicit consent</li>
                <li>With AI service providers (OpenAI) to generate educational content</li>
                <li>To comply with legal obligations or protect our rights</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8 drop-shadow-lg">AI and Machine Learning</h2>
              <p className="text-purple-100 leading-relaxed mb-4 text-lg md:text-xl">
                Classpace uses AI to enhance the learning experience. Here's what you should know:
              </p>
              <ul className="list-disc list-inside text-purple-100 mb-4 space-y-3 text-lg md:text-xl ml-4">
                <li>AI models process your educational content to generate summaries and quizzes</li>
                <li>We use anonymized usage patterns to improve AI recommendations</li>
                <li>Your personal conversations remain private and are not used to train general AI models</li>
                <li>You can opt out of AI features at any time in your account settings</li>
              </ul>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8 drop-shadow-lg">Data Security</h2>
              <p className="text-purple-100 leading-relaxed mb-4 text-lg md:text-xl">
                We implement industry-standard security measures to protect your information, including 
                encryption in transit and at rest, regular security audits, and strict access controls.
              </p>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8 drop-shadow-lg">Your Rights</h2>
              <p className="text-purple-100 leading-relaxed mb-4 text-lg md:text-xl">
                You have the right to access, update, or delete your personal information. 
                You can also export your data or request account deletion at any time through your account settings.
              </p>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8 drop-shadow-lg">Contact Us</h2>
              <p className="text-purple-100 leading-relaxed text-lg md:text-xl">
                If you have questions about this Privacy Policy, please contact us at: 
                <a href="mailto:social@classpace.co" className="text-pink-300 hover:text-pink-200 ml-2 font-semibold underline">
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
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                  alt="Classpace Logo" 
                  className="w-10 h-10"
                />
                <span className="text-2xl font-bold text-white">
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
                <li>
                  <button 
                    onClick={() => navigate("/investors")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Investors
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-white">
                  © 2025 Classpace. All rights reserved.
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  Classpace Inc, 600 N Broad St, Ste 5 #445, Middletown, Delaware 19709
                </p>
              </div>
              <p className="text-white text-sm">
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
