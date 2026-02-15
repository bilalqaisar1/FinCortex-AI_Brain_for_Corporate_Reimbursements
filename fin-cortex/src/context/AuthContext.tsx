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
  admin_id?: string;
  userRole?: 'admin' | 'manager' | 'user'; // Explicit role field
  bank_name?: string;
  account_number?: string;
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
  loginWithRPC: (email: string, password: string, role: string, userId?: string) => Promise<{ data: any; error: any }>;
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
  const [user, setUser] = useState<User | null>(
    process.env.NODE_ENV === 'development' ? ({ id: 'mock-manager-id', email: 'manager@mock.com' } as any) : null
  );
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(
    process.env.NODE_ENV === 'development' ? {
      user_id: 'mock-manager-id',
      full_name: 'Mock Manager (Verification)',
      email: 'manager@mock.com',
      userRole: 'manager',
      status: 'active'
    } : null
  );
  const [loading, setLoading] = useState(false);

  // MOCK FOR VERIFICATION
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Mocking manager profile active');
    }
  }, []);
  const { showToast } = useToastNotification();
  const [syncingUsers, setSyncingUsers] = useState<Set<string>>(new Set());

  // Load user profile when user changes
  const persistUserProfile = async (supabaseUser: User | null | undefined) => {
    if (!supabaseUser?.id) return null;

    // Prevent duplicate sync calls for the same user
    if (syncingUsers.has(supabaseUser.id)) {
      return null;
    }

    setSyncingUsers(prev => new Set(prev).add(supabaseUser.id));

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
        return null;
      } else {
        const result = await response.json();
        console.log('✅ User profile synced successfully:', {
          user_id: result.profile?.user_id || result.profile?.admin_id || result.profile?.manager_id,
          email: result.profile?.email,
          role: result.profile?.userRole || result.profile?.roles?.role_name || 'Not assigned',
        });

        // Return the full result object which includes profile and related data
        // sync-user returns { message:..., profile: { ...profile, admin_id, userRole, departments, manager, ... } }
        const profileData = result.profile || result.user || result.data || null;
        if (profileData) {
          console.log('📋 Synced profile includes:', {
            admin_id: profileData.admin_id,
            userRole: profileData.userRole,
            departments: profileData.departments,
            manager: profileData.manager
          });
        }
        // Return the full result so we can access profile, departments, manager, etc.
        return result;
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
      return null;
    } finally {
      // Remove from syncing set after a delay to allow for legitimate re-syncs
      setTimeout(() => {
        setSyncingUsers(prev => {
          const next = new Set(prev);
          next.delete(supabaseUser.id);
          return next;
        });
      }, 2000);
    }
  };

  const loadUserProfile = async (supabaseUser: User, role?: 'admin' | 'manager' | 'user') => {
    if (!supabaseUser?.id) {
      setUserProfile(null);
      return;
    }

    // Get the synced profile first - this is the source of truth from server-side API
    const syncedProfile = await persistUserProfile(supabaseUser);

    // If we have a synced profile, use it directly (it's already validated server-side)
    if (syncedProfile) {
      // Extract data from synced profile response structure
      const profileData = syncedProfile.profile || syncedProfile;

      setUserProfile({
        user_id: profileData.user_id || profileData.manager_id || profileData.admin_id || supabaseUser.id,
        admin_id: profileData.admin_id || null,
        full_name: profileData.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
        email: profileData.email || supabaseUser.email || '',
        phone_number: profileData.phone_number || null,
        employee_code: profileData.employee_code || null,
        status: profileData.status || 'active',
        role_id: profileData.role_id?.toString() || null,
        department_id: profileData.department_id?.toString() || profileData.manager_department_id?.toString() || null,
        manager_id: profileData.manager_id || null,
        departments: profileData.departments || null,
        roles: profileData.roles || null,
        managers: profileData.manager || null,
        userRole: profileData.userRole || role || 'user'
      });

      console.log('✅ User profile loaded from synced profile:', {
        user_id: profileData.user_id || profileData.admin_id || profileData.manager_id,
        email: profileData.email,
        role: profileData.userRole || role
      });
      return;
    }

    // Fallback: Try to load from client-side database queries (may fail due to RLS)
    const userId = supabaseUser.id;
    const fallbackFullName = supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User';

    try {
      // If role is provided (from RPC), use it to determine which table to check
      if (role === 'manager') {
        const { data: managerProfile, error: managerError } = await db.getManagerProfile(userId);
        if (!managerError && managerProfile) {
          setUserProfile({
            user_id: managerProfile.manager_id,
            admin_id: (managerProfile as any).admin_id || null,
            full_name: managerProfile.full_name || fallbackFullName,
            email: managerProfile.email,
            phone_number: managerProfile.phone_number,
            status: 'active',
            role_id: managerProfile.role_id?.toString() || null,
            roles: managerProfile.roles,
            userRole: 'manager'
          });
          console.log('✅ Manager profile loaded from client query');
          return;
        }
      } else if (role === 'admin') {
        const { data: adminProfile, error: adminError } = await db.getAdminProfile(userId);
        if (!adminError && adminProfile) {
          setUserProfile({
            user_id: adminProfile.admin_id,
            admin_id: adminProfile.admin_id,
            full_name: adminProfile.full_name || fallbackFullName,
            email: adminProfile.email,
            phone_number: adminProfile.phone_number,
            status: 'active',
            role_id: adminProfile.role_id?.toString() || null,
            roles: adminProfile.roles,
            userRole: 'admin'
          });
          console.log('✅ Admin profile loaded from client query');
          return;
        }
      } else if (role === 'user') {
        const { data: userProfile, error: userError } = await db.getUserProfile(userId);
        if (!userError && userProfile) {
          setUserProfile({
            ...userProfile,
            admin_id: (userProfile as any).admin_id || null,
            full_name: userProfile.full_name || fallbackFullName,
            userRole: 'user'
          });
          console.log('✅ User profile loaded from client query');
          return;
        }
      }

      // If all queries failed, use minimal profile from Supabase user
      console.warn('⚠️ Could not load full profile, using minimal profile from Supabase user');
      setUserProfile({
        user_id: userId,
        full_name: fallbackFullName,
        email: supabaseUser.email || '',
        status: 'active',
        userRole: role || 'user'
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Use minimal profile even on error
      setUserProfile({
        user_id: userId,
        full_name: fallbackFullName,
        email: supabaseUser.email || '',
        status: 'active',
        userRole: role || 'user'
      });
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session, error } = await auth.getSession();

        // If there's an error getting the session (e.g., invalid refresh token), clear it
        if (error) {
          console.warn('Error getting session:', error);
          // Clear invalid session
          const errorMessage = error.message?.toLowerCase() || '';
          if (errorMessage.includes('refresh') || errorMessage.includes('token') || errorMessage.includes('invalid')) {
            console.warn('Invalid refresh token detected, clearing session storage');
            // Manually clear Supabase related keys from localStorage
            if (typeof window !== 'undefined') {
              Object.keys(localStorage).forEach(key => {
                if (key.includes('supabase.auth.token') || key.includes('sb-')) {
                  localStorage.removeItem(key);
                }
              });
            }
            await supabase.auth.signOut().catch(() => { });
          }
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setSession(null);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          // Skip INITIAL_SESSION event to avoid duplicate sync (already handled by getInitialSession)
          if (event === 'INITIAL_SESSION') {
            return;
          }

          // Handle different auth events
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setUserProfile(null);
            setSyncingUsers(new Set());
          } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            // Only reload if user ID changed
            const userIdChanged = session?.user?.id !== user?.id;
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user && userIdChanged) {
              await loadUserProfile(session.user);
            } else if (!session?.user) {
              setUserProfile(null);
            }
          } else if (event === 'TOKEN_REFRESHED') {
            // Don't reload profile on token refresh - user hasn't changed
            setSession(session);
            setUser(session?.user ?? null);
          } else {
            // For other events, only reload if user ID changed
            const userIdChanged = session?.user?.id !== user?.id;
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user && userIdChanged) {
              await loadUserProfile(session.user);
            } else if (!session?.user) {
              setUserProfile(null);
            }
          }
        } catch (error: any) {
          // Handle refresh token errors and other auth errors
          console.warn('Auth state change error:', error);
          const errorMessage = error?.message?.toLowerCase() || '';
          if (errorMessage.includes('refresh') || errorMessage.includes('token') || errorMessage.includes('invalid')) {
            console.warn('Invalid refresh token detected in onAuthStateChange, clearing session storage');
            // Manually clear Supabase related keys from localStorage
            if (typeof window !== 'undefined') {
              Object.keys(localStorage).forEach(key => {
                if (key.includes('supabase.auth.token') || key.includes('sb-')) {
                  localStorage.removeItem(key);
                }
              });
            }
            try {
              await supabase.auth.signOut().catch(() => { });
            } catch (signOutError) {
              // Silently handle sign out errors
            }
            setSession(null);
            setUser(null);
            setUserProfile(null);
          }
        } finally {
          setLoading(false);
        }
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
        showToast('success', 'Account Created', 'Your account has been created successfully!');
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
        showToast('success', 'Welcome Back', `Welcome back, ${result.data?.user?.user_metadata?.full_name || 'User'}!`);
        if (result.data?.user) {
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

  const loginWithRPC = async (email: string, password: string, role: string, userId?: string) => {
    try {
      // If userId is provided (from RPC response), use it directly
      // Otherwise, try to sign in with Supabase Auth first
      if (userId) {
        console.log('✅ Using UUID from RPC response:', userId);

        // Try to sign in with Supabase Auth first (user might exist in auth.users)
        const authResult = await auth.signIn(email, password);

        if (!authResult.error && authResult.data?.user) {
          // User exists in auth.users, use it
          setUser(authResult.data.user);
          await loadUserProfile(authResult.data.user, role as 'admin' | 'manager' | 'user');
          return authResult;
        }

        // User doesn't exist in auth.users but exists in database
        // Query database directly using UUID via sync-user API
        try {
          // Create a minimal user object for context
          const dbUser = {
            id: userId,
            email: email,
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            app_metadata: {
              provider: 'email',
              providers: ['email']
            },
            user_metadata: {
              role: role
            }
          } as User;

          // Load profile using sync-user API route (server-side)
          await loadUserProfile(dbUser, role as 'admin' | 'manager' | 'user');

          setUser(dbUser);
          return {
            data: {
              user: dbUser,
              session: null
            },
            error: null
          };
        } catch (profileError: any) {
          console.error('❌ Failed to load user profile:', profileError);
          // Don't fail login if profile loading fails - user can still access with minimal profile
          console.warn('⚠️ Continuing with minimal profile due to error:', profileError?.message);
          // Profile will be set to minimal in loadUserProfile catch block
        }
      }

      // Fallback: Try Supabase Auth sign-in
      const result = await auth.signIn(email, password);

      if (result.error) {
        // User doesn't exist in auth.users
        return {
          data: null,
          error: {
            message: 'User account not found in authentication system. Please contact your administrator to set up your account.'
          }
        };
      }

      // Load user profile after successful login with role information
      if (result.data?.user) {
        console.log('✅ Supabase sign-in successful, loading profile with role:', role);
        await loadUserProfile(result.data.user, role as 'admin' | 'manager' | 'user');
      }

      return result;
    } catch (error) {
      console.error('Error in loginWithRPC:', error);
      return {
        data: null,
        error: { message: 'An unexpected error occurred during login' }
      };
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
    loginWithRPC,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
