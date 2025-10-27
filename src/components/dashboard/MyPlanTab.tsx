import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, Check, Sparkles, CreditCard, Loader2 } from 'lucide-react';

export const MyPlanTab: React.FC = () => {
  const { subscription, checkingSubscription, refreshSubscription, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const isStudent = profile?.role === 'learner';
  const isTeacher = profile?.role === 'teacher';
  const isPremium = subscription?.subscribed && (
    subscription.tier === 'student_premium' || subscription.tier === 'teacher_premium' || subscription.tier === 'premium'
  );

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          isStudent: isStudent
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to checkout",
          description: "Complete your subscription in the new tab.",
        });
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Failed to start checkout",
        description: error.message || "Please try again later.",
        variant: "destructive",
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

  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const planName = isPremium 
    ? (isStudent ? 'Learn +' : 'Teach +')
    : 'Free Plan';

  const features = isStudent
    ? isPremium
      ? [
          'Unlimited AI tutoring with Phoenix',
          'Advanced homework image analysis',
          'Personalized learning insights',
          'Unlimited chat history storage',
          'Priority AI response time',
          'Early access to new features'
        ]
      : [
          'Join unlimited pods',
          'AI-powered Learnspace',
          'Limited chat history',
          'Core learning features',
          'Email support'
        ]
    : isPremium
      ? [
          'Unlimited AI Pods',
          'Advanced AI teaching assistant',
          'Comprehensive student analytics',
          'Priority support',
          'Faster refresh rates',
          'Bigger class sizes'
        ]
      : [
          '1 AI Pod',
          'Core features enabled',
          'Create and run sessions',
          'Invite students',
          'Email support'
        ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-3">
            My Subscription
          </h1>
          <p className="text-lg text-foreground/70">
            Manage your Classpace plan and billing
          </p>
        </div>

        <Card className={`backdrop-blur-sm rounded-2xl overflow-hidden border ${
          isPremium ? 'border-purple-500/30 bg-gradient-to-br from-purple-50/50 to-pink-50/50' : 'border-border/50 bg-card/50'
        }`}>
          <CardHeader className={`p-6 border-b ${
            isPremium 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500/30' 
              : 'bg-gradient-to-r from-foreground/5 to-foreground/10 border-border/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isPremium ? 'bg-white/20' : 'bg-background/50'
                }`}>
                  {isPremium ? <Crown className="h-6 w-6 text-white" /> : <Sparkles className="h-6 w-6 text-foreground/60" />}
                </div>
                <div>
                  <CardTitle className={`text-2xl font-bold ${isPremium ? 'text-white' : 'text-foreground'}`}>
                    {planName}
                  </CardTitle>
                  <CardDescription className={isPremium ? 'text-white/80' : 'text-muted-foreground'}>
                    {isPremium ? 'All premium features' : 'Core features'}
                  </CardDescription>
                </div>
              </div>
              {isPremium && (
                <Badge className="bg-white text-purple-600 hover:bg-white font-semibold px-3 py-1">
                  Active
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-5 mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {isPremium ? '✓ Your benefits' : '→ Unlock with premium'}
              </h3>
              <ul className="space-y-2.5">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2.5">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isPremium ? 'bg-green-100' : 'bg-muted'
                    }`}>
                      <Check className={`h-3.5 w-3.5 ${isPremium ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    <span className="text-foreground/80 text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {!isPremium && (
              <div className="py-4 mb-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold text-foreground">$7</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
              </div>
            )}

            {subscription?.subscription_end && isPremium && (
              <div className="py-4 mb-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  {isPremium ? 'Renews' : 'Ends'} on{' '}
                  <span className="font-semibold text-foreground">
                    {new Date(subscription.subscription_end).toLocaleDateString()}
                  </span>
                </p>
              </div>
            )}
            
            <div className="space-y-2.5">
              {isPremium ? (
                <Button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  {loading ? 'Loading...' : 'Manage Subscription'}
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Crown className="mr-2 h-4 w-4" />
                  )}
                  {loading ? 'Loading...' : `Upgrade to ${isStudent ? 'Learn' : 'Teach'} +`}
                </Button>
              )}
              
              <Button
                onClick={() => refreshSubscription()}
                variant="outline"
                disabled={checkingSubscription}
                className="w-full py-3 border"
              >
                {checkingSubscription ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Refresh Status'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
