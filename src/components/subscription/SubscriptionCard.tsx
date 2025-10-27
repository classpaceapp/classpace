import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, CreditCard, Loader2 } from 'lucide-react';
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

  const isPremium = subscription?.subscribed && subscription?.tier === 'teacher_premium';

  return (
    <>
      {checkingSubscription ? (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : isPremium ? (
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 border-b border-blue-500/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center text-white">
                <Crown className="mr-2 h-5 w-5" />
                Teach +
              </CardTitle>
              <Badge className="bg-white text-blue-600 hover:bg-white text-xs px-2 py-0.5">Active</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                <span className="text-xs text-foreground/80 leading-relaxed">Unlimited AI Pods</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                <span className="text-xs text-foreground/80 leading-relaxed">Advanced teaching assistant</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                <span className="text-xs text-foreground/80 leading-relaxed">Comprehensive analytics</span>
              </div>
            </div>
            
            <Button 
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium"
            >
              {loading ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-3.5 w-3.5" />
              )}
              {loading ? 'Loading...' : 'Manage Subscription'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 border-b border-blue-500/30">
            <CardTitle className="text-base font-bold flex items-center text-white">
              <Crown className="mr-2 h-5 w-5" />
              Upgrade to Teach +
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                <span className="text-xs text-foreground/80 leading-relaxed">Unlimited AI Pods</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                <span className="text-xs text-foreground/80 leading-relaxed">Advanced teaching assistant</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                <span className="text-xs text-foreground/80 leading-relaxed">Comprehensive analytics</span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold text-foreground">$7</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
            </div>
            
            <Button 
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium"
            >
              {loading ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crown className="mr-2 h-3.5 w-3.5" />
              )}
              {loading ? 'Loading...' : 'Upgrade Now'}
            </Button>
            
            <Button
              onClick={() => refreshSubscription()}
              variant="outline"
              disabled={checkingSubscription}
              className="w-full py-2 text-sm"
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
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default SubscriptionCard;
