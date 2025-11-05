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
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-500" />
              User Management
            </CardTitle>
            <Button 
              onClick={onAddUser}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredUsers.map((user, index) => (
              <div 
                key={user.id}
                className={cn(
                  "p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                  index === 0 && "rounded-t-lg"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {user.name}
                        </h3>
                        <Badge 
                          variant="outline"
                          className={cn("text-xs flex items-center space-x-1", getRoleColor(user.role))}
                        >
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={cn("text-xs", getStatusColor(user.status))}
                        >
                          {user.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-3 h-3" />
                            <span>{user.department}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>#{user.employeeCode}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {user.phone && (
                          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-500">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          Last active: {user.lastActive}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onToggleStatus?.(user.id)}
                      className={cn(
                        "h-8 px-3",
                        user.status === "active" 
                          ? "text-red-600 hover:text-red-700 hover:bg-red-50" 
                          : "text-green-600 hover:text-green-700 hover:bg-green-50"
                      )}
                    >
                      {user.status === "active" ? (
                        <>
                          <UserX className="w-3 h-3 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onEditUser?.(user.id)}
                      className="h-8 px-3"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onDeleteUser?.(user.id)}
                      className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No users found</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
