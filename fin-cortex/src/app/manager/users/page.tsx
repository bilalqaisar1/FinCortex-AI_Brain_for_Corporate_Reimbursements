"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Search, Mail, Phone, Building2, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard";

// Mock data - replace with actual API call
const mockUsers = [
  {
    id: "1",
    full_name: "John Smith",
    email: "john.smith@example.com",
    employee_code: "EMP001",
    phone_number: "+1234567890",
    status: "active",
    department: "Engineering",
    created_at: "2024-01-15"
  },
  {
    id: "2",
    full_name: "Sarah Ahmed",
    email: "sarah.ahmed@example.com",
    employee_code: "EMP002",
    phone_number: "+1234567891",
    status: "active",
    department: "Marketing",
    created_at: "2024-01-20"
  },
  {
    id: "3",
    full_name: "Ali Khan",
    email: "ali.khan@example.com",
    employee_code: "EMP003",
    phone_number: "+1234567892",
    status: "inactive",
    department: "Sales",
    created_at: "2024-02-01"
  }
];

export default function UsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = mockUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.employee_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RouteProtection allowedRoles={['manager']}>
      <ManagerLayout>
      <div className="w-full max-w-full overflow-hidden">
        <PageHeader
          title="Team Members"
          description="Manage your team members and their accounts"
          icon={Users}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          actions={
            <Button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              onClick={() => router.push("/manager/users/create")}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          }
        />

        {/* Search Bar */}
        <Card className="mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name, email, or employee code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-300 dark:focus:border-purple-600 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                All Users ({filteredUsers.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {searchQuery ? "No users found matching your search." : "No users found."}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => router.push("/manager/users/create")}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create First User
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                            {user.full_name}
                          </h3>
                          <Badge 
                            variant={user.status === 'active' ? 'default' : 'secondary'}
                            className={user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                          >
                            {user.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone_number && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{user.phone_number}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4" />
                            <span>{user.employee_code}</span>
                          </div>
                        </div>
                        {user.department && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Department: {user.department}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/manager/users/${user.id}`)}
                        className="hover:bg-purple-50 dark:hover:bg-slate-700"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ManagerLayout>
    </RouteProtection>
  );
}

