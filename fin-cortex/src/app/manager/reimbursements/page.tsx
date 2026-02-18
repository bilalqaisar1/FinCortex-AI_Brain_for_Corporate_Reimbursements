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
import { BACKEND_URL } from "@/lib/config";
import { Reimbursement } from "@/types/reimbursement";




const statusColors = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20 border",
  approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 border",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20 border",
  under_review: "bg-blue-500/10 text-blue-500 border-blue-500/20 border",
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
            iconColor="text-purple-500"
            iconBgColor="bg-purple-500/10"
            actions={
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="hover:bg-green-500/10 hover:border-green-500/50 text-green-600 dark:text-green-400 border-[var(--border-subtle)] bg-transparent"
                  onClick={() => {
                    if (!userProfile?.user_id) return;
                    const url = `${BACKEND_URL}/api/v1/export/excel?manager_id=${userProfile.user_id}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`;
                    window.open(url, '_blank');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  className="hover:bg-blue-500/10 hover:border-blue-500/50 text-blue-600 dark:text-blue-400 border-[var(--border-subtle)] bg-transparent"
                  onClick={() => {
                    if (!userProfile?.user_id) return;
                    const url = `${BACKEND_URL}/api/v1/export/pdf?manager_id=${userProfile.user_id}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`;
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
          <Card className="mb-6 bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                  <Input
                    type="text"
                    placeholder="Search by receipt code, user, or vendor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500/50 focus:ring rounded-xl"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl">
                    <Filter className="w-4 h-4 mr-2 text-[var(--text-secondary)]" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card-dark)] border-[var(--border-subtle)]">
                    <SelectItem value="all" className="text-[var(--text-primary)] focus:bg-[var(--card-hover)]">All Status</SelectItem>
                    <SelectItem value="pending" className="text-[var(--text-primary)] focus:bg-[var(--card-hover)]">Pending</SelectItem>
                    <SelectItem value="approved" className="text-[var(--text-primary)] focus:bg-[var(--card-hover)]">Approved</SelectItem>
                    <SelectItem value="rejected" className="text-[var(--text-primary)] focus:bg-[var(--card-hover)]">Rejected</SelectItem>
                    <SelectItem value="under_review" className="text-[var(--text-primary)] focus:bg-[var(--card-hover)]">Under Review</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="h-12 hover:bg-[var(--card-hover)] border-[var(--border-subtle)] text-[var(--text-primary)] bg-transparent"
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
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--card-hover)] transition-colors gap-4"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {reimb.receipt_code || "No Code"}
                    </h3>
                    {reimb.status && (
                      <Badge className={statusColors[reimb.status as keyof typeof statusColors] || "bg-slate-100 text-slate-700"}>
                        {reimb.status.charAt(0).toUpperCase() + reimb.status.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-[var(--text-secondary)]">
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
                    className="hover:bg-[var(--card-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)] bg-transparent hover:text-[var(--text-primary)]"
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
                <Card className="mb-6 bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center text-[var(--text-primary)]">
                        <Clock className="w-5 h-5 mr-2 text-amber-500" />
                        <span>Pending Claims ({pendingReimbursements.length})</span>
                      </span>
                      <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Requires Review
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                      </div>
                    ) : error ? (
                      <div className="text-center py-12 text-red-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                        <p>{error}</p>
                      </div>
                    ) : pendingReimbursements.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                        <p className="text-[var(--text-muted)]">
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
                <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center text-[var(--text-primary)]">
                        <Receipt className="w-5 h-5 mr-2 text-purple-500" />
                        <span>All Reimbursements ({processedReimbursements.length})</span>
                      </span>
                      <Badge className="bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        Approved / Rejected
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                      </div>
                    ) : error ? (
                      <div className="text-center py-12 text-red-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                        <p>{error}</p>
                      </div>
                    ) : processedReimbursements.length === 0 ? (
                      <div className="text-center py-8">
                        <Receipt className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
                        <p className="text-[var(--text-muted)]">
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

