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
import { useAuth } from "@/context/AuthContext";
import { fetchManagerReimbursements } from "@/app/api/v1/manager/fetch-reimbursements/reimbursements";
import { Reimbursement } from "@/types/reimbursement";



const statusColors = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  under_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function ReimbursementsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();

  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const loadReimbursements = async () => {
      if (!userProfile?.user_id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await fetchManagerReimbursements(userProfile.user_id);
        setReimbursements(response.data.reimbursements || []);
      } catch (err) {
        console.error('Failed to load reimbursements:', err);
        setError('Failed to load reimbursements. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadReimbursements();
  }, [userProfile?.user_id]);

  const filteredReimbursements = reimbursements.filter(reimb => {
    // Fallback values for potentially missing fields
    const receiptCode = reimb.receipt_code || "N/A";
    const userName = reimb.user_name || "Unknown User";
    const vendorName = reimb.vendor_name || "Unknown Vendor";

    const status = reimb.status || "pending";

    const matchesSearch =
      receiptCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null | undefined, currency: string = "PKR") => {
    if (amount === null || amount === undefined) return "N/A";
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
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="hover:bg-green-50 hover:border-green-200 text-green-700 dark:text-green-400"
                  onClick={() => {
                    if (!userProfile?.user_id) return;
                    const url = `http://localhost:8000/api/v1/export/excel?manager_id=${userProfile.user_id}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`;
                    window.open(url, '_blank');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  className="hover:bg-blue-50 hover:border-blue-200 text-blue-700 dark:text-blue-400"
                  onClick={() => {
                    if (!userProfile?.user_id) return;
                    const url = `http://localhost:8000/api/v1/export/pdf?manager_id=${userProfile.user_id}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`;
                    window.open(url, '_blank');
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  PDF Report
                </Button>
              </div>
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

          {/* Pending Claims Section */}
          {(() => {
            const pendingReimbursements = filteredReimbursements.filter(
              (reimb) => reimb.status === "pending" || reimb.status === "under_review"
            );
            const processedReimbursements = filteredReimbursements.filter(
              (reimb) => reimb.status === "approved" || reimb.status === "rejected"
            );

            const renderReimbursementItem = (reimb: Reimbursement) => (
              <div
                key={reimb.reimbursement_id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors gap-4"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {reimb.receipt_code || "No Code"}
                    </h3>
                    {reimb.status && (
                      <Badge className={statusColors[reimb.status as keyof typeof statusColors] || "bg-slate-100 text-slate-700"}>
                        {reimb.status.charAt(0).toUpperCase() + reimb.status.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{reimb.user_name || "Unknown User"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span>{reimb.vendor_name || "Unknown Vendor"}</span>
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
                  {reimb.amount_approved !== null && reimb.amount_approved !== undefined && (
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
                    onClick={() => {
                      if (!reimb.user_id) {
                        console.error("User ID is missing for reimbursement", reimb.reimbursement_id);
                        return;
                      }
                      router.push(`/manager/reimbursements/${reimb.reimbursement_id}?userId=${reimb.user_id}`);
                    }}
                    disabled={!reimb.user_id}
                    title={!reimb.user_id ? "User ID missing" : "View Details"}
                    className="hover:bg-purple-50 dark:hover:bg-slate-700"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            );

            return (
              <>
                {/* Pending Claims Section */}
                <Card className="mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-yellow-200 dark:border-yellow-700 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-slate-900 dark:text-slate-100">Pending Claims ({pendingReimbursements.length})</span>
                      </span>
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Requires Review
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                      </div>
                    ) : error ? (
                      <div className="text-center py-12 text-red-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                        <p>{error}</p>
                      </div>
                    ) : pendingReimbursements.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-400 dark:text-green-500 mb-4" />
                        <p className="text-slate-600 dark:text-slate-300">
                          No pending claims to review. All caught up!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingReimbursements.map(renderReimbursementItem)}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* All Reimbursements (Processed) Section */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Receipt className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                        <span className="text-slate-900 dark:text-slate-100">All Reimbursements ({processedReimbursements.length})</span>
                      </span>
                      <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Approved / Rejected
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      </div>
                    ) : error ? (
                      <div className="text-center py-12 text-red-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                        <p>{error}</p>
                      </div>
                    ) : processedReimbursements.length === 0 ? (
                      <div className="text-center py-8">
                        <Receipt className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                        <p className="text-slate-600 dark:text-slate-300">
                          {searchQuery || statusFilter !== "all"
                            ? "No processed reimbursements found matching your filters."
                            : "No processed reimbursements yet."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {processedReimbursements.map(renderReimbursementItem)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>
      </ManagerLayout>
    </RouteProtection>
  );
}

