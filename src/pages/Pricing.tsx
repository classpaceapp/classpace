
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, Star, Zap, Crown } from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();

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
      price: "$19",
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
    },
    {
      name: "Institution",
      price: "$99",
      period: "/month",
      description: "For schools and organizations",
      icon: Crown,
      features: [
        "Everything in Educator",
        "Unlimited students",
        "Admin dashboard",
        "Bulk user management",
        "Custom branding",
        "Advanced analytics",
        "API access",
        "Dedicated support manager",
        "Custom integrations"
      ],
      buttonText: "Contact Sales",
      popular: false
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

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-main bg-clip-text text-transparent mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your teaching needs. All plans include our core AI features.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={index} 
                className={`relative border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-main text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    plan.popular ? 'bg-gradient-main' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-8 h-8 ${plan.popular ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-gray-600">{plan.period}</span>}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full py-3 ${
                      plan.popular 
                        ? 'bg-gradient-main hover:opacity-90 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
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

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-700">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any charges accordingly.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Is there a free trial?
              </h3>
              <p className="text-gray-700">
                The Educator plan comes with a 14-day free trial. No credit card required to get started. 
                The Starter plan is always free with basic features.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                What happens to my data if I cancel?
              </h3>
              <p className="text-gray-700">
                You can export all your data at any time. After cancellation, your data is retained for 30 days 
                before being permanently deleted, giving you time to reconsider or export your content.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Do you offer discounts for schools?
              </h3>
              <p className="text-gray-700">
                Yes! We offer special pricing for educational institutions, nonprofits, and bulk purchases. 
                Contact our sales team for a custom quote.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
