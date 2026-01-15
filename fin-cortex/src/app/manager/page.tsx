"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  BarChart3,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Activity,
  Receipt,
  UserPlus,
  Calendar,
  FileText,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  StatsCard,
  PageHeader,
} from "@/components/dashboard";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { useAuth } from "@/context/AuthContext";

// Quick actions for manager
const quickActions = [
  {
    title: "Create User",
    description: "Add new team member",
    icon: UserPlus,
    href: "/manager/users/create",
    color: "bg-blue-500"
  },
  {
    title: "View Team",
    description: "Manage team members",
    icon: Users,
    href: "/manager/users",
    color: "bg-green-500"
  },
  // "Review Claims" removed as it's now on dashboard
  {
    title: "Analytics",
    description: "View team reports",
    icon: BarChart3,
    href: "/manager/analytics",
    color: "bg-orange-500"
  }
];

export default function ManagerDashboard() {
  const router = useRouter();
  const { userProfile } = useAuth();

  // State for real data
  const [claims, setClaims] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for Approval/Reject Dialog
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [decisionType, setDecisionType] = useState<"approved" | "rejected" | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!userProfile?.user_id) return;
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Fetch claims and stats in parallel
      const [claimsRes, statsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/reimbursements/manager/${userProfile.user_id}`),
        fetch(`${baseUrl}/api/v1/reimbursements/manager/${userProfile.user_id}/stats`)
      ]);

      const claimsPayload = await claimsRes.json();
      const statsPayload = await statsRes.json();

      if (claimsPayload.success) {
        setClaims(claimsPayload.data);
      }
      if (statsPayload.success) {
        setStats(statsPayload.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.user_id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived state
  const pendingApprovals = claims.filter(c => c.status.toLowerCase() === 'pending');
  const historyClaims = claims.filter(c => c.status.toLowerCase() !== 'pending');

  // Stats for cards
  const totalTeamClaims = claims.length;
  const pendingCount = pendingApprovals.length;

  const managerStats = [
    {
      title: "My Team Claims",
      value: stats?.totalClaims?.toString() || totalTeamClaims.toString(),
      change: "Total",
      changeType: "neutral" as const,
      icon: Receipt
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingCount?.toString() || pendingCount.toString(),
      change: `${stats?.pendingCount || pendingCount} new`,
      changeType: (stats?.pendingCount || pendingCount) > 0 ? "warning" as const : "positive" as const,
      icon: Clock
    },
    {
      title: "Team Budget",
      value: stats ? `${stats.budgetUtilization}%` : "—",
      change: stats ? "Used" : "Loading...",
      changeType: "neutral" as const,
      icon: DollarSign
    },
    {
      title: "Team Members",
      value: stats?.teamMemberCount?.toString() || "—",
      change: "Active",
      changeType: "neutral" as const,
      icon: Users
    }
  ];

  // Actions
  const handleApprove = (claim: any) => {
    setSelectedApproval(claim);
    setDecisionType("approved");
    setIsDialogOpen(true);
  };

  const handleReject = (claim: any) => {
    setSelectedApproval(claim);
    setDecisionType("rejected");
    setIsDialogOpen(true);
  };

  const confirmDecision = async () => {
    if (!decisionType || !selectedApproval) return;
    if (decisionType === "rejected" && !comment.trim()) return;

    setIsProcessing(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/v1/reimbursements/${selectedApproval.reimbursement_id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decisionType,
          comments: comment,
          approver_id: userProfile?.user_id
        })
      });
      const payload = await response.json();
      if (payload.success) {
        setIsDialogOpen(false);
        setComment("");
        setSelectedApproval(null);
        setDecisionType(null);
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount: any) => {
    const val = parseFloat(amount);
    if (isNaN(val)) return amount;
    return "PKR " + val.toLocaleString();
  };

  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <RouteProtection allowedRoles={['manager']}>
      <ManagerLayout>
        <div className="w-full max-w-full overflow-hidden">
          <PageHeader
            title="Manager Dashboard"
            description="Manage your team and review reimbursement claims"
            icon={Users}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBgColor="bg-purple-100 dark:bg-purple-900/30"
            actions={
              <div className="flex items-center space-x-2">
                {/* Actions can go here if needed */}
              </div>
            }
          />

          {/* Manager KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 w-full min-w-0">
            {managerStats.map((stat, index) => (
              <div
                key={index}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <StatsCard
                  title={stat.title}
                  value={stat.value}
                  change={stat.change}
                  changeType={stat.changeType}
                  icon={stat.icon}
                />
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="space-y-8">

            {/* 1. Pending Approvals Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-orange-500" />
                  Pending Approvals
                </h2>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  {pendingCount} pending
                </Badge>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
              ) : pendingApprovals.length === 0 ? (
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 p-8 text-center">
                  <p className="text-slate-500">No pending approvals.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingApprovals.map((claim) => (
                    <Card key={claim.reimbursement_id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-l-4 border-l-orange-500 border-y-slate-200 border-r-slate-200 dark:border-y-slate-700 dark:border-r-slate-700 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                          {/* Claim Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{claim.receipt_code}</span>
                              <Badge className={priorityColors[claim.priority || 'medium']}>
                                {(claim.priority || 'medium').toUpperCase()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" /> {claim.users?.full_name || "Employee"}
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" /> {claim.categories?.category_name || "Uncategorized"}
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> {formatCurrency(claim.amount_claimed)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> {formatDate(claim.created_at)}
                              </div>
                            </div>
                            {claim.policy_flags && claim.policy_flags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {claim.policy_flags.map((flag: any, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs border-red-200 text-red-600 bg-red-50">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> {flag.message}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                            <div className="flex gap-2 w-full lg:w-auto">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1 lg:flex-none" onClick={() => handleApprove(claim)}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="flex-1 lg:flex-none" onClick={() => handleReject(claim)}>
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                            <Button size="sm" variant="outline" className="w-full" onClick={() => router.push(`/manager/reimbursements/${claim.reimbursement_id}`)}>
                              <Eye className="w-4 h-4 mr-1" /> View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* 2. Claim History Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-blue-500" />
                  Claim History
                </h2>
                <Badge variant="outline">
                  {historyClaims.length} processed
                </Badge>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
              ) : historyClaims.length === 0 ? (
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 p-8 text-center">
                  <p className="text-slate-500">No history found.</p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {historyClaims.slice(0, 10).map((claim) => (
                    <div key={claim.reimbursement_id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className={`p-2 rounded-full ${claim.status.toLowerCase() === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {claim.status.toLowerCase() === 'approved' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{claim.receipt_code}</p>
                          <p className="text-xs text-slate-500">{claim.users?.full_name} • {formatDate(claim.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(claim.amount_claimed)}</span>
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/manager/reimbursements/${claim.reimbursement_id}`)}>
                          <Eye className="w-4 h-4 mr-1" /> Details
                        </Button>
                      </div>
                    </div>
                  ))}
                  {historyClaims.length > 10 && (
                    <Button variant="ghost" className="w-full text-center text-sm text-slate-500" onClick={() => router.push('/manager/reimbursements')}>
                      View All History
                    </Button>
                  )}
                </div>
              )}
            </section>

            {/* Quick Actions - Kept but 'Review' removed */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-purple-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => router.push(action.href)}
                      className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {action.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {action.description}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Approval Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>
                {decisionType === "approved" ? "Approve" : "Reject"} Reimbursement
              </DialogTitle>
              <DialogDescription>
                {decisionType === "approved"
                  ? "Are you sure you want to approve this reimbursement claim?"
                  : "Are you sure you want to reject this reimbursement claim? Please provide a reason."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedApproval && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                    {selectedApproval.receipt_code}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedApproval.receipt_code} • {formatCurrency(selectedApproval.amount_claimed)}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  {decisionType === "approved" ? "Comments (Optional)" : "Reason for Rejection *"}
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={decisionType === "approved"
                    ? "Add any comments..."
                    : "Please provide a reason for rejection..."}
                  className="min-h-[100px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  required={decisionType === "rejected"}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setComment("");
                  setDecisionType(null);
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDecision}
                disabled={isProcessing || (decisionType === "rejected" && !comment.trim())}
                className={decisionType === "approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"}
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    {decisionType === "approved" ? "Approve" : "Reject"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </ManagerLayout>
    </RouteProtection>
  );
}
