import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Crown, CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const STUDENT_PREMIUM_PRICE_ID = "price_1SMp6qBm9rSu4II6dNW4WBj8";

export const StudentSubscriptionCard = () => {
  const { toast } = useToast();
  const { subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const isStudentPremium = subscription?.tier === 'student_premium';

  const handleSubscribe = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 p-5 border-b border-purple-500/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center text-white">
            <Crown className="mr-2 h-5 w-5" />
            {isStudentPremium ? 'Learn +' : 'Upgrade to Learn +'}
          </CardTitle>
          {isStudentPremium && (
            <Badge className="bg-white text-purple-600 hover:bg-white text-xs px-2 py-0.5">Active</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
            <span className="text-xs text-foreground/80 leading-relaxed">Unlimited AI tutoring with Phoenix</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
            <span className="text-xs text-foreground/80 leading-relaxed">Advanced homework image analysis</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
            <span className="text-xs text-foreground/80 leading-relaxed">Personalized learning insights</span>
          </div>
        </div>
        
        {!isStudentPremium && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-foreground">$7</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
          </div>
        )}
        
        <Button 
          onClick={isStudentPremium ? handleManageSubscription : handleSubscribe}
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium"
        >
          {loading ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : isStudentPremium ? (
            <CreditCard className="mr-2 h-3.5 w-3.5" />
          ) : (
            <Crown className="mr-2 h-3.5 w-3.5" />
          )}
          {loading ? 'Loading...' : isStudentPremium ? 'Manage Plan' : 'Upgrade Now'}
        </Button>
      </CardContent>
    </Card>
  );
};