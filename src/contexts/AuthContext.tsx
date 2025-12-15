
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  role: 'teacher' | 'learner';
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  date_of_birth?: string | null; // ISO date string
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  subscribed: boolean;
  tier: string;
  product_id: string | null;
  subscription_end: string | null;
  cancel_at_period_end?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  checkingSubscription: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, role: 'teacher' | 'learner', firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  completeGoogleSignUp: (role: 'teacher' | 'learner', firstName: string, lastName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const { toast } = useToast();
  const isCheckingRef = useRef(false);
  const sessionRef = useRef<Session | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshSubscription = async () => {
    if (!sessionRef.current) return;
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    
    try {
      setCheckingSubscription(true);
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No access token available');
        setSubscription({ subscribed: false, tier: 'free', product_id: null, subscription_end: null, cancel_at_period_end: false });
        return;
      }
      
      // Call edge function with explicit auth header
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription({ subscribed: false, tier: 'free', product_id: null, subscription_end: null, cancel_at_period_end: false });
        return;
      }
      
      const normalized: Subscription = {
        subscribed: Boolean((data as any)?.subscribed),
        tier: (data as any)?.tier || 'free',
        product_id: (data as any)?.product_id ?? null,
        subscription_end: (data as any)?.subscription_end ?? null,
        cancel_at_period_end: Boolean((data as any)?.cancel_at_period_end)
      };
      setSubscription(normalized);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({ subscribed: false, tier: 'free', product_id: null, subscription_end: null, cancel_at_period_end: false });
    } finally {
      setCheckingSubscription(false);
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    // Auth state listener (mount once)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, sess) => {
      console.log('Auth state change:', event, sess);
      setSession(sess);
      sessionRef.current = sess;
      setUser(sess?.user ?? null);
      
      if (sess?.user) {
        // Defer Supabase calls to prevent deadlocks
        setTimeout(() => {
          fetchProfile(sess.user.id);
          refreshSubscription();
        }, 0);
      } else {
        setProfile(null);
        setSubscription(null);
      }
      setLoading(false);
    });

    // Initialize with existing session
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      sessionRef.current = current;
      setUser(current?.user ?? null);
      if (current?.user) {
        setTimeout(() => {
          fetchProfile(current.user.id);
          refreshSubscription();
        }, 0);
      }
      setLoading(false);
    });

    // Periodic subscription refresh (every 5 minutes)
    const id = window.setInterval(() => {
      if (sessionRef.current) {
        refreshSubscription();
      }
    }, 300000);

    return () => {
      authSub.unsubscribe();
      clearInterval(id);
    };
  }, []);

  // Realtime sync for profile so changes reflect instantly everywhere
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('realtime:profiles')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        if (payload.new) {
          setProfile(payload.new as Profile);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Cross-tab subscription refresh: when checkout completes in another tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'checkout_completed' && e.newValue) {
        refreshSubscription();
        try {
          localStorage.removeItem('checkout_in_progress');
          localStorage.removeItem('checkout_completed');
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);

    // Initial check in case we loaded after completion
    try {
      if (localStorage.getItem('checkout_completed')) {
        refreshSubscription();
        localStorage.removeItem('checkout_in_progress');
        localStorage.removeItem('checkout_completed');
      }
    } catch {}

    return () => window.removeEventListener('storage', onStorage);
  }, [refreshSubscription]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    role: 'teacher' | 'learner',
    firstName?: string,
    lastName?: string
  ) => {
    try {
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role,
            first_name: firstName || '',
            last_name: lastName || '',
          }
        }
      });

      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      if (data.user && !data.session) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
          duration: 6000,
        });
      } else {
        toast({
          title: "Welcome to Classpace!",
          description: `Your ${role} account has been created successfully.`,
        });
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/login`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      });

      if (error) {
        toast({
          title: "Google Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Google Sign In Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleSignUp = async (role: 'teacher' | 'learner', firstName: string, lastName: string) => {
    if (!user?.id) {
      return { error: new Error('No user found') };
    }

    try {
      // Update the profile with the selected role and provided names
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role,
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Failed to set role",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Refresh profile to get the updated role
      await fetchProfile(user.id);

      toast({
        title: "Welcome to Classpace!",
        description: `Your ${role} account is ready.`,
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Failed to set role",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clean up local state first
      setUser(null);
      setSession(null);
      setProfile(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
      }

      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });

      // Force page refresh to ensure clean state
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error during sign out:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    setProfile((prev) => {
      if (prev) return { ...prev, ...updates } as Profile;
      return prev;
    });
  };

  const value = {
    user,
    session,
    profile,
    subscription,
    loading,
    checkingSubscription,
    signIn,
    signUp,
    signInWithGoogle,
    completeGoogleSignUp,
    signOut,
    refreshSubscription,
    refreshProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
