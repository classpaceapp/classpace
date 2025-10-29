import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, CreditCard, Loader2, Sparkles, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Teach+ price ID from Stripe (newly created $7/month)
const TEACHER_PREMIUM_PRICE_ID = "price_1SNO6xBqopIR0Kr5ARdg91Ak";

const SubscriptionCard: React.FC = () => {
  const { subscription, checkingSubscription, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [justCancelledAt, setJustCancelledAt] = useState<string | null>(null);
  const isCancelled = subscription?.cancel_at_period_end || !!justCancelledAt;

  const handleUpgrade = async () => {
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
          
          if (!subError && subData?.subscribed && subData?.tier === 'teacher_premium') {
            if (intervalId) window.clearInterval(intervalId);
            if (timeoutId) window.clearTimeout(timeoutId);
            toast({
              title: 'Plan activated',
              description: 'Teach + is now active. Enjoy premium features!',
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
        body: { isStudent: false }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        try {
          localStorage.setItem('checkout_in_progress', 'true');
          localStorage.setItem('checkout_role', 'teacher');
        } catch {}
        window.open(data.url, '_blank');
        toast({
          title: 'Redirecting to checkout',
          description: "Complete your subscription in the new tab. We'll update your plan automatically.",
        });
        startPolling();
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Failed to start checkout',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Cancel your Teach+ subscription? You\'ll keep access until your renewal date.')) {
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');

      if (error) throw error;

      const cancelAtIso = data?.cancel_at as string | undefined;
      if (cancelAtIso) setJustCancelledAt(cancelAtIso);

      toast({
        title: "Subscription cancelled",
        description: `Access continues until ${new Date((cancelAtIso || data?.cancel_at)).toLocaleDateString()}`,
      });
      
      await refreshSubscription?.();
      setTimeout(() => {
        refreshSubscription?.();
      }, 1200);
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

  const handleResumeSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('resume-subscription');
      if (error) throw error;
      toast({
        title: 'Subscription resumed',
        description: data?.next_renewal ? `Next renewal on ${new Date(data.next_renewal).toLocaleDateString()}` : 'Resumed successfully',
      });
      setTimeout(async () => {
        await refreshSubscription?.();
      }, 300);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resume subscription',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const isPremium = subscription?.subscribed && subscription?.tier === 'teacher_premium';

  return (
    <>
      {checkingSubscription ? (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : (
        <Card className="relative overflow-hidden bg-card/70 dark:bg-card/40 border border-border/60 shadow-2xl transition-all duration-300 backdrop-blur-sm">
          <CardContent className="relative p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    Teach +
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">Unlimited Potential</p>
                </div>
              </div>
              {isPremium ? (
                <Badge className="bg-primary text-primary-foreground border-0 px-4 py-1.5 text-sm font-bold shadow-lg">
                  ✓ Active
                </Badge>
              ) : (
                <div className="text-right bg-gradient-to-br from-blue-500/20 to-purple-500/20 px-5 py-3 rounded-xl border-2 border-blue-500/30 shadow-lg">
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">$7</p>
                  <p className="text-xs text-muted-foreground font-semibold">per month</p>
                </div>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 bg-muted/20 rounded-xl p-3 border border-border/20">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-blue-500/30">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 font-bold" />
                </div>
                <span className="text-sm text-foreground font-medium leading-relaxed">Unlimited AI Pods</span>
              </li>
              <li className="flex items-start gap-3 bg-muted/20 rounded-xl p-3 border border-border/20">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-blue-500/30">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 font-bold" />
                </div>
                <span className="text-sm text-foreground font-medium leading-relaxed">Advanced teaching assistant</span>
              </li>
              <li className="flex items-start gap-3 bg-muted/20 rounded-xl p-3 border border-border/20">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-blue-500/30">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 font-bold" />
                </div>
                <span className="text-sm text-foreground font-medium leading-relaxed">Comprehensive analytics</span>
              </li>
            </ul>

            {isPremium && !subscription?.cancel_at_period_end ? (
              <Button 
                onClick={handleCancelSubscription}
                disabled={loading}
                variant="destructive"
                className="w-full shadow-xl hover:shadow-2xl transition-all py-6 text-base font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : null}
                {loading ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            ) : isPremium && subscription?.cancel_at_period_end ? (
              <Button 
                onClick={handleResumeSubscription}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl hover:shadow-2xl transition-all py-6 text-base font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Crown className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Processing...' : 'Re-Upgrade'}
              </Button>
            ) : (
              <Button 
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl hover:shadow-2xl transition-all py-6 text-base font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Processing...' : 'Upgrade to Teach +'}
              </Button>
            )}
            
            {isPremium && subscription?.subscription_end && (
              <div className={`text-center py-3 px-4 rounded-xl border-2 mt-4 ${
                isCancelled 
                  ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/40 shadow-lg shadow-red-500/20' 
                  : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30'
              }`}>
                <p className="text-sm font-medium text-foreground">
                  {isCancelled ? (
                    <>Cancels on <span className="font-bold text-red-600 dark:text-red-400">
                      {new Date(justCancelledAt || subscription.subscription_end).toLocaleDateString()}
                    </span></>
                  ) : (
                    <>Renews on <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
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

export default SubscriptionCard;
