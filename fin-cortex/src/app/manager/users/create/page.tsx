"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus, Mail, Lock, User, Phone, Building2 } from "lucide-react";
import { useToastNotification } from "@/hooks/useToastNotification";
import { supabaseClient } from "@/lib/supabase/client";

export default function CreateUserPage() {
  const router = useRouter();
  const { showToast } = useToastNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    employee_code: "",
    phone_number: "",
    department_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      if (!formData.email || !formData.password || !formData.full_name || !formData.employee_code) {
        showToast('error', 'Validation Error', 'Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showToast('error', 'Invalid Email', 'Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      // Validate password length
      if (formData.password.length < 6) {
        showToast('error', 'Invalid Password', 'Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      // Validate employee code format (alphanumeric, 3-20 characters)
      const codeRegex = /^[A-Za-z0-9]{3,20}$/;
      if (!codeRegex.test(formData.employee_code)) {
        showToast('error', 'Invalid Employee Code', 'Employee code must be 3-20 alphanumeric characters');
        setIsLoading(false);
        return;
      }

      // Call backend API to create user
      const response = await fetch('/api/v1/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          employee_code: formData.employee_code,
          phone_number: formData.phone_number || null,
          department_id: formData.department_id || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to create user');
      }

      showToast('success', 'User Created', `User ${formData.full_name} has been created successfully!`);
      
      // Reset form
      setFormData({
        email: "",
        password: "",
        full_name: "",
        employee_code: "",
        phone_number: "",
        department_id: "",
      });

      // Redirect to users list after a short delay
      setTimeout(() => {
        router.push('/manager/users');
      }, 1500);

    } catch (error: any) {
      console.error('Error creating user:', error);
      showToast('error', 'Creation Failed', error.message || 'Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <RouteProtection allowedRoles={['manager']}>
      <ManagerLayout>
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Create New User
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Add a new team member to your organization
          </p>
        </div>

        {/* Form Card */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-purple-600" />
              User Information
            </CardTitle>
            <CardDescription>
              Fill in the details to create a new user account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-300 dark:focus:border-purple-600 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-xl"
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-300 dark:focus:border-purple-600 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-xl"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              {/* Employee Code */}
              <div className="space-y-2">
                <Label htmlFor="employee_code" className="text-sm font-medium">
                  Employee Code <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="employee_code"
                    name="employee_code"
                    type="text"
                    value={formData.employee_code}
                    onChange={handleChange}
                    className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-300 dark:focus:border-purple-600 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-xl"
                    placeholder="Enter employee code (3-20 alphanumeric)"
                    required
                    pattern="[A-Za-z0-9]{3,20}"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Must be 3-20 alphanumeric characters
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-300 dark:focus:border-purple-600 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-xl"
                    placeholder="Enter password (min 6 characters)"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Must be at least 6 characters long
                </p>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-sm font-medium">
                  Phone Number <span className="text-slate-400 text-xs">(Optional)</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-300 dark:focus:border-purple-600 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-xl"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ManagerLayout>
    </RouteProtection>
  );
}

