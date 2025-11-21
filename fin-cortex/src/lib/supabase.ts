"use client";

import { supabaseClient } from "@/lib/supabase/client";

export const supabase = supabaseClient

// Auth helper functions
export const auth = {
  // Sign up with email and password - Use backend API
  async signUp(email: string, password: string, userData: { full_name: string; employee_code: string; phone_number?: string }) {
    try {
      const response = await fetch(`/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: userData.full_name,
          employee_code: userData.employee_code,
          phone_number: userData.phone_number
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: { message: result.detail || 'Signup failed' } };
      }

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Network error during signup' } };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    })
    return { data, error }
  },

  // Verify OTP - Use backend API
  async verifyOtp(email: string, token: string) {
    try {
      const response = await fetch(`/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: { message: result.detail || 'OTP verification failed' } };
      }

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Network error during OTP verification' } };
    }
  },

  // Resend OTP - Use backend API
  async resendOtp(email: string) {
    try {
      const response = await fetch(`/api/v1/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: { message: result.detail || 'Failed to resend OTP' } };
      }

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Network error during OTP resend' } };
    }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  }
}

// Database helper functions
export const db = {
  // Create user profile (regular user)
  async createUserProfile(userId: string, userData: any) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        email: userData.email,
        full_name: userData.full_name,
        employee_code: userData.employee_code,
        phone_number: userData.phone_number,
        status: 'active',
        // These will be set by admin/manager during user creation
        manager_id: userData.manager_id || null,
        department_id: userData.department_id || null,
        role_id: userData.role_id || null
      })
      .select()
    return { data, error }
  },

  // Create admin profile
  async createAdminProfile(adminId: string, userData: any) {
    const { data, error } = await supabase
      .from('admins')
      .insert({
        admin_id: adminId,
        full_name: userData.full_name,
        email: userData.email,
        phone_number: userData.phone_number,
        role_id: userData.role_id || null
      })
      .select()
    return { data, error }
  },

  // Create manager profile
  async createManagerProfile(managerId: string, userData: any) {
    const { data, error } = await supabase
      .from('managers')
      .insert({
        manager_id: managerId,
        admin_id: userData.admin_id,
        full_name: userData.full_name,
        email: userData.email,
        phone_number: userData.phone_number,
        role_id: userData.role_id || null
      })
      .select()
    return { data, error }
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        departments(department_name),
        roles(role_name),
        managers(full_name, email)
      `)
      .eq('user_id', userId)
      .single()
    return { data, error }
  },

  // Get admin profile
  async getAdminProfile(adminId: string) {
    const { data, error } = await supabase
      .from('admins')
      .select(`
        *,
        roles(role_name)
      `)
      .eq('admin_id', adminId)
      .single()
    return { data, error }
  },

  // Get manager profile
  async getManagerProfile(managerId: string) {
    const { data, error } = await supabase
      .from('managers')
      .select(`
        *,
        roles(role_name),
        admins(full_name, email)
      `)
      .eq('manager_id', managerId)
      .single()
    return { data, error }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select()
    return { data, error }
  },

  // Check if user exists by email
  async checkUserExists(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, email, full_name')
      .eq('email', email)
      .single()
    return { data, error }
  },

  // Check if admin exists by email
  async checkAdminExists(email: string) {
    const { data, error } = await supabase
      .from('admins')
      .select('admin_id, email, full_name')
      .eq('email', email)
      .single()
    return { data, error }
  },

  // Check if manager exists by email
  async checkManagerExists(email: string) {
    const { data, error } = await supabase
      .from('managers')
      .select('manager_id, email, full_name')
      .eq('email', email)
      .single()
    return { data, error }
  },

  // Log user activity
  async logUserActivity(actorId: string, actorRole: string, activityType: string, description?: string) {
    const { data, error } = await supabase
      .from('user_activity_logs')
      .insert({
        actor_id: actorId,
        actor_role: actorRole,
        activity_type: activityType,
        description
      })
      .select()
    return { data, error }
  }
}
