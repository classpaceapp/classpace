import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, FileText, Scale, Instagram, Linkedin } from "lucide-react";

const Terms = () => {
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
            <Scale className="w-8 h-8 md:w-12 md:h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-6xl font-bold bg-gradient-main bg-clip-text text-transparent mb-6">
            Terms & Conditions
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Clear, transparent terms that protect both you and Classpace while ensuring a great experience for everyone.
          </p>
        </div>

        {/* Key Principles */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
          <div className="text-center p-6 md:p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl shadow-lg">
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg md:text-xl mb-3 text-gray-900">Fair & Transparent</h3>
            <p className="text-gray-600 text-sm md:text-base">Clear terms that protect everyone's interests</p>
          </div>
          <div className="text-center p-6 md:p-8 bg-gradient-to-br from-pink-50 to-pink-100 rounded-3xl shadow-lg">
            <FileText className="w-10 h-10 md:w-12 md:h-12 text-pink-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg md:text-xl mb-3 text-gray-900">Easy to Understand</h3>
            <p className="text-gray-600 text-sm md:text-base">No confusing legal jargon or hidden clauses</p>
          </div>
          <div className="text-center p-6 md:p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-lg">
            <Scale className="w-10 h-10 md:w-12 md:h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg md:text-xl mb-3 text-gray-900">Your Rights Protected</h3>
            <p className="text-gray-600 text-sm md:text-base">We respect your data and intellectual property</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-2xl p-8 md:p-16">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-500 mb-8 md:mb-12 text-base md:text-lg text-center">
              Last updated: January 1, 2025
            </p>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                By accessing and using Classpace, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">2. Use License</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                Permission is granted to use Classpace for educational purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-3 text-base md:text-lg ml-4">
                <li>Modify or reverse engineer any part of the platform</li>
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to other users' accounts</li>
                <li>Remove any copyright or proprietary notices from the platform</li>
              </ul>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">3. User Accounts</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
                You are responsible for safeguarding your password and maintaining the security of your account.
              </p>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">4. Content and Conduct</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                You retain ownership of all educational content you create and share through Classpace. 
                You are responsible for ensuring your content complies with applicable laws and our community guidelines.
              </p>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">5. AI-Generated Content</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                Classpace uses artificial intelligence to generate summaries, quizzes, and other educational content. 
                While we strive for accuracy, all AI-generated content should be reviewed and verified before use in educational settings.
              </p>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                Your privacy is fundamental to our service. Please review our Privacy Policy to understand how we collect, 
                use, and protect your personal information and educational data.
              </p>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">7. Service Availability</h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-base md:text-lg">
                We strive to maintain 99.9% uptime, but like all online services, Classpace may occasionally be unavailable 
                due to maintenance, updates, or unforeseen technical issues. We'll always notify users in advance when possible.
              </p>
            </section>

            <section className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">8. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                If you have any questions about these Terms & Conditions, please contact us at: 
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
              <h3 className="text-lg font-semib mb-6 text-purple-300">Legal</h3>
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

export default Terms;
