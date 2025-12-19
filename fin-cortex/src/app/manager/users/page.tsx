"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users, UserPlus, Search, Mail, Phone, Building2, ArrowLeft, Loader2, AlertTriangle,
  MoreHorizontal, CheckCircle, XCircle, Ban, ArrowUpDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { fetchTeamMembers } from "@/app/api/v1/manager/fetch-user/users";
import { TeamMember } from "@/types/user";
import { useToastNotification } from "@/hooks/useToastNotification";
import { supabaseClient } from "@/lib/supabase/client";

export default function UsersPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { showToast } = useToastNotification();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!userProfile?.user_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('📥 Fetching users for manager:', userProfile.user_id);
        const response = await fetchTeamMembers(userProfile.user_id);
        setTeamMembers(response.data.users || []);
      } catch (err) {
        console.error('❌ Error loading users:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team members');
      } finally {
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, [userProfile?.user_id]);

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      setUpdatingId(userId);

      const { data: { session } } = await supabaseClient.auth.getSession();
      console.log('🔑 [handleStatusUpdate] Access Token available:', !!session?.access_token);

      const response = await fetch('/api/v1/manager/update-user-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          user_id: userId,
          status: newStatus
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to update status');
      }

      // Update local state
      setTeamMembers(prev => prev.map(user =>
        user.user_id === userId ? { ...user, status: newStatus } : user
      ));

      showToast('success', 'Status Updated', `User status changed to ${newStatus}`);

    } catch (err: any) {
      console.error('Failed to update status:', err);
      showToast('error', 'Update Failed', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = teamMembers.filter(user =>
    (user.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (user.employee_code?.toLowerCase() || "").includes(searchQuery.toLowerCase())
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
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <span className="ml-3 text-lg text-slate-600 dark:text-slate-400">Loading team members...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-red-500">
                  <AlertTriangle className="w-10 h-10 mb-2" />
                  <p className="text-lg font-medium">{error}</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              ) : filteredUsers.length === 0 ? (
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
                      key={user.user_id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1 overflow-hidden">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                          {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {user.full_name}
                            </h3>
                            <Badge
                              variant={user.status === 'active' ? 'default' : 'secondary'}
                              className={`${user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''} whitespace-nowrap`}
                            >
                              {user.status || 'Unknown'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center space-x-1 min-w-0">
                              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            {user.phone_number && (
                              <div className="flex items-center space-x-1 min-w-0">
                                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{user.phone_number}</span>
                              </div>
                            )}
                            {user.employee_code && (
                              <div className="flex items-center space-x-1 min-w-0">
                                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{user.employee_code}</span>
                              </div>
                            )}
                          </div>
                          {user.department?.department_name && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                              Department: {user.department.department_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="whitespace-nowrap"
                              disabled={updatingId === user.user_id}
                            >
                              {updatingId === user.user_id ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 mr-1" />
                              )}
                              Change Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusUpdate(user.user_id, 'active')}>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(user.user_id, 'inactive')}>
                              <XCircle className="w-4 h-4 mr-2 text-yellow-500" />
                              Inactive
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(user.user_id, 'suspended')}>
                              <Ban className="w-4 h-4 mr-2 text-red-500" />
                              Suspended
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/manager/users/${user.user_id}`)}
                          className="hover:bg-purple-50 dark:hover:bg-slate-700 whitespace-nowrap"
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
