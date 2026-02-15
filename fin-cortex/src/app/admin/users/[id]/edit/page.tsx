"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { ArrowLeft, User, Phone, Building2, Save, Loader2 } from "lucide-react";
import { useToastNotification } from "@/hooks/useToastNotification";
import { supabaseClient } from "@/lib/supabase/client";

export default function EditManagerPage() {
    const router = useRouter();
    const params = useParams();
    const managerId = params.id as string;
    const { showToast } = useToastNotification();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        full_name: "",
        employee_code: "", // Read only if from managers table
        phone_number: "",
        department_id: "",
        status: "active",
    });

    // Fetch manager and departments on load
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);

                // 1. Fetch Departments
                const { data: depts, error: deptsError } = await supabaseClient
                    .from('departments')
                    .select('department_id, department_name');

                if (deptsError) throw deptsError;
                setDepartments(depts || []);

                // 2. Fetch Manager Details
                const { data: manager, error: managerError } = await supabaseClient
                    .from('managers')
                    .select('*, manager_department:departments(department_name)')
                    .eq('manager_id', managerId)
                    .single();

                if (managerError) throw managerError;

                if (manager) {
                    setFormData({
                        full_name: manager.full_name || "",
                        employee_code: manager.employee_code || "",
                        phone_number: manager.phone_number || "",
                        department_id: manager.manager_department_id?.toString() || "",
                        status: manager.status || "active",
                    });
                }
            } catch (error: any) {
                console.error("Error loading manager data:", error);
                showToast('error', 'Loading Failed', error.message || 'Could not load manager details');
                router.back();
            } finally {
                setIsLoading(false);
            }
        };

        if (managerId) {
            loadData();
        }
    }, [managerId, showToast, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();

            const response = await fetch('/api/v1/auth/update-manager', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify({
                    manager_id: managerId,
                    full_name: formData.full_name,
                    phone_number: formData.phone_number || null,
                    department_id: formData.department_id ? parseInt(formData.department_id) : null,
                    status: formData.status
                })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.detail || 'Failed to update manager');
            }

            showToast('success', 'Manager Updated', `Manager ${formData.full_name} has been updated successfully!`);

            setTimeout(() => {
                router.push('/admin/users');
            }, 1000);

        } catch (error: any) {
            console.error('Error updating manager:', error);
            showToast('error', 'Update Failed', error.message || 'Failed to update manager');
        } finally {
            setIsSaving(false);
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Loading manager details...</p>
            </div>
        );
    }

    return (
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
                    Edit Manager
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Update profile information for {formData.full_name}
                </p>
            </div>

            {/* Form Card */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-600" />
                        Manager Profile
                    </CardTitle>
                    <CardDescription>
                        Modify the details below and save your changes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Employee Code (Read Only) */}
                            <div className="space-y-2">
                                <Label htmlFor="employee_code" className="text-sm font-medium">
                                    Employee Code
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
                                        disabled
                                        className="pl-10 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label htmlFor="phone_number" className="text-sm font-medium">
                                    Phone Number
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
                                        className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>

                            {/* Department */}
                            <div className="space-y-2">
                                <Label htmlFor="department_id" className="text-sm font-medium">
                                    Department
                                </Label>
                                <Select
                                    onValueChange={(value) => handleSelectChange('department_id', value)}
                                    value={formData.department_id}
                                >
                                    <SelectTrigger className="h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                                        <SelectValue placeholder="Select a department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                                                {dept.department_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-sm font-medium">
                                    Account Status
                                </Label>
                                <Select
                                    onValueChange={(value) => handleSelectChange('status', value)}
                                    value={formData.status}
                                >
                                    <SelectTrigger className="h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
