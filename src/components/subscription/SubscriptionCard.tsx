import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, CreditCard, Loader2, Sparkles, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const TEACHER_PREMIUM_PRICE_ID = "price_1SN0ySBm9rSu4II6Olw734Ke";

const SubscriptionCard: React.FC = () => {
  const { subscription, checkingSubscription, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    const startPolling = () => {
      const start = Date.now();
      intervalId = window.setInterval(async () => {
        try {
          const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription');
          if (!subError && subData?.subscribed) {
            // If the backend returns a tier, verify it's teacher_premium; otherwise accept subscribed
            if (!subData?.tier || subData.tier === 'teacher_premium') {
              if (intervalId) window.clearInterval(intervalId);
              if (timeoutId) window.clearTimeout(timeoutId);
              toast({
                title: 'Plan activated',
                description: 'Teach + is now active. Enjoy premium features!',
              });
              // Refresh global auth state
              try { await refreshSubscription?.(); } catch {}
            }
          }
        } catch {}
        // Stop after 5 minutes
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

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Opening subscription portal",
          description: "Manage your subscription in the new tab.",
        });
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Failed to open portal",
        description: error.message || "Please try again later.",
        variant: "destructive",
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
        <Card className="bg-gradient-to-br from-card/60 to-card/40 border-2 border-blue-500/30 hover:border-blue-500/50 shadow-2xl hover:shadow-blue-500/20 transition-all backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Teach +
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">Unlimited Potential</p>
                </div>
              </div>
              {isPremium ? (
                <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 hover:from-green-500/30 hover:to-emerald-500/30 border-2 border-green-500/30 px-3 py-1 text-sm">
                  Active
                </Badge>
              ) : (
                <div className="text-right bg-gradient-to-br from-blue-500/10 to-purple-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
                  <p className="text-3xl font-bold text-foreground">$7</p>
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

            <Button 
              onClick={isPremium ? handleManageSubscription : handleUpgrade}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all py-6 text-base font-semibold"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : isPremium ? (
                <CreditCard className="w-5 h-5 mr-2" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Processing...' : isPremium ? 'Manage Subscription' : 'Upgrade to Teach +'}
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default SubscriptionCard;
