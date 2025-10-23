
import React, { createContext, useContext, useEffect, useState } from 'react';
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
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
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
    if (!session) return;
    
    try {
      setCheckingSubscription(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription({ subscribed: false, tier: 'free', product_id: null, subscription_end: null });
        return;
      }
      
      setSubscription(data as Subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({ subscribed: false, tier: 'free', product_id: null, subscription_end: null });
    } finally {
      setCheckingSubscription(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to prevent potential deadlocks
          setTimeout(() => {
            fetchProfile(session.user.id);
            refreshSubscription();
          }, 0);
        } else {
          setProfile(null);
          setSubscription(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
          refreshSubscription();
        }, 0);
      }
      setLoading(false);
    });

    // Set up periodic subscription check (every 5 minutes to avoid rate limits)
    const subscriptionInterval = setInterval(() => {
      if (session) {
        refreshSubscription();
      }
    }, 300000);

    return () => {
      subscription.unsubscribe();
      clearInterval(subscriptionInterval);
    };
  }, [session]);

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

  const value = {
    user,
    session,
    profile,
    subscription,
    loading,
    checkingSubscription,
    signIn,
    signUp,
    signOut,
    refreshSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
