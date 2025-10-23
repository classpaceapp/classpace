import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, Check, Sparkles, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const SubscriptionCard: React.FC = () => {
  const { subscription, checkingSubscription, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
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

  if (checkingSubscription || !subscription) {
    return (
      <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
          <Skeleton className="h-6 w-32 bg-white/20" />
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isPremium = subscription.subscribed && subscription.tier === 'premium';

  return (
    <Card className={`border-0 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden ${
      isPremium ? 'ring-2 ring-purple-500' : ''
    }`}>
      <CardHeader className={`p-6 ${
        isPremium 
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
          : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl ${
              isPremium ? 'bg-white/20' : 'bg-white/20'
            } flex items-center justify-center`}>
              {isPremium ? <Crown className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                {isPremium ? 'Premium' : 'Free Tier'}
              </CardTitle>
              <CardDescription className="text-white/80">
                {isPremium ? 'All features unlocked' : 'Basic features'}
              </CardDescription>
            </div>
          </div>
          {isPremium && (
            <Badge className="bg-white text-purple-600 hover:bg-white/90 font-semibold">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 bg-white/80">
        {isPremium ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">Your benefits:</p>
              <ul className="space-y-2">
                {[
                  'Unlimited pods',
                  'AI teaching assistant',
                  'Advanced analytics',
                  'Priority support',
                  'Custom branding'
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {subscription.subscription_end && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Renews on{' '}
                  <span className="font-semibold text-gray-900">
                    {new Date(subscription.subscription_end).toLocaleDateString()}
                  </span>
                </p>
              </div>
            )}
            
            <Button
              onClick={handleManageSubscription}
              disabled={loading}
              variant="outline"
              className="w-full mt-4"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {loading ? 'Loading...' : 'Manage Subscription'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">Upgrade to Premium for:</p>
              <ul className="space-y-2">
                {[
                  'Unlimited pods',
                  'AI teaching assistant',
                  'Advanced analytics',
                  'Priority support',
                  'Custom branding'
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-4xl font-bold text-gray-900">$7</span>
                <span className="text-gray-600">/month</span>
              </div>
              
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Crown className="mr-2 h-4 w-4" />
                {loading ? 'Loading...' : 'Upgrade to Premium'}
              </Button>
            </div>
          </div>
        )}
        
        <Button
          onClick={() => refreshSubscription()}
          variant="ghost"
          size="sm"
          disabled={checkingSubscription}
          className="w-full mt-4 text-gray-600"
        >
          {checkingSubscription ? 'Checking...' : 'Refresh Status'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
