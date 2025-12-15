import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CreditCard, Clock, CheckCircle, AlertCircle, Instagram, Linkedin, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const RefundForm = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    paymentMethod: '',
    refundAmount: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.paymentMethod || !formData.refundAmount || !formData.reason) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-refund-request', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: 'Refund request submitted!',
        description: "We've received your request and will review it shortly.",
      });

      setFormData({ name: '', email: '', paymentMethod: '', refundAmount: '', reason: '' });
    } catch (error: any) {
      console.error('Error submitting refund request:', error);
      toast({
        title: 'Submission failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white text-base">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
            className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white text-base">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            required
            className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 h-12"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="paymentMethod" className="text-white text-base">Payment Method *</Label>
          <Input
            id="paymentMethod"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            placeholder="e.g., Credit Card, PayPal"
            required
            className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refundAmount" className="text-white text-base">Refund Amount *</Label>
          <Input
            id="refundAmount"
            value={formData.refundAmount}
            onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })}
            placeholder="e.g., $7.00"
            required
            className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 h-12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason" className="text-white text-base">Reason for Refund *</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Please explain why you're requesting a refund..."
          rows={6}
          required
          className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 resize-none"
        />
      </div>

      <Button 
        type="submit" 
        disabled={submitting}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {submitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Submitting...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Submit Refund Request
          </>
        )}
      </Button>
    </form>
  );
};

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

      <main className="container mx-auto px-3 md:px-4 py-6 md:py-16 max-w-4xl">
        <div className="text-center mb-8 md:mb-16">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-2xl">
            <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 px-2">
            Refund Policy
          </h1>
          <p className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto px-3">
            We stand behind our product. If you're not satisfied, we'll make it right.
          </p>
        </div>

        {/* Refund Process */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 md:mb-16">
          {refundSteps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card key={index} className="border-2 border-gray-700 hover:border-purple-500 transition-all duration-300 bg-gray-800/90 backdrop-blur-md shadow-2xl">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-300">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Refund Policy Details */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-700">
          <h2 className="text-3xl font-bold text-center text-white mb-8 md:mb-12">
            Our Promise to You
          </h2>
          
          <div className="space-y-6 md:space-y-8">
            <div className="border-b border-gray-600 pb-6 md:pb-8">
              <h3 className="text-2xl font-semibold mb-4 text-white">
                Case-by-Case Considered Refunds
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                We carefully review each refund request on an individual basis. 
                While we strive to accommodate reasonable refund requests, approval is not automatic and depends on the circumstances of each case.
              </p>
            </div>

            <div className="border-b border-gray-600 pb-6 md:pb-8">
              <h3 className="text-2xl font-semibold mb-4 text-white">
                How to Request a Refund
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg mb-4">
                To request a refund, simply contact our support team at{" "}
                <a href="mailto:social@classpace.co" className="text-purple-400 hover:text-purple-300 font-semibold">
                  social@classpace.co
                </a>{" "}
                with your account details and reason for the refund request.
              </p>
            </div>

            <div className="border-b border-gray-600 pb-6 md:pb-8">
              <h3 className="text-2xl font-semibold mb-4 text-white">
                Processing Time
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                Once approved, refunds are processed within 5-7 business days. 
                The refund will appear on your original payment method.
              </p>
            </div>

            <div className="border-b border-gray-600 pb-6 md:pb-8">
              <h3 className="text-2xl font-semibold mb-4 text-white">
                Partial Refunds
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                For annual subscriptions, we may offer prorated refunds based on unused time. 
                Each case is reviewed individually to ensure fairness.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-4 text-white">
                Contact Us
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                Have questions about our refund policy? We're here to help. Contact us at{" "}
                <a href="mailto:social@classpace.co" className="text-purple-400 hover:text-purple-300 font-semibold">
                  social@classpace.co
                </a>
                {" "}or through our support chat.
              </p>
            </div>
          </div>
        </div>

        {/* Refund Request Form */}
        <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden mt-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.15),transparent_50%)]"></div>
          <CardHeader className="relative border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Request a Refund
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Fill out the form below and we'll review your request
            </CardDescription>
          </CardHeader>
          <CardContent className="relative pt-8">
            <RefundForm />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
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
                    onClick={() => navigate("/careers")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Careers
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

export default Refunds;
