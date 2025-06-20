
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Shield, CreditCard, CheckCircle } from "lucide-react";

const Refunds = () => {
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
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-main rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-main bg-clip-text text-transparent mb-4">
            Refund Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We want you to be completely satisfied with Classpace. Here's our fair and transparent refund policy.
          </p>
        </div>

        {/* Policy Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-none shadow-lg text-center">
            <CardContent className="p-6">
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">30-Day Window</h3>
              <p className="text-gray-600 text-sm">Request refunds within 30 days of purchase</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-lg text-center">
            <CardContent className="p-6">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Questions Asked</h3>
              <p className="text-gray-600 text-sm">Simple process with no complicated requirements</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-lg text-center">
            <CardContent className="p-6">
              <CheckCircle className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Quick Processing</h3>
              <p className="text-gray-600 text-sm">Refunds processed within 5-7 business days</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                At Classpace, we're committed to providing exceptional value to educators and learners. 
                If you're not completely satisfied with our service, we'll make it right.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Eligibility for Refunds</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may request a full refund if:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You request the refund within 30 days of your initial purchase</li>
                <li>You're experiencing technical issues that we cannot resolve</li>
                <li>The service doesn't meet your educational needs as described</li>
                <li>You're unsatisfied with the AI-generated content quality</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Process</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Requesting a refund is simple:
              </p>
              <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2">
                <li>Contact our support team at <a href="mailto:refunds@classpace.com" className="text-purple-600 hover:text-purple-800">refunds@classpace.com</a></li>
                <li>Include your account email and reason for the refund request</li>
                <li>We'll process your request within 24 hours</li>
                <li>Refunds are issued to your original payment method within 5-7 business days</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Partial Refunds</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For annual subscriptions used for more than 30 days, we offer prorated refunds 
                based on the unused portion of your subscription period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Happens After a Refund</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Once a refund is processed:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Your paid subscription will be cancelled immediately</li>
                <li>You can continue using the free Starter plan</li>
                <li>Your data will be preserved for 30 days in case you change your mind</li>
                <li>You can re-subscribe at any time without penalty</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Alternative Solutions</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Before requesting a refund, consider these alternatives:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Downgrade to a lower plan that better fits your needs</li>
                <li>Contact support for help with any technical issues</li>
                <li>Request personalized onboarding assistance</li>
                <li>Pause your subscription for up to 3 months</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                Have questions about our refund policy or need to request a refund? 
                We're here to help at <a href="mailto:refunds@classpace.com" className="text-purple-600 hover:text-purple-800">refunds@classpace.com</a> 
                or through our <button onClick={() => navigate("/support")} className="text-purple-600 hover:text-purple-800 underline">support center</button>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Refunds;
