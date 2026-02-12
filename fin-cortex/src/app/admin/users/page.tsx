"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    UserManagement,
    PageHeader
} from "@/components/dashboard";
import { Users, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchAdminManagers } from "@/app/api/v1/admin/fetch-managers/managers";
import { ManagerMember } from "@/types/user";
import { useToastNotification } from "@/hooks/useToastNotification";
import { supabaseClient } from "@/lib/supabase/client";

export default function UsersPage() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const { showToast } = useToastNotification();

    const [managers, setManagers] = useState<ManagerMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadManagers = async () => {
        if (!userProfile?.user_id) return;

        try {
            setLoading(true);
            setError(null);
            const response = await fetchAdminManagers(userProfile.user_id);
            setManagers(response.data.managers || []);
        } catch (err) {
            console.error('Failed to load managers:', err);
            setError("Failed to load managers. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadManagers();
    }, [userProfile?.user_id]);

    const handleAddManager = () => {
        // Navigate to add manager form or open modal
        console.log("Add manager clicked");
        // For now, redirect to a creation page which we will implement next
        router.push("/admin/users/create");
    };

    const handleEditManager = (managerId: string) => {
        router.push(`/admin/users/${managerId}/edit`);
    };

    const handleDeleteManager = (managerId: string) => {
        console.log("Delete manager:", managerId);
        if (confirm("Are you sure you want to delete this manager?")) {
            // Implement delete logic if needed, for now we focus on Edit/Deactivate
        }
    };

    const handleToggleStatus = async (managerId: string) => {
        const manager = managers.find(m => m.manager_id === managerId);
        if (!manager) return;

        const oldStatus = manager.status || 'active';
        const newStatus = oldStatus === 'active' ? 'inactive' : 'active';

        // Optimistic update — instantly update UI without loading spinner
        setManagers(prev =>
            prev.map(m =>
                m.manager_id === managerId ? { ...m, status: newStatus } : m
            )
        );

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
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            showToast('success', 'Status Updated', `Manager is now ${newStatus}`);
        } catch (error: any) {
            console.error('Error toggling status:', error);
            // Revert on failure
            setManagers(prev =>
                prev.map(m =>
                    m.manager_id === managerId ? { ...m, status: oldStatus } : m
                )
            );
            showToast('error', 'Update Failed', error.message || 'Failed to update status');
        }
    };

    // Transform ManagerMember to the User interface expected by UserManagement
    const displayManagers = managers.map(m => ({
        id: m.manager_id,
        name: m.full_name,
        email: m.email,
        role: "manager" as const,
        department: m.manager_department?.department_name || "N/A",
        status: (m.status || "active") as "active" | "inactive" | "pending",
        lastActive: "Recent", // Fallback for mock field
        employeeCode: m.employee_code || "N/A",
        phone: m.phone_number || undefined,
        createdAt: m.created_at
    }));

    return (
        <div className="w-full max-w-full overflow-hidden">
            <PageHeader
                title="Manager Management"
                description="Manage your department managers and their permissions"
                icon={Users}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-100"
                actions={
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => router.back()}
                            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        >
                            ← Back
                        </button>
                    </div>
                }
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">Loading managers...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-red-500">
                    <AlertTriangle className="w-12 h-12 mb-4" />
                    <p className="text-lg font-semibold">{error}</p>
                </div>
            ) : (
                <UserManagement
                    users={displayManagers}
                    onAddUser={handleAddManager}
                    onEditUser={handleEditManager}
                    onDeleteUser={handleDeleteManager}
                    onToggleStatus={handleToggleStatus}
                />
            )}
        </div>
    );
}
