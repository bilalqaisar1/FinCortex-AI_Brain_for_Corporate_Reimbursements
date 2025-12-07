"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/dashboard";

interface RouteProtectionProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'manager' | 'user')[];
  redirectTo?: string;
}

export function RouteProtection({ 
  children, 
  allowedRoles, 
  redirectTo = "/login" 
}: RouteProtectionProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    // If no user, redirect to login
    if (!user || !userProfile) {
      router.push(redirectTo);
      return;
    }

    // Get user role
    const userRole = userProfile.userRole;

    // If user role is not in allowed roles, redirect based on their role
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to their appropriate dashboard
      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'manager') {
        router.push('/manager');
      } else if (userRole === 'user') {
        router.push('/user/dashboard');
      } else {
        router.push(redirectTo);
      }
    }
  }, [user, userProfile, loading, allowedRoles, redirectTo, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If no user or wrong role, don't render children (redirect will happen)
  if (!user || !userProfile) {
    return null;
  }

  const userRole = userProfile.userRole;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return null;
  }

  // User is authenticated and has correct role
  return <>{children}</>;
}

