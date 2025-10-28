import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Handles Stripe return anywhere in the app, shows success animation, refreshes plan,
// broadcasts completion to other tabs, and redirects to the correct dashboard
export const SubscriptionReturnHandler = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile, refreshSubscription } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const status = searchParams.get('subscription');
    if (!status) return;

    const roleParam = searchParams.get('role');
    const isStudent = roleParam === 'student' || profile?.role === 'learner';
    const target = isStudent ? '/student-dashboard' : '/dashboard';

    if (status === 'success') {
      try {
        localStorage.setItem('checkout_completed', Date.now().toString());
        localStorage.removeItem('checkout_in_progress');
      } catch {}

      toast({
        title: '🎉 Subscription Active!',
        description: 'Updating your plan now...',
        duration: 4000,
      });

      // Refresh immediately and then redirect
      (async () => {
        await refreshSubscription();
        toast({ title: '✓ Plan Updated', description: 'Your subscription is now active.' });
        // Clean URL and redirect
        searchParams.delete('subscription');
        searchParams.delete('role');
        setSearchParams(searchParams, { replace: true });
        navigate(target, { replace: true });
      })();
    } else if (status === 'cancelled') {
      toast({
        title: 'Subscription Cancelled',
        description: 'You cancelled the subscription process.',
        variant: 'destructive',
      });
      searchParams.delete('subscription');
      searchParams.delete('role');
      setSearchParams(searchParams, { replace: true });
      navigate(target, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
};

export default SubscriptionReturnHandler;
