"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  Search, 
  Eye, 
  Filter,
  Download,
  Calendar,
  DollarSign,
  User,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/dashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data - replace with actual API call
const mockReimbursements = [
  {
    reimbursement_id: "1",
    receipt_code: "RCP-2024-001",
    user_name: "John Smith",
    amount_claimed: 15000,
    amount_approved: null,
    status: "pending",
    category: "Travel",
    vendor_name: "Uber",
    created_at: "2024-01-15T10:30:00Z",
    currency: "PKR"
  },
  {
    reimbursement_id: "2",
    receipt_code: "RCP-2024-002",
    user_name: "Sarah Ahmed",
    amount_claimed: 8500,
    amount_approved: 8500,
    status: "approved",
    category: "Meals",
    vendor_name: "Restaurant ABC",
    created_at: "2024-01-14T14:20:00Z",
    currency: "PKR"
  },
  {
    reimbursement_id: "3",
    receipt_code: "RCP-2024-003",
    user_name: "Ali Khan",
    amount_claimed: 3200,
    amount_approved: null,
    status: "rejected",
    category: "Office Supplies",
    vendor_name: "Stationery Store",
    created_at: "2024-01-13T09:15:00Z",
    currency: "PKR"
  }
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  under_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function ReimbursementsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredReimbursements = mockReimbursements.filter(reimb => {
    const matchesSearch = 
      reimb.receipt_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reimb.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reimb.vendor_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || reimb.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return "N/A";
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <RouteProtection allowedRoles={['manager']}>
      <ManagerLayout>
      <div className="w-full max-w-full overflow-hidden">
        <PageHeader
          title="Reimbursements"
          description="View and manage all reimbursement claims from your team"
          icon={Receipt}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          actions={
            <Button 
              variant="outline"
              className="hover:bg-purple-50 hover:border-purple-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          }
        />

        {/* Filters and Search */}
        <Card className="mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search by receipt code, user, or vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-300 dark:focus:border-purple-600 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl">
                  <Filter className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-12 hover:bg-purple-50 dark:hover:bg-slate-800"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reimbursements List */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                <span className="text-slate-900 dark:text-slate-100">All Reimbursements ({filteredReimbursements.length})</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReimbursements.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {searchQuery || statusFilter !== "all" 
                    ? "No reimbursements found matching your filters." 
                    : "No reimbursements found."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReimbursements.map((reimb) => (
                  <div
                    key={reimb.reimbursement_id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors gap-4"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {reimb.receipt_code}
                        </h3>
                        <Badge className={statusColors[reimb.status as keyof typeof statusColors]}>
                          {reimb.status.charAt(0).toUpperCase() + reimb.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{reimb.user_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4" />
                          <span>{reimb.vendor_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Claimed: {formatCurrency(reimb.amount_claimed, reimb.currency)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(reimb.created_at)}</span>
                        </div>
                      </div>
                      {reimb.amount_approved !== null && (
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">
                            Approved: {formatCurrency(reimb.amount_approved, reimb.currency)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/manager/reimbursements/${reimb.reimbursement_id}`)}
                        className="hover:bg-purple-50 dark:hover:bg-slate-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
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

