"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth, db } from '@/lib/supabase';
import { useToastNotification } from '@/hooks/useToastNotification';

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  employee_code?: string;
  phone_number?: string;
  status?: string;
  role_id?: string;
  manager_id?: string;
  department_id?: string;
  departments?: { department_name: string };
  roles?: { role_name: string };
  managers?: { full_name: string; email: string };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  verifyOtp: (email: string, token: string) => Promise<{ data: any; error: any }>;
  resendOtp: (email: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  checkUserExists: (email: string) => Promise<{ exists: boolean; userType?: string; userData?: any }>;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastNotification();

  // Load user profile when user changes
  const persistUserProfile = async (supabaseUser: User | null | undefined) => {
    if (!supabaseUser?.id) return;

    try {
      const response = await fetch('/api/v1/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: supabaseUser.id,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        console.warn('Failed to sync user profile', result?.detail || response.statusText);
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
    }
  };

  const loadUserProfile = async (supabaseUser: User) => {
    if (!supabaseUser?.id) {
      setUserProfile(null);
      return;
    }

    await persistUserProfile(supabaseUser);

    const userId = supabaseUser.id;
    try {
      // Try to get user profile first
      const { data: userProfile, error: userError } = await db.getUserProfile(userId);
      if (!userError && userProfile) {
        setUserProfile(userProfile);
        return;
      }

      // If not a regular user, try admin
      const { data: adminProfile, error: adminError } = await db.getAdminProfile(userId);
      if (!adminError && adminProfile) {
        setUserProfile({
          user_id: adminProfile.admin_id,
          full_name: adminProfile.full_name,
          email: adminProfile.email,
          phone_number: adminProfile.phone_number,
          status: 'active',
          role_id: adminProfile.role_id,
          roles: adminProfile.roles
        });
        return;
      }

      // If not an admin, try manager
      const { data: managerProfile, error: managerError } = await db.getManagerProfile(userId);
      if (!managerError && managerProfile) {
        setUserProfile({
          user_id: managerProfile.manager_id,
          full_name: managerProfile.full_name,
          email: managerProfile.email,
          phone_number: managerProfile.phone_number,
          status: 'active',
          role_id: managerProfile.role_id,
          roles: managerProfile.roles
        });
        return;
      }

      setUserProfile(null);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { session } = await auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const result = await auth.signUp(email, password, userData);
      if (result.error) {
        showToast('error', 'Signup Failed', result.error.message);
      } else {
        showToast('info', 'Verification Code Sent', 'Please check your email and verify with the OTP to complete account creation');
      }
      return result;
    } catch (error) {
      showToast('error', 'Signup Failed', 'An unexpected error occurred');
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await auth.signIn(email, password);
      if (result.error) {
        showToast('error', 'Login Failed', result.error.message);
      } else {
        showToast('success', 'Welcome Back', `Welcome back, ${result.data.user?.user_metadata?.full_name || 'User'}!`);
        if (result.data.user) {
          await loadUserProfile(result.data.user);
        }
      }
      return result;
    } catch (error) {
      showToast('error', 'Login Failed', 'An unexpected error occurred');
      return { data: null, error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await auth.signInWithGoogle();
      if (result.error) {
        showToast('error', 'Google Authentication Failed', result.error.message);
      }
      return result;
    } catch (error) {
      showToast('error', 'Google Authentication Failed', 'An unexpected error occurred');
      return { data: null, error };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      console.log('AuthContext: Starting OTP verification for email:', email);
      const result = await auth.verifyOtp(email, token);
      console.log('AuthContext: OTP verification result:', { data: result.data, error: result.error });
      
      if (result.error) {
        console.log('AuthContext: OTP verification failed:', result.error);
        
        // Provide specific error messages for OTP issues
        let errorMessage = result.error.message;
        if (result.error.message?.includes('expired')) {
          errorMessage = 'OTP has expired. Please request a new code.';
        } else if (result.error.message?.includes('invalid')) {
          errorMessage = 'Invalid OTP code. Please check and try again.';
        }
        
        showToast('error', 'Verification Failed', errorMessage);
      } else {
        console.log('AuthContext: OTP verification successful');
        showToast('success', 'Account Verified', 'Your account has been successfully verified!');
        
        // Backend handles user profile creation and activity logging
      }
      return result;
    } catch (error) {
      console.error('AuthContext: OTP verification error:', error);
      showToast('error', 'Verification Failed', 'An unexpected error occurred');
      return { data: null, error };
    }
  };

  const resendOtp = async (email: string) => {
    try {
      const result = await auth.resendOtp(email);
      if (result.error) {
        showToast('error', 'Resend Failed', result.error.message);
      } else {
        showToast('success', 'Code Resent', 'A new verification code has been sent to your email');
      }
      return result;
    } catch (error) {
      showToast('error', 'Resend Failed', 'An unexpected error occurred');
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const result = await auth.signOut();
      if (result.error) {
        showToast('error', 'Logout Failed', result.error.message);
      } else {
        showToast('info', 'Logged Out', 'You have been successfully logged out');
      }
      return result;
    } catch (error) {
      showToast('error', 'Logout Failed', 'An unexpected error occurred');
      return { error };
    }
  };

  const checkUserExists = async (email: string) => {
    try {
      // Check in users table
      const { data: userData, error: userError } = await db.checkUserExists(email);
      if (!userError && userData) {
        return { exists: true, userType: 'user', userData };
      }

      // Check in admins table
      const { data: adminData, error: adminError } = await db.checkAdminExists(email);
      if (!adminError && adminData) {
        return { exists: true, userType: 'admin', userData: adminData };
      }

      // Check in managers table
      const { data: managerData, error: managerError } = await db.checkManagerExists(email);
      if (!managerError && managerData) {
        return { exists: true, userType: 'manager', userData: managerData };
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking user existence:', error);
      return { exists: false };
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    verifyOtp,
    resendOtp,
    signOut,
    checkUserExists,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
