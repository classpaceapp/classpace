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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            My Plan
          </h1>
          <p className="text-xl text-gray-600">
            Manage your Classpace subscription
          </p>
        </div>

        <Card className={`border-0 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden ${
          isPremium ? 'ring-2 ring-purple-500' : ''
        }`}>
          <CardHeader className={`p-8 ${
            isPremium 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
              : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                  {isPremium ? <Crown className="h-8 w-8" /> : <Sparkles className="h-8 w-8" />}
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold">
                    {planName}
                  </CardTitle>
                  <CardDescription className="text-white/80 text-lg">
                    {isPremium ? 'All features unlocked' : 'Basic features'}
                  </CardDescription>
                </div>
              </div>
              {isPremium && (
                <Badge className="bg-white text-purple-600 hover:bg-white/90 font-semibold text-lg px-4 py-2">
                  Active
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-8 bg-white/80">
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900">
                {isPremium ? 'Your benefits:' : 'Upgrade to unlock:'}
              </h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 text-lg">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {!isPremium && (
              <div className="pt-6 border-t border-gray-200 mb-6">
                <div className="flex items-baseline space-x-2 mb-6">
                  <span className="text-5xl font-bold text-gray-900">$7</span>
                  <span className="text-xl text-gray-600">/month</span>
                </div>
              </div>
            )}

            {subscription?.subscription_end && isPremium && (
              <div className="pt-6 border-t border-gray-200 mb-6">
                <p className="text-gray-700 text-lg">
                  {isPremium ? 'Renews' : 'Ends'} on{' '}
                  <span className="font-semibold text-gray-900">
                    {new Date(subscription.subscription_end).toLocaleDateString()}
                  </span>
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              {isPremium ? (
                <Button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-5 w-5" />
                  )}
                  {loading ? 'Loading...' : 'Manage Subscription'}
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Crown className="mr-2 h-5 w-5" />
                  )}
                  {loading ? 'Loading...' : `Upgrade to ${isStudent ? 'Learn' : 'Teach'} +`}
                </Button>
              )}
              
              <Button
                onClick={() => refreshSubscription()}
                variant="outline"
                disabled={checkingSubscription}
                className="w-full py-4 text-gray-700 border-2"
              >
                {checkingSubscription ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
