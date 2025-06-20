
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

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
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-main rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-main bg-clip-text text-transparent mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600 text-lg">
              Your privacy matters to us. Here's how we protect and use your data.
            </p>
          </div>

          {/* Privacy Principles */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 bg-purple-50 rounded-2xl">
              <Lock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Secure by Default</h3>
              <p className="text-gray-600 text-sm">End-to-end encryption for all your educational content</p>
            </div>
            <div className="text-center p-6 bg-pink-50 rounded-2xl">
              <Eye className="w-8 h-8 text-pink-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Transparent</h3>
              <p className="text-gray-600 text-sm">Clear information about what data we collect and why</p>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-2xl">
              <Database className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Your Control</h3>
              <p className="text-gray-600 text-sm">You own your data and can export or delete it anytime</p>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8 text-lg">
              Last updated: January 1, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                participate in AI Pods, or contact us for support.
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Account information (name, email, role as teacher or learner)</li>
                <li>Educational content shared in AI Pods</li>
                <li>Usage data to improve our AI recommendations</li>
                <li>Communication preferences and support interactions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect to provide, maintain, and improve Classpace:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Generate AI-powered summaries, quizzes, and educational content</li>
                <li>Facilitate communication between teachers and learners</li>
                <li>Track learning progress and provide personalized recommendations</li>
                <li>Send important updates about your account or our service</li>
                <li>Provide customer support and respond to your requests</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, rent, or share your personal information with third parties except in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>With your explicit consent</li>
                <li>With AI service providers (OpenAI) to generate educational content</li>
                <li>To comply with legal obligations or protect our rights</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI and Machine Learning</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Classpace uses AI to enhance the learning experience. Here's what you should know:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>AI models process your educational content to generate summaries and quizzes</li>
                <li>We use anonymized usage patterns to improve AI recommendations</li>
                <li>Your personal conversations remain private and are not used to train general AI models</li>
                <li>You can opt out of AI features at any time in your account settings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information, including 
                encryption in transit and at rest, regular security audits, and strict access controls.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibol text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to access, update, or delete your personal information. 
                You can also export your data or request account deletion at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at: 
                <a href="mailto:privacy@classpace.com" className="text-purple-600 hover:text-purple-800 ml-1">
                  privacy@classpace.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
