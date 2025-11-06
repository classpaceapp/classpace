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

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');
      
      if (error) throw error;
      
      toast({
        title: "Subscription cancelled",
        description: `Your subscription will end on ${new Date(data.cancel_at).toLocaleDateString()}. You'll retain access until then.`,
      });
      
      await refreshSubscription();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Failed to cancel",
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
          'Unlimited Learnspace AI chats',
          'Unlimited flashcards in My Resources',
          'Unlimited quizzes in My Resources',
          'Unlimited notes in My Resources',
          'Advanced image analysis',
          'Phoenix AI tutor access',
          'Aurora Application Builder',
          'Aurora Role Search',
          'Aurora Interview Prep',
          'Join unlimited pods'
        ]
      : [
          'Join unlimited pods',
          'Learnspace AI (3 chat limit)',
          'My Resources (1 flashcard)',
          'My Resources (1 quiz)',
          'My Resources (1 note)',
          'Phoenix AI tutor access'
        ]
    : isPremium
      ? [
          'Unlimited Pods',
          'Nexus AI Command Center (full access)',
          'AI Curriculum Architect',
          'AI Lesson Orchestrator',
          'AI Assessment Hub with auto-grading',
          'Progress Analytics Dashboard',
          'Global Resource Library',
          'Student Profile Analytics',
          'Phoenix AI tutor access',
          'Aurora Application Builder',
          'Aurora Role Search',
          'Aurora Interview Prep',
          'All pod features (materials, quizzes, etc.)',
          'Unlimited students per pod'
        ]
      : [
          '1 Pod (fully functional)',
          'Materials, quizzes, flashcards',
          'Notes, whiteboards, meetings',
          'Live sessions & chat',
          'Unlimited students per pod'
        ];

  return (
    <div className="p-3 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-12">
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 md:w-8 md:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-600 bg-clip-text text-transparent inline-block leading-tight pb-1">
                My Plan
              </h1>
            </div>
          </div>
          <p className="text-sm md:text-lg text-foreground/70">
            Manage your subscription
          </p>
        </div>

        <Card className={`border-2 backdrop-blur-sm rounded-xl md:rounded-2xl overflow-hidden shadow-2xl ${
          isPremium 
            ? 'border-amber-500/30 bg-gradient-to-br from-amber-100/90 via-yellow-50/90 to-amber-100/90 dark:from-amber-900/40 dark:via-yellow-800/40 dark:to-amber-900/40 hover:shadow-amber-500/20' 
            : 'border-border/30 bg-gradient-to-br from-card/80 to-card/50'
        }`}>
          <CardHeader className={`p-4 md:p-8 border-b-2 ${
            isPremium 
              ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 border-purple-500/30' 
              : 'bg-gradient-to-r from-foreground/10 to-foreground/5 border-border/30'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg ${
                  isPremium ? 'bg-white/20' : 'bg-background/50'
                }`}>
                  {isPremium ? <Crown className="h-6 w-6 md:h-8 md:w-8 text-white" /> : <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-foreground/60" />}
                </div>
                <div>
                  <CardTitle className={`text-xl md:text-3xl font-bold ${isPremium ? 'text-white' : 'text-foreground'}`}>
                    {planName}
                  </CardTitle>
                  <CardDescription className={`text-sm md:text-base ${isPremium ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {isPremium ? 'All premium features' : 'Core features'}
                  </CardDescription>
                </div>
              </div>
              {isPremium && (
                <Badge className="bg-white text-purple-600 hover:bg-white font-bold px-3 md:px-4 py-1 md:py-2 text-sm md:text-base shadow-lg">
                  Active
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-4 md:p-8">
            <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
              <h3 className="text-base md:text-xl font-bold text-foreground flex items-center gap-2 md:gap-3">
                {isPremium ? '✓ Your benefits' : '→ Unlock with premium'}
              </h3>
              <ul className="space-y-3 md:space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 md:gap-4 bg-muted/20 rounded-lg md:rounded-xl p-3 md:p-4 border border-border/20">
                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                      isPremium ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30' : 'bg-muted border-border'
                    }`}>
                      <Check className={`h-3 w-3 md:h-4 md:w-4 font-bold ${isPremium ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    <span className="text-foreground font-medium leading-relaxed text-sm md:text-base">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {!isPremium && (
              <div className="py-6 mb-6 border-y border-border/30">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-foreground">$7</span>
                  <span className="text-xl text-muted-foreground font-medium">/month</span>
                </div>
              </div>
            )}

            {subscription?.subscription_end && isPremium && (
              <div className={`py-6 mb-6 border-y border-border/30 rounded-xl px-4 ${
                (subscription as any)?.cancel_at_period_end 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-muted/10'
              }`}>
                <p className="text-base text-foreground/80 font-medium">
                  {(subscription as any)?.cancel_at_period_end ? (
                    <>
                      <span className="text-red-600 dark:text-red-400 font-bold">Cancels</span> on{' '}
                    </>
                  ) : (
                    'Renews on '
                  )}
                  <span className="font-bold text-foreground">
                    {new Date(subscription.subscription_end).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </p>
                {(subscription as any)?.cancel_at_period_end && (
                  <p className="text-sm text-muted-foreground mt-2">
                    You'll retain access to premium features until then.
                  </p>
                )}
              </div>
            )}
            
             <div className="space-y-4">
               {isPremium && !(subscription as any)?.cancel_at_period_end ? (
                 <Button
                   onClick={handleCancelSubscription}
                   disabled={loading}
                   variant="destructive"
                   className="w-full py-6 font-bold text-base shadow-xl hover:shadow-2xl transition-all"
                 >
                   {loading ? (
                     <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                   ) : null}
                   {loading ? 'Cancelling...' : 'Cancel Subscription'}
                 </Button>
               ) : isPremium && (subscription as any)?.cancel_at_period_end ? (
                 <Button
                   onClick={async () => {
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
                       toast({ title: 'Error', description: error.message || 'Failed to resume subscription', variant: 'destructive' });
                     } finally {
                       setLoading(false);
                     }
                   }}
                   disabled={loading}
                   className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base shadow-xl hover:shadow-2xl transition-all"
                 >
                   {loading ? (
                     <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                   ) : (
                     <Crown className="mr-2 h-5 w-5" />
                   )}
                   {loading ? 'Processing...' : 'Re-Upgrade'}
                 </Button>
               ) : !isPremium ? (
                 <Button
                   onClick={handleUpgrade}
                   disabled={loading}
                   className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base shadow-xl hover:shadow-2xl transition-all"
                 >
                   {loading ? (
                     <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                   ) : (
                     <Crown className="mr-2 h-5 w-5" />
                   )}
                   {loading ? 'Loading...' : `Upgrade to ${isStudent ? 'Learn' : 'Teach'} +`}
                 </Button>
               ) : null}
               
               <Button
                 onClick={() => refreshSubscription()}
                 variant="outline"
                 disabled={checkingSubscription}
                 className="w-full py-4 border-2 font-semibold hover:bg-primary/5"
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
