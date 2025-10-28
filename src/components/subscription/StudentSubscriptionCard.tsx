import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Crown, CreditCard, Loader2, Sparkles, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

// Learn+ price ID from Stripe (TEST MODE)
const STUDENT_PREMIUM_PRICE_ID = "price_1SNJpbBqopIR0Kr54nRPftUJ";

export const StudentSubscriptionCard = () => {
  const { toast } = useToast();
  const { subscription, checkingSubscription, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const isStudentPremium = subscription?.tier === 'student_premium';

  const handleSubscribe = async () => {
    setLoading(true);
    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    const startPolling = () => {
      const start = Date.now();
      // Poll every 2 seconds instead of 4 for faster detection
      intervalId = window.setInterval(async () => {
        try {
          const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription');
          console.log('[SUBSCRIPTION-POLLING]', { subData, subError });
          
          if (!subError && subData?.subscribed && subData?.tier === 'student_premium') {
            if (intervalId) window.clearInterval(intervalId);
            if (timeoutId) window.clearTimeout(timeoutId);
            toast({
              title: 'Plan activated',
              description: 'Learn + is now active. Enjoy premium features!',
            });
            // Force refresh subscription state
            await refreshSubscription?.();
            setLoading(false);
          }
        } catch (err) {
          console.error('[SUBSCRIPTION-POLLING] Error:', err);
        }
        // Stop after 5 minutes
        if (Date.now() - start > 5 * 60 * 1000) {
          if (intervalId) window.clearInterval(intervalId);
          setLoading(false);
        }
      }, 2000);  // Poll every 2 seconds

      timeoutId = window.setTimeout(() => {
        if (intervalId) window.clearInterval(intervalId);
        setLoading(false);
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

  const handleCancelSubscription = async () => {
    if (!confirm('Cancel your Learn+ subscription? You\'ll keep access until your renewal date.')) {
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');

      if (error) throw error;

      toast({
        title: "Subscription cancelled",
        description: `Access continues until ${new Date(data.cancel_at).toLocaleDateString()}`,
      });
      
      await refreshSubscription();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {checkingSubscription ? (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : (
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-orange-600/10 dark:from-purple-500/20 dark:via-pink-500/20 dark:to-orange-500/20 border-2 border-purple-500/40 hover:border-purple-500/60 shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-orange-500/5 animate-pulse" />
          <CardContent className="relative p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-pink-500/40 animate-pulse">
              {isStudentPremium ? <Crown className="w-8 h-8 text-white" /> : <Sparkles className="w-8 h-8 text-white" />}
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
                Learn +
              </h3>
              <p className="text-sm text-muted-foreground font-medium">Enhanced Learning</p>
            </div>
          </div>
          {isStudentPremium ? (
            <Badge className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white border-0 px-4 py-1.5 text-sm font-bold shadow-lg shadow-emerald-500/30 animate-pulse">
              ✓ Active
            </Badge>
          ) : (
            <div className="text-right bg-gradient-to-br from-purple-500/20 to-pink-500/20 px-5 py-3 rounded-xl border-2 border-purple-500/30 shadow-lg">
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">$7</p>
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

        {isStudentPremium && !subscription?.cancel_at_period_end ? (
          <Button 
            onClick={handleCancelSubscription}
            disabled={loading}
            variant="destructive"
            className="w-full shadow-xl hover:shadow-2xl transition-all py-6 text-base font-semibold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : null}
            {loading ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        ) : !isStudentPremium ? (
          <Button 
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl hover:shadow-pink-500/30 transition-all py-6 text-base font-semibold"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Processing...' : 'Upgrade to Learn +'}
          </Button>
        ) : null}
        
        {isStudentPremium && subscription?.subscription_end && (
          <div className={`text-center py-3 px-4 rounded-xl border-2 mt-4 ${
            subscription?.cancel_at_period_end 
              ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/40 shadow-lg shadow-red-500/20' 
              : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30'
          }`}>
            <p className="text-sm font-medium text-foreground">
              {subscription?.cancel_at_period_end ? (
                <>Cancels on <span className="font-bold text-red-600 dark:text-red-400">
                  {new Date(subscription.subscription_end).toLocaleDateString()}
                </span></>
              ) : (
                <>Renews on <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  {new Date(subscription.subscription_end).toLocaleDateString()}
                </span></>
              )}
            </p>
          </div>
        )}
          </CardContent>
        </Card>
      )}
    </>
  );
};
