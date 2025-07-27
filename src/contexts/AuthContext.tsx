
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('[AUTH] Auth state changed:', event, session ? 'Session exists' : 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AUTH] Error getting initial session:', error);
        }
        
        if (!mounted) return;
        
        console.log('[AUTH] Initial session loaded:', session ? 'Session exists' : 'No session');
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('[AUTH] Failed to get initial session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[AUTH] Sign in error:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('[AUTH] Sign in exception:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('[AUTH] Starting sign up process for:', email);
      
      const redirectUrl = `${window.location.origin}/`;
      console.log('[AUTH] Using redirect URL:', redirectUrl);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || '',
          },
        },
      });
      
      if (error) {
        console.error('[AUTH] Sign up error:', error);
        // Check for specific error types
        if (error.message?.includes('User already registered')) {
          return { error: { ...error, message: 'This email is already registered. Please try signing in instead.' } };
        } else if (error.message?.includes('Database error')) {
          return { error: { ...error, message: 'There was an issue creating your account. Please try again or contact support if the problem persists.' } };
        }
      } else {
        console.log('[AUTH] Sign up successful, user created:', data?.user?.id);
      }
      
      return { error };
    } catch (error) {
      console.error('[AUTH] Sign up exception:', error);
      return { error: { message: 'An unexpected error occurred during registration. Please try again.' } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPasswordForEmail = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      console.log('[AUTH] Sending password reset email to:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error('[AUTH] Password reset error:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('[AUTH] Password reset exception:', error);
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      console.log('[AUTH] Updating user password');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        console.error('[AUTH] Password update error:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('[AUTH] Password update exception:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
