"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, UserPlus, Mail, Lock, User, Phone, Building2 } from "lucide-react";
import { useToastNotification } from "@/hooks/useToastNotification";
import { supabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

export default function CreateManagerPage() {
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
        status: "active",
    });

    // Fetch departments on load
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const { data, error } = await supabaseClient
                    .from('departments')
                    .select('department_id, department_name');

                if (error) throw error;
                if (data) setDepartments(data);
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };

        fetchDepartments();
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

            // Attempt to get session token from header for API auth
            const { data: { session } } = await supabaseClient.auth.getSession();

            const response = await fetch('/api/v1/auth/create-manager', {
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
                    status: formData.status
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || 'Failed to create manager');
            }

            showToast('success', 'Manager Created', `Manager ${formData.full_name} has been created successfully!`);

            // Redirect to managers list
            setTimeout(() => {
                router.push('/admin/users');
            }, 1500);

        } catch (error: any) {
            console.error('Error creating manager:', error);
            showToast('error', 'Creation Failed', error.message || 'Failed to create manager');
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
        <div className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4 hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                    Create New Manager
                </h1>
                <p className="text-[var(--text-muted)]">
                    Add a new department manager to the system
                </p>
            </div>

            {/* Form Card */}
            <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-lg backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center text-[var(--text-primary)]">
                        <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                        Manager Information
                    </CardTitle>
                    <CardDescription className="text-[var(--text-muted)]">
                        Fill in the details to create a new manager account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="full_name" className="text-sm font-medium text-[var(--text-primary)]">
                                    Full Name <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-[var(--text-muted)]" />
                                    </div>
                                    <Input
                                        id="full_name"
                                        name="full_name"
                                        type="text"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        className="pl-10 h-12 bg-[var(--background-tertiary)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl focus:border-blue-500/50"
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-[var(--text-primary)]">
                                    Email Address <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-[var(--text-muted)]" />
                                    </div>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="pl-10 h-12 bg-[var(--background-tertiary)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl focus:border-blue-500/50"
                                        placeholder="Enter email address"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Employee Code */}
                            <div className="space-y-2">
                                <Label htmlFor="employee_code" className="text-sm font-medium text-[var(--text-primary)]">
                                    Employee Code <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building2 className="h-5 w-5 text-[var(--text-muted)]" />
                                    </div>
                                    <Input
                                        id="employee_code"
                                        name="employee_code"
                                        type="text"
                                        value={formData.employee_code}
                                        onChange={handleChange}
                                        className="pl-10 h-12 bg-[var(--background-tertiary)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl focus:border-blue-500/50"
                                        placeholder="Enter employee code"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label htmlFor="phone_number" className="text-sm font-medium text-[var(--text-primary)]">
                                    Phone Number
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-[var(--text-muted)]" />
                                    </div>
                                    <Input
                                        id="phone_number"
                                        name="phone_number"
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        className="pl-10 h-12 bg-[var(--background-tertiary)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl focus:border-blue-500/50"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>

                            {/* Department */}
                            <div className="space-y-2">
                                <Label htmlFor="department_id" className="text-sm font-medium text-[var(--text-primary)]">
                                    Department
                                </Label>
                                <Select
                                    onValueChange={(value) => handleSelectChange('department_id', value)}
                                    value={formData.department_id}
                                >
                                    <SelectTrigger className="h-12 bg-[var(--background-tertiary)] border-[var(--border-medium)] text-[var(--text-primary)] rounded-xl">
                                        <SelectValue placeholder="Select a department" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--card-dark)] border-[var(--border-medium)] text-[var(--text-primary)]">
                                        {departments.map((dept) => (
                                            <SelectItem
                                                key={dept.department_id}
                                                value={dept.department_id.toString()}
                                                className="focus:bg-[var(--card-hover)] focus:text-[var(--text-primary)]"
                                            >
                                                {dept.department_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-[var(--text-primary)]">
                                    Password <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-[var(--text-muted)]" />
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="pl-10 h-12 bg-[var(--background-tertiary)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl focus:border-blue-500/50"
                                        placeholder="Enter password"
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    Must be at least 8 characters long and contain both letters and numbers
                                </p>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[var(--border-subtle)]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isLoading}
                                className="border-[var(--border-medium)] text-[var(--text-primary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20"
                            >
                                {isLoading ? "Creating..." : "Create Manager"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
