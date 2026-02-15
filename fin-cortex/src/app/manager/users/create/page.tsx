"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, UserPlus, Mail, Lock, User, Phone, Building2, Loader2 } from "lucide-react";
import { useToastNotification } from "@/hooks/useToastNotification";
import { supabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

export default function CreateUserPage() {
  const router = useRouter();
  const { showToast } = useToastNotification();
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    employee_code: "",
    phone_number: "",
    department_id: "",
    role_id: "", // Will be auto-set
    status: "active",
  });

  // Fetch departments and User role ID on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptResponse, roleResponse] = await Promise.all([
          supabaseClient.from('departments').select('department_id, department_name'),
          supabaseClient.from('roles').select('role_id, role_name').ilike('role_name', 'user').single()
        ]);

        if (deptResponse.data) {
          setDepartments(deptResponse.data);
        }

        if (roleResponse.data) {
          // Auto-set role_id to the 'User' role
          setFormData(prev => ({ ...prev, role_id: roleResponse.data.role_id.toString() }));
        } else {
          // Fallback if 'user' role not found via name (should not happen in prod)
          console.warn("Could not find 'User' role automatically.");
        }

      } catch (error) {
        console.error("Error fetching form data:", error);
        showToast("error", "Error", "Failed to load departments");
      }
    };

    fetchData();
  }, []);

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

      if (!formData.role_id) {
        showToast('error', 'Configuration Error', 'User role not loaded. Please refresh.');
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

      // Validate password length and complexity
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        showToast('error', 'Invalid Password', 'Password must be at least 8 characters long and contain both letters and numbers');
        setIsLoading(false);
        return;
      }

      // Validate employee code format (alphanumeric, 3-20 characters)
      const codeRegex = /^[A-Za-z0-9-]{3,20}$/;
      if (!codeRegex.test(formData.employee_code)) {
        showToast('error', 'Invalid Employee Code', 'Employee code must be 3-20 alphanumeric characters');
        setIsLoading(false);
        return;
      }

      // Attempt to get session token from header for API auth
      const { data: { session } } = await supabaseClient.auth.getSession();

      const responseWithAuth = await fetch('/api/v1/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          employee_code: formData.employee_code,
          phone_number: formData.phone_number || null,
          department_id: formData.department_id ? parseInt(formData.department_id) : null,
          role_id: parseInt(formData.role_id),
          manager_id: userProfile?.user_id,
          status: formData.status
        })
      });


      const result = await responseWithAuth.json();

      if (!responseWithAuth.ok) {
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
        role_id: formData.role_id, // Keep Role ID
        status: "active",
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

  const handleSelectChange = (name: string, value: string) => {
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
              className="mb-4 hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tight">
              Create New User
            </h1>
            <p className="text-[var(--text-muted)] font-medium">
              Add a new team member to your organization
            </p>
          </div>

          {/* Form Card */}
          <Card className="glass-effect border-[var(--border-subtle)] shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/[0.05]">
              <CardTitle className="flex items-center text-[var(--text-primary)] uppercase tracking-widest text-sm font-black">
                <UserPlus className="w-5 h-5 mr-3 text-purple-400" />
                User Information
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)] font-medium mt-1">
                Fill in the details to create a new user account
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2.5">
                    <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <User className="h-5 w-5 text-[var(--text-muted)] group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="pl-12 h-14 glass-effect border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all rounded-2xl font-medium"
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Mail className="h-5 w-5 text-[var(--text-muted)] group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-12 h-14 glass-effect border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all rounded-2xl font-medium"
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  {/* Employee Code */}
                  <div className="space-y-2.5">
                    <Label htmlFor="employee_code" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                      Employee Code <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Building2 className="h-5 w-5 text-[var(--text-muted)] group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <Input
                        id="employee_code"
                        name="employee_code"
                        type="text"
                        value={formData.employee_code}
                        onChange={handleChange}
                        className="pl-12 h-14 glass-effect border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all rounded-2xl font-medium"
                        placeholder="Enter employee code"
                        required
                        pattern="[A-Za-z0-9-]{3,20}"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">
                      Must be 3-20 alphanumeric characters
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2.5">
                    <Label htmlFor="phone_number" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                      Phone Number
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Phone className="h-5 w-5 text-[var(--text-muted)] group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <Input
                        id="phone_number"
                        name="phone_number"
                        type="tel"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="pl-12 h-14 glass-effect border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all rounded-2xl font-medium"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-2.5">
                    <Label htmlFor="department_id" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                      Department
                    </Label>
                    <Select
                      onValueChange={(value) => handleSelectChange('department_id', value)}
                      value={formData.department_id}
                    >
                      <SelectTrigger className="h-14 glass-effect border-[var(--border-subtle)] text-[var(--text-primary)] rounded-2xl focus:ring-2 focus:ring-purple-500/20">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--card-dark)] border-[var(--border-subtle)] rounded-2xl">
                        {departments.length > 0 ? (
                          departments.map((dept) => (
                            <SelectItem key={dept.department_id} value={dept.department_id.toString()} className="focus:bg-[var(--card-hover)] text-[var(--text-primary)]">
                              {dept.department_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No departments available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Password */}
                  <div className="space-y-2.5">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-[var(--text-muted)] group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-12 h-14 glass-effect border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all rounded-2xl font-medium"
                        placeholder="Enter password (min 8 characters)"
                        required
                        minLength={8}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">
                      Must be at least 8 characters long and contain both letters and numbers
                    </p>
                  </div>

                  {/* Status */}
                  <div className="space-y-2.5">
                    <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                      Status
                    </Label>
                    <Select
                      onValueChange={(value) => handleSelectChange('status', value)}
                      value={formData.status}
                    >
                      <SelectTrigger className="h-14 glass-effect border-[var(--border-subtle)] text-[var(--text-primary)] rounded-2xl focus:ring-2 focus:ring-purple-500/20">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--card-dark)] border-[var(--border-subtle)] rounded-2xl">
                        <SelectItem value="active" className="focus:bg-[var(--card-hover)] text-[var(--text-primary)]">Active</SelectItem>
                        <SelectItem value="inactive" className="focus:bg-[var(--card-hover)] text-[var(--text-primary)]">Inactive</SelectItem>
                        <SelectItem value="suspended" className="focus:bg-[var(--card-hover)] text-[var(--text-primary)]">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-6 pt-10 border-t border-white/[0.05]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="h-12 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-2xl transition-all"
                  >
                    Cancel Transaction
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 px-10 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 rounded-2xl disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Initializing...</span>
                      </div>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-3" />
                        Authorize User
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
