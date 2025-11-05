"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  UserManagement,
  PageHeader
} from "@/components/dashboard";
import { Users } from "lucide-react";

export default function UsersPage() {
  const router = useRouter();

  const handleAddUser = () => {
    // Navigate to add user form or open modal
    console.log("Add user clicked");
    // router.push("/admin/users/add");
  };

  const handleEditUser = (userId: string) => {
    // Navigate to edit user form
    console.log("Edit user:", userId);
    // router.push(`/admin/users/${userId}/edit`);
  };

  const handleDeleteUser = (userId: string) => {
    // Show confirmation dialog and delete user
    console.log("Delete user:", userId);
    if (confirm("Are you sure you want to delete this user?")) {
      // Implement delete logic
    }
  };

  const handleToggleStatus = (userId: string) => {
    // Toggle user active/inactive status
    console.log("Toggle status for user:", userId);
    // Implement status toggle logic
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader
        title="User Management"
        description="Manage users, roles, and permissions across your organization"
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

      <UserManagement
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
