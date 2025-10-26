import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Crown, Zap, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const STUDENT_PREMIUM_PRICE_ID = "price_student_premium";

export const StudentSubscriptionCard = () => {
  const { toast } = useToast();
  const { subscription } = useAuth();
  const isStudentPremium = subscription?.tier === 'student_premium';

  const handleSubscribe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: STUDENT_PREMIUM_PRICE_ID, isStudent: true }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive"
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {isStudentPremium ? 'Student Premium' : 'Upgrade to Premium'}
              </CardTitle>
              <CardDescription>
                {isStudentPremium ? 'You have access to all premium features' : 'Unlock advanced learning features'}
              </CardDescription>
            </div>
          </div>
          {isStudentPremium && (
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-gray-700">AI-powered personalized learning</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-gray-700">Unlimited chat history storage</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-gray-700">Priority AI response time</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-gray-700">Advanced image analysis</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-gray-700">Early access to new features</span>
          </div>
        </div>

        <div className="pt-4 border-t border-purple-200">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                $7
              </span>
              <span className="text-gray-600 ml-2">/month</span>
            </div>
            <Zap className="h-8 w-8 text-purple-600" />
          </div>

          {isStudentPremium ? (
            <Button 
              onClick={handleManageSubscription}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Manage Subscription
            </Button>
          ) : (
            <Button 
              onClick={handleSubscribe}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Upgrade Now
            </Button>
          )}
        </div>

        {subscription?.subscription_end && isStudentPremium && (
          <p className="text-sm text-gray-600 text-center">
            Renews on {new Date(subscription.subscription_end).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};