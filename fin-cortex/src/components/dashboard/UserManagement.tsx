"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building2,
  Calendar,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
  department: string;
  status: "active" | "inactive" | "pending";
  lastActive: string;
  employeeCode: string;
  phone?: string;
  createdAt: string;
}

interface UserManagementProps {
  users?: User[];
  onAddUser?: () => void;
  onEditUser?: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
  onToggleStatus?: (userId: string) => void;
  className?: string;
}

const mockUsers: User[] = [
  {
    id: "U-001",
    name: "John Smith",
    email: "john.smith@company.com",
    role: "admin",
    department: "Engineering",
    status: "active",
    lastActive: "2 hours ago",
    employeeCode: "EMP001",
    phone: "+92 300 1234567",
    createdAt: "2024-01-15"
  },
  {
    id: "U-002",
    name: "Sarah Ahmed",
    email: "sarah.ahmed@company.com",
    role: "manager",
    department: "Marketing",
    status: "active",
    lastActive: "1 hour ago",
    employeeCode: "EMP002",
    phone: "+92 301 2345678",
    createdAt: "2024-02-20"
  },
  {
    id: "U-003",
    name: "Ali Khan",
    email: "ali.khan@company.com",
    role: "user",
    department: "Sales",
    status: "inactive",
    lastActive: "2 days ago",
    employeeCode: "EMP003",
    phone: "+92 302 3456789",
    createdAt: "2024-03-10"
  },
  {
    id: "U-004",
    name: "Maria Garcia",
    email: "maria.garcia@company.com",
    role: "user",
    department: "IT",
    status: "pending",
    lastActive: "Never",
    employeeCode: "EMP004",
    phone: "+92 303 4567890",
    createdAt: "2024-09-20"
  }
];

export function UserManagement({
  users = mockUsers,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
  className
}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "manager" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending">("all");

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-700 border-red-200";
      case "manager": return "bg-blue-100 text-blue-700 border-blue-200";
      case "user": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "inactive": return "bg-gray-100 text-gray-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="w-3 h-3" />;
      case "manager": return <Users className="w-3 h-3" />;
      case "user": return <UserCheck className="w-3 h-3" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Search and Filters */}
      <Card className="bg-[var(--card-dark)] backdrop-blur-3xl border-[var(--border-subtle)] shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <CardTitle className="text-xl font-black text-[var(--text-primary)] flex items-center tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mr-3">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              MANAGER MANAGEMENT
            </CardTitle>
            <Button
              onClick={onAddUser}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              ADD MANAGER
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-blue-400 transition-colors" />
              <Input
                placeholder="SEARCH MANAGERS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[var(--card-dark)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl text-xs font-bold tracking-wider"
              />
            </div>

            <div className="flex space-x-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-4 py-2 border border-[var(--border-medium)] rounded-xl bg-[var(--card-dark)] text-[var(--text-secondary)] text-xs font-bold tracking-wider focus:outline-none focus:border-blue-500/40"
              >
                <option value="all" className="bg-slate-900">ALL ROLES</option>
                <option value="admin" className="bg-slate-900">ADMIN</option>
                <option value="manager" className="bg-slate-900">MANAGER</option>
                <option value="user" className="bg-slate-900">USER</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-[var(--border-medium)] rounded-xl bg-[var(--card-dark)] text-[var(--text-secondary)] text-xs font-bold tracking-wider focus:outline-none focus:border-blue-500/40"
              >
                <option value="all" className="bg-slate-900">ALL STATUS</option>
                <option value="active" className="bg-slate-900">ACTIVE</option>
                <option value="inactive" className="bg-slate-900">INACTIVE</option>
                <option value="pending" className="bg-slate-900">PENDING</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-[var(--card-dark)] backdrop-blur-3xl border-[var(--border-subtle)] shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-5 hover:bg-[var(--card-hover)] transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-5 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-[var(--border-medium)] flex items-center justify-center text-white font-black text-sm shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="font-bold text-[var(--text-primary)] text-sm tracking-wide truncate">
                          {user.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border-0",
                            user.role === 'admin' ? "bg-red-500/10 text-red-400" :
                              user.role === 'manager' ? "bg-blue-500/10 text-blue-400" :
                                "bg-green-500/10 text-green-400"
                          )}
                        >
                          {user.role}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border-0",
                            user.status === 'active' ? "bg-emerald-500/10 text-emerald-400" :
                              user.status === 'inactive' ? "bg-slate-500/10 text-slate-400" :
                                "bg-yellow-500/10 text-yellow-400"
                          )}
                        >
                          {user.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div className="flex items-center space-x-2 text-[var(--text-secondary)]">
                          <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="truncate hover:text-[var(--text-primary)] transition-colors cursor-default">{user.email}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-[var(--text-secondary)]">
                          <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>{user.department}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-[var(--text-secondary)]">
                          <code className="bg-[var(--card-dark)] px-1.5 py-0.5 rounded text-[10px] text-[var(--text-secondary)] font-mono border border-[var(--border-subtle)]">
                            {user.employeeCode}
                          </code>
                        </div>

                        <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                          <span className="text-[10px] font-medium uppercase tracking-wider">
                            Active: {user.lastActive}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pl-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onToggleStatus?.(user.id)}
                      className={cn(
                        "h-8 w-8 p-0 rounded-lg transition-all",
                        user.status === "active"
                          ? "hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400"
                          : "hover:bg-green-500/10 text-[var(--text-muted)] hover:text-green-400"
                      )}
                    >
                      {user.status === "active" ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditUser?.(user.id)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteUser?.(user.id)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[var(--card-dark)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-medium)]">
                  <Users className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <p className="text-[var(--text-secondary)] font-medium">No managers found</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider">
                  Try adjusting your search filters
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
