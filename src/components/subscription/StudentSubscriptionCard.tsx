import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Crown, CreditCard, Loader2, Sparkles, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const STUDENT_PREMIUM_PRICE_ID = "price_1SMp6qBm9rSu4II6dNW4WBj8";

export const StudentSubscriptionCard = () => {
  const { toast } = useToast();
  const { subscription, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const isStudentPremium = subscription?.tier === 'student_premium';

  const handleSubscribe = async () => {
    setLoading(true);
    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    const startPolling = () => {
      const start = Date.now();
      intervalId = window.setInterval(async () => {
        try {
          const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription');
          if (!subError && subData?.subscribed) {
            if (!subData?.tier || subData.tier === 'student_premium') {
              if (intervalId) window.clearInterval(intervalId);
              if (timeoutId) window.clearTimeout(timeoutId);
              toast({
                title: 'Plan activated',
                description: 'Learn + is now active. Enjoy premium features!',
              });
              try { await refreshSubscription?.(); } catch {}
            }
          }
        } catch {}
        if (Date.now() - start > 5 * 60 * 1000) {
          if (intervalId) window.clearInterval(intervalId);
        }
      }, 4000);

      timeoutId = window.setTimeout(() => {
        if (intervalId) window.clearInterval(intervalId);
      }, 5 * 60 * 1000);
    };

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { isStudent: true }
      });

      if (error) throw error;

      if (data?.url) {
        try {
          localStorage.setItem('checkout_in_progress', 'true');
          localStorage.setItem('checkout_role', 'student');
        } catch {}
        window.open(data.url, '_blank');
        startPolling();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start checkout',
        variant: 'destructive'
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
    <Card className="bg-gradient-to-br from-card/60 to-card/40 border-2 border-purple-500/30 hover:border-purple-500/50 shadow-2xl hover:shadow-purple-500/20 transition-all backdrop-blur-sm">
      <CardContent className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              {isStudentPremium ? <Crown className="w-7 h-7 text-white" /> : <Sparkles className="w-7 h-7 text-white" />}
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Learn +
              </h3>
              <p className="text-sm text-muted-foreground font-medium">Enhanced Learning</p>
            </div>
          </div>
          {isStudentPremium ? (
            <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 hover:from-green-500/30 hover:to-emerald-500/30 border-2 border-green-500/30 px-3 py-1 text-sm">
              Active
            </Badge>
          ) : (
            <div className="text-right bg-gradient-to-br from-purple-500/10 to-pink-500/10 px-4 py-2 rounded-xl border border-purple-500/20">
              <p className="text-3xl font-bold text-foreground">$7</p>
              <p className="text-xs text-muted-foreground font-semibold">per month</p>
            </div>
          )}
        </div>

        <ul className="space-y-4 mb-8">
          <li className="flex items-start gap-3 bg-muted/20 rounded-xl p-3 border border-border/20">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-purple-500/30">
              <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 font-bold" />
            </div>
            <span className="text-sm text-foreground font-medium leading-relaxed">Unlimited AI tutoring with Phoenix</span>
          </li>
          <li className="flex items-start gap-3 bg-muted/20 rounded-xl p-3 border border-border/20">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-purple-500/30">
              <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 font-bold" />
            </div>
            <span className="text-sm text-foreground font-medium leading-relaxed">Advanced homework image analysis</span>
          </li>
          <li className="flex items-start gap-3 bg-muted/20 rounded-xl p-3 border border-border/20">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-purple-500/30">
              <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 font-bold" />
            </div>
            <span className="text-sm text-foreground font-medium leading-relaxed">Personalized learning insights</span>
          </li>
        </ul>

        <Button 
          onClick={isStudentPremium ? handleManageSubscription : handleSubscribe}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all py-6 text-base font-semibold"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : isStudentPremium ? (
            <CreditCard className="w-5 h-5 mr-2" />
          ) : (
            <Sparkles className="w-5 h-5 mr-2" />
          )}
          {loading ? 'Processing...' : isStudentPremium ? 'Manage Plan' : 'Upgrade to Learn +'}
        </Button>
      </CardContent>
    </Card>
  );
};
