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
  Loader2,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  ArrowLeft,
  X,
  Wallet,
  PieChart
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn, formatDate } from "@/lib/utils";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { BACKEND_URL } from "@/lib/config";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { useAuth } from "@/context/AuthContext";

interface AnalyticsData {
  totalClaims: number;
  totalAmount: number;
  averageClaim: number;
  approvalRate: number;
  rejectionRate: number;
  pendingRate: number;
  topCategories: {
    category: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    claims: number;
    amount: number;
  }[];
  teamPerformance: {
    user: string;
    claims: number;
    amount: number;
    avgTime: string;
  }[];
}

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
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("6months");

  // Budget data state
  const [budgetData, setBudgetData] = useState<any>(null);

  // State for Card Popup Modals
  const [showTeamClaims, setShowTeamClaims] = useState(false);
  const [showPendingPopup, setShowPendingPopup] = useState(false);
  const [showBudgetPopup, setShowBudgetPopup] = useState(false);
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [showAcceptedPopup, setShowAcceptedPopup] = useState(false);
  const [showRejectedPopup, setShowRejectedPopup] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!userProfile?.user_id) return;
    setIsLoading(true);
    try {
      const baseUrl = BACKEND_URL;

      // Fetch claims, stats, and budget in parallel
      const [claimsRes, statsRes, budgetRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/reimbursements/manager/${userProfile.user_id}`),
        fetch(`${baseUrl}/api/v1/reimbursements/manager/${userProfile.user_id}/stats`),
        fetch(`${baseUrl}/api/v1/manager/budget?manager_id=${userProfile.user_id}`)
      ]);

      const claimsPayload = await claimsRes.json();
      const statsPayload = await statsRes.json();
      const budgetPayload = await budgetRes.json();

      if (claimsPayload.success) {
        setClaims(claimsPayload.data);
      }
      if (statsPayload.success) {
        setStats(statsPayload.data);
      }
      if (budgetPayload.success) {
        setBudgetData(budgetPayload.data);
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
  const acceptedClaims = claims.filter(c => c.status.toLowerCase() === 'approved');
  const rejectedClaims = claims.filter(c => c.status.toLowerCase() === 'rejected');
  const historyClaims = claims.filter(c => c.status.toLowerCase() !== 'pending');

  const formatCurrency = (amount: any) => {
    const val = parseFloat(amount);
    if (isNaN(val)) return amount;
    return "PKR " + val.toLocaleString();
  };

  // Stats for cards
  const totalTeamClaims = claims.length;
  const pendingCount = pendingApprovals.length;
  const acceptedCount = acceptedClaims.length;
  const rejectedCount = rejectedClaims.length;

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
      title: "Allocated Budget",
      value: budgetData ? formatCurrency(budgetData.total_budget) : "—",
      change: budgetData?.department_name || "Department",
      changeType: "neutral" as const,
      icon: Wallet
    },
    {
      title: "Budget Used",
      value: budgetData ? `${Math.min(100, budgetData.utilization_percentage)}%` : "—",
      change: budgetData ? `${formatCurrency(budgetData.used_budget)} spent` : "Loading...",
      changeType: budgetData && budgetData.utilization_percentage >= 90 ? "negative" as const
        : budgetData && budgetData.utilization_percentage >= 70 ? "warning" as const
          : "positive" as const,
      icon: PieChart
    },
    {
      title: "Team Members",
      value: stats?.teamMemberCount?.toString() || "—",
      change: "Active",
      changeType: "neutral" as const,
      icon: Users
    },
    {
      title: "Accepted Claims",
      value: acceptedCount.toString(),
      change: "Approved",
      changeType: "positive" as const,
      icon: CheckCircle
    },
    {
      title: "Rejected Claims",
      value: rejectedCount.toString(),
      change: "Rejected",
      changeType: rejectedCount > 0 ? "negative" as const : "neutral" as const,
      icon: XCircle
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
    setBudgetError(null);
    try {
      const baseUrl = BACKEND_URL;
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

      if (!response.ok) {
        // Handle budget exceeded error
        const detail = payload.detail;
        if (detail && typeof detail === 'object' && detail.error_code === 'budget_exceeded') {
          setBudgetError(detail.message || 'Insufficient department budget. Please contact admin to increase allocation.');
        } else {
          setBudgetError(typeof detail === 'string' ? detail : 'Failed to update claim status.');
        }
        return;
      }

      if (payload.success) {
        setIsDialogOpen(false);
        setComment("");
        setSelectedApproval(null);
        setDecisionType(null);
        setBudgetError(null);
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      setBudgetError('Network error. Please try again.');
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



  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <RouteProtection allowedRoles={['manager']}>
      <ManagerLayout>
        <div className="flex flex-col gap-12">
          <PageHeader
            title="Manager Command Center"
            description="Operational oversight & team reimbursement control"
            icon={Activity}
          />

          {/* Manager KPIs - Primary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {managerStats.slice(0, 4).map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                changeType={stat.changeType}
                icon={stat.icon}
                className="animate-fade-in-up"
                onClick={[
                  () => setShowTeamClaims(true),
                  () => setShowPendingPopup(true),
                  () => setShowBudgetPopup(true),
                  () => setShowBudgetPopup(true),
                ][index]}
              />
            ))}
          </div>

          {/* Manager KPIs - Secondary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {managerStats.slice(4).map((stat, index) => (
              <StatsCard
                key={index + 4}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                changeType={stat.changeType}
                icon={stat.icon}
                className="animate-fade-in-up"
                onClick={[
                  () => setShowTeamMembers(true),
                  () => setShowAcceptedPopup(true),
                  () => setShowRejectedPopup(true),
                ][index]}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* 1. Pending Approvals Section (2/3 width) */}
            <div className="xl:col-span-2 flex flex-col gap-10">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Pending Approvals</h2>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 px-4 py-1.5 rounded-full">
                  {pendingCount} ACTIONS REQUIRED
                </span>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20 bg-[var(--card-dark)] rounded-3xl border border-[var(--border-subtle)] shadow-sm">
                  <Loader2 className="animate-spin text-purple-500 w-10 h-10" />
                </div>
              ) : pendingApprovals.length === 0 ? (
                <Card className="border-[var(--border-subtle)] bg-[var(--card-dark)] p-20 text-center rounded-3xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">All systems clear. No pending items discovered.</p>
                </Card>
              ) : (
                <div className="flex flex-col gap-6">
                  {pendingApprovals.map((claim) => (
                    <Card key={claim.reimbursement_id} className="group overflow-hidden border-[var(--border-subtle)] bg-[var(--card-dark)] hover:bg-[var(--card-hover)] transition-all duration-500 rounded-3xl">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <CardContent className="p-8">
                        {/* ... existing content ... */}
                        <div className="flex flex-col lg:flex-row gap-8 lg:items-center justify-between">
                          <div className="flex-1 flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                              <span className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{claim.receipt_code}</span>
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border-2",
                                claim.priority === 'high' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                  claim.priority === 'medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                    "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              )}>
                                {(claim.priority || 'medium')} PRIORITY
                              </span>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Employee</span>
                                <span className="text-sm font-bold text-[var(--text-primary)] uppercase">{claim.users?.full_name || "Unidentified"}</span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Category</span>
                                <span className="text-sm font-bold text-[var(--text-primary)] uppercase">{claim.categories?.category_name || "Other"}</span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Amount</span>
                                <span className="text-lg font-black text-blue-400">{formatCurrency(claim.amount_claimed)}</span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Submitted</span>
                                <span className="text-sm font-bold text-[var(--text-secondary)] uppercase">{formatDate(claim.created_at)}</span>
                              </div>
                            </div>

                            {claim.policy_flags && claim.policy_flags.length > 0 && (
                              <div className="flex flex-wrap gap-3 mt-2">
                                {claim.policy_flags.map((flag: any, i: number) => (
                                  <div key={i} className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-red-400/5 border border-red-400/20 shadow-lg shadow-red-500/5">
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{flag.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex sm:flex-row lg:flex-col gap-4 shrink-0">
                            <div className="flex gap-4">
                              <Button className="h-12 text-[10px] font-black uppercase tracking-widest flex-1 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/20 rounded-2xl" onClick={() => handleApprove(claim)}>
                                <CheckCircle className="w-5 h-5 mr-3" /> Approve
                              </Button>
                              <Button variant="outline" className="h-12 text-[10px] font-black uppercase tracking-widest border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all flex-1 rounded-2xl" onClick={() => handleReject(claim)}>
                                <XCircle className="w-5 h-5 mr-3" /> Reject
                              </Button>
                            </div>
                            <Button variant="secondary" className="h-12 text-[10px] font-black uppercase tracking-widest border-[var(--border-subtle)] bg-[var(--card-dark)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] transition-all rounded-2xl" onClick={() => router.push(`/manager/reimbursements/${claim.reimbursement_id}?userId=${claim.user_id}`)}>
                              <Eye className="w-5 h-5 mr-3" /> Detailed Review
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Analytics Section Integrated */}
              <div className="mt-12 space-y-8">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Team Analytics</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-40 h-10 glass-effect border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--card-dark)] border-[var(--border-subtle)] rounded-xl">
                        <SelectItem value="1month">Last Month</SelectItem>
                        <SelectItem value="3months">Last 3 Months</SelectItem>
                        <SelectItem value="6months">Last 6 Months</SelectItem>
                        <SelectItem value="1year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="h-10 glass-effect border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Top Categories */}
                  <Card className="glass-effect border-[var(--border-subtle)] shadow-xl rounded-3xl overflow-hidden group">
                    <CardHeader className="p-8 border-b border-white/[0.05]">
                      <CardTitle className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                        Top Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-6">
                        {stats?.topCategories?.map((category: any, index: number) => (
                          <div key={index} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">
                                {category.category}
                              </span>
                              <div className="text-right">
                                <span className="text-xs font-black text-blue-400">
                                  {formatCurrency(category.amount)}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)] ml-2 font-bold uppercase tracking-widest">
                                  ({category.count} claims)
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-3 p-0.5 border border-white/5">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/20"
                                style={{ width: `${category.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {!stats?.topCategories && (
                          <p className="text-[10px] font-black uppercase text-[var(--text-muted)] text-center tracking-[0.2em] py-10 opacity-50">No category data available.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Trend */}
                  <Card className="glass-effect border-[var(--border-subtle)] shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-8 border-b border-white/[0.05]">
                      <CardTitle className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Monthly Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-6">
                        {stats?.monthlyTrend?.map((month: any, index: number) => {
                          const maxAmount = Math.max(...stats.monthlyTrend.map((m: any) => m.amount));
                          const percentage = (month.amount / maxAmount) * 100;

                          return (
                            <div key={index} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">
                                  {month.month}
                                </span>
                                <div className="text-right">
                                  <span className="text-xs font-black text-emerald-400">
                                    {formatCurrency(month.amount)}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)] ml-2 font-bold uppercase tracking-widest">
                                    ({month.claims} claims)
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-white/5 rounded-full h-3 p-0.5 border border-white/5">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 shadow-lg shadow-emerald-500/20"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {!stats?.monthlyTrend && (
                          <p className="text-[10px] font-black uppercase text-[var(--text-muted)] text-center tracking-[0.2em] py-10 opacity-50">No trend data available.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Team Performance */}
                <Card className="glass-effect border-[var(--border-subtle)] shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="p-8 border-b border-white/[0.05]">
                    <CardTitle className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                      <Users className="w-4 h-4 text-blue-500" />
                      Team Member Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {stats?.teamPerformance?.map((member: any, index: number) => (
                        <div
                          key={index}
                          className="flex flex-col p-6 glass-effect border border-white/5 rounded-3xl hover:bg-white/[0.03] transition-all group/member"
                        >
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20 group-hover/member:scale-110 transition-transform">
                              {member.user.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">
                                {member.user}
                              </p>
                              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">
                                {member.claims} total claims
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest text-[var(--text-secondary)]">Volume</span>
                              <span className="text-sm font-black text-[var(--text-primary)]">{formatCurrency(member.amount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest text-[var(--text-secondary)]">Avg Resolve</span>
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black text-[9px] uppercase tracking-widest rounded-xl px-3 py-1">
                                {member.avgTime}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!stats?.teamPerformance && (
                        <div className="col-span-full py-12 text-center">
                          <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-[0.2em] opacity-50">No team data discovered.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 2. Side Panel: Quick Actions & History (1/3 width) */}
            <div className="flex flex-col gap-8">
              {/* Quick Actions Card */}
              <Card className="border-[var(--border-subtle)] bg-[var(--card-dark)] shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-grid-slate-500/[0.05] bg-[length:30px_30px]" />
                <CardHeader className="p-8 relative z-10">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                    <Plus className="w-4 h-4 text-purple-500" />
                    Manager Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 relative z-10 flex flex-col gap-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={() => router.push(action.href)}
                      className="h-auto p-4 flex items-center justify-start gap-5 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] transition-all rounded-2xl text-left"
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform", action.color.replace('bg-', 'bg-opacity-80 text-').replace('-500', '-500'))}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                          {action.title}
                        </p>
                        <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase mt-0.5">
                          {action.description}
                        </p>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Recent History Feed */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Activity Feed</h3>
                  <Button variant="ghost" className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest hover:text-[var(--text-primary)]" onClick={() => router.push('/manager/reimbursements')}>VIEW LOGS</Button>
                </div>

                <div className="flex flex-col gap-3">
                  {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-500 w-5 h-5" /></div>
                  ) : historyClaims.length === 0 ? (
                    <p className="text-[9px] font-black uppercase text-[var(--text-muted)] text-center py-10 tracking-[0.2em]">Log empty.</p>
                  ) : (
                    historyClaims.slice(0, 5).map((claim) => (
                      <div key={claim.reimbursement_id} className="flex items-center justify-between p-4 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-2xl hover:bg-[var(--card-hover)] transition-colors group cursor-pointer" onClick={() => router.push(`/manager/reimbursements/${claim.reimbursement_id}?userId=${claim.user_id}`)}>
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            claim.status.toLowerCase() === 'approved' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-500"
                          )}>
                            {claim.status.toLowerCase() === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider">{claim.receipt_code}</p>
                            <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">{claim.users?.full_name}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-[var(--text-primary)] tracking-widest">{formatCurrency(claim.amount_claimed)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Dialog — Theme-aware */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-[var(--card-dark)] border border-[var(--border-subtle)] shadow-2xl rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase tracking-wider text-[var(--text-primary)]">
                {decisionType === "approved" ? "Approve" : "Reject"} Reimbursement
              </DialogTitle>
              <DialogDescription className="text-sm text-[var(--text-secondary)]">
                {decisionType === "approved"
                  ? "Are you sure you want to approve this reimbursement claim?"
                  : "Are you sure you want to reject this reimbursement claim? Please provide a reason."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {budgetError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-400 mb-1">Budget Exceeded</p>
                    <p className="text-xs text-red-300/80">{budgetError}</p>
                    <p className="text-xs text-amber-400/80 mt-2 font-medium">Please contact your admin to increase budget allocation.</p>
                  </div>
                  <button onClick={() => setBudgetError(null)} className="text-red-400/60 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {selectedApproval && (
                <div className="p-4 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl">
                  <p className="font-bold text-[var(--text-primary)] mb-1">
                    {selectedApproval.receipt_code}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {selectedApproval.receipt_code} • {formatCurrency(selectedApproval.amount_claimed)}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-[var(--text-primary)] mb-2 block">
                  {decisionType === "approved" ? "Comments (Optional)" : "Reason for Rejection *"}
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={decisionType === "approved"
                    ? "Add any comments..."
                    : "Please provide a reason for rejection..."}
                  className="min-h-[100px] bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
                  required={decisionType === "rejected"}
                />
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setComment("");
                  setDecisionType(null);
                  setBudgetError(null);
                }}
                disabled={isProcessing}
                className="border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--surface-elevated)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDecision}
                disabled={isProcessing || (decisionType === "rejected" && !comment.trim())}
                className={cn(
                  "text-white font-bold rounded-xl shadow-lg",
                  decisionType === "approved"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/20"
                    : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/20"
                )}
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    {decisionType === "approved" ? (
                      <><CheckCircle className="w-4 h-4 mr-2" />Approve</>
                    ) : (
                      <><XCircle className="w-4 h-4 mr-2" />Reject</>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========== CARD POPUP MODALS ========== */}

        {/* My Team Claims Popup */}
        <Dialog open={showTeamClaims} onOpenChange={setShowTeamClaims}>
          <DialogContent className="bg-[var(--card-dark)] border border-[var(--border-subtle)] shadow-2xl rounded-2xl max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-black uppercase tracking-wider text-[var(--text-primary)]">My Team Claims</DialogTitle>
                    <DialogDescription className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">All claims under your management</DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 -mx-6 px-6">
              {claims.length === 0 ? (
                <p className="text-center text-[var(--text-muted)] py-12 text-sm">No claims found.</p>
              ) : (
                <div className="space-y-3">
                  {claims.map((claim) => (
                    <div key={claim.reimbursement_id} className="flex items-center justify-between p-4 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--card-hover)] transition-colors">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          claim.status?.toLowerCase() === 'approved' ? "bg-emerald-500/10 text-emerald-400" :
                            claim.status?.toLowerCase() === 'rejected' ? "bg-red-500/10 text-red-400" :
                              "bg-amber-500/10 text-amber-400"
                        )}>
                          {claim.status?.toLowerCase() === 'approved' ? <CheckCircle className="w-4 h-4" /> :
                            claim.status?.toLowerCase() === 'rejected' ? <XCircle className="w-4 h-4" /> :
                              <Clock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">{claim.receipt_code}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] uppercase">{claim.users?.full_name || "Unknown"} • {claim.categories?.category_name || "Other"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <Badge className={cn(
                          "text-[9px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5",
                          claim.status?.toLowerCase() === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            claim.status?.toLowerCase() === 'rejected' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>{claim.status}</Badge>
                        <span className="text-xs font-black text-blue-400 whitespace-nowrap">{formatCurrency(claim.amount_claimed)}</span>
                        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">{formatDate(claim.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Pending Approvals Popup */}
        <Dialog open={showPendingPopup} onOpenChange={setShowPendingPopup}>
          <DialogContent className="bg-[var(--card-dark)] border border-[var(--border-subtle)] shadow-2xl rounded-2xl max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-black uppercase tracking-wider text-[var(--text-primary)]">Pending Approvals</DialogTitle>
                    <DialogDescription className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">{pendingCount} claims awaiting your decision</DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 -mx-6 px-6">
              {pendingApprovals.length === 0 ? (
                <p className="text-center text-[var(--text-muted)] py-12 text-sm">No pending claims.</p>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((claim) => (
                    <div key={claim.reimbursement_id} className="flex items-center justify-between p-4 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--card-hover)] transition-colors">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">{claim.receipt_code}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] uppercase">{claim.users?.full_name || "Unknown"} • {claim.categories?.category_name || "Other"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5">Pending</Badge>
                        <span className="text-xs font-black text-blue-400 whitespace-nowrap">{formatCurrency(claim.amount_claimed)}</span>
                        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">{formatDate(claim.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Team Budget Popup */}
        <Dialog open={showBudgetPopup} onOpenChange={setShowBudgetPopup}>
          <DialogContent className="bg-[var(--card-dark)] border border-[var(--border-subtle)] shadow-2xl rounded-2xl max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black uppercase tracking-wider text-[var(--text-primary)]">Team Budget</DialogTitle>
                  <DialogDescription className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">Budget allocation and usage overview</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 -mx-6 px-6 space-y-6">
              {/* Budget Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Utilization</p>
                  <p className={cn("text-2xl font-black",
                    (stats?.budgetUtilization || 0) >= 90 ? "text-red-400" :
                      (stats?.budgetUtilization || 0) >= 70 ? "text-amber-400" : "text-emerald-400"
                  )}>{stats?.budgetUtilization || 0}%</p>
                </div>
                <div className="p-4 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Total Budget</p>
                  <p className="text-lg font-black text-[var(--text-primary)]">{stats?.totalBudget ? formatCurrency(stats.totalBudget) : "—"}</p>
                </div>
                <div className="p-4 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Used</p>
                  <p className="text-lg font-black text-blue-400">{stats?.usedBudget ? formatCurrency(stats.usedBudget) : "—"}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-bold uppercase tracking-wider">Budget Usage</span>
                  <span className="text-[var(--text-primary)] font-black">{stats?.budgetUtilization || 0}%</span>
                </div>
                <div className="w-full bg-[var(--border-medium)] rounded-full h-4 p-0.5 border border-[var(--border-subtle)]">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700",
                      (stats?.budgetUtilization || 0) >= 90 ? "bg-gradient-to-r from-red-500 to-rose-500" :
                        (stats?.budgetUtilization || 0) >= 70 ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                          "bg-gradient-to-r from-emerald-500 to-blue-500"
                    )}
                    style={{ width: `${Math.min(stats?.budgetUtilization || 0, 100)}%` }}
                  />
                </div>
              </div>

              {/* Category Breakdown */}
              {stats?.topCategories && stats.topCategories.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Spending by Category</h4>
                  {stats.topCategories.map((cat: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl">
                      <span className="text-xs font-bold text-[var(--text-primary)] uppercase">{cat.category}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-[var(--border-medium)] rounded-full h-2">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${cat.percentage}%` }} />
                        </div>
                        <span className="text-xs font-black text-blue-400 w-20 text-right">{formatCurrency(cat.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!stats && (
                <p className="text-center text-[var(--text-muted)] py-8 text-sm">Budget data not available.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Team Members Popup */}
        <Dialog open={showTeamMembers} onOpenChange={setShowTeamMembers}>
          <DialogContent className="bg-[var(--card-dark)] border border-[var(--border-subtle)] shadow-2xl rounded-2xl max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black uppercase tracking-wider text-[var(--text-primary)]">Team Members</DialogTitle>
                  <DialogDescription className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">{stats?.teamMemberCount || 0} active team members</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 -mx-6 px-6">
              {stats?.teamPerformance && stats.teamPerformance.length > 0 ? (
                <div className="space-y-3">
                  {stats.teamPerformance.map((member: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--card-hover)] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20">
                          {member.user.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">{member.user}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{member.claims} claims • {formatCurrency(member.amount)}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold text-[9px] uppercase tracking-widest rounded-lg px-2 py-0.5">
                        {member.avgTime}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[var(--text-muted)] py-12 text-sm">No team members found.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Accepted Claims Popup */}
        <Dialog open={showAcceptedPopup} onOpenChange={setShowAcceptedPopup}>
          <DialogContent className="bg-[var(--card-dark)] border border-[var(--border-subtle)] shadow-2xl rounded-2xl max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-black uppercase tracking-wider text-[var(--text-primary)]">Accepted Claims</DialogTitle>
                    <DialogDescription className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">{acceptedCount} approved claims in your department</DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 -mx-6 px-6">
              {acceptedClaims.length === 0 ? (
                <p className="text-center text-[var(--text-muted)] py-12 text-sm">No approved claims found.</p>
              ) : (
                <div className="space-y-3">
                  {acceptedClaims.map((claim) => (
                    <div key={claim.reimbursement_id} className="flex items-center justify-between p-4 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--card-hover)] transition-colors">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">{claim.receipt_code}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] uppercase">{claim.users?.full_name || "Unknown"} • {claim.categories?.category_name || "Other"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5">Approved</Badge>
                        <span className="text-xs font-black text-blue-400 whitespace-nowrap">{formatCurrency(claim.amount_claimed)}</span>
                        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">{formatDate(claim.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Rejected Claims Popup */}
        <Dialog open={showRejectedPopup} onOpenChange={setShowRejectedPopup}>
          <DialogContent className="bg-[var(--card-dark)] border border-[var(--border-subtle)] shadow-2xl rounded-2xl max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-black uppercase tracking-wider text-[var(--text-primary)]">Rejected Claims</DialogTitle>
                    <DialogDescription className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">{rejectedCount} rejected claims in your department</DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 -mx-6 px-6">
              {rejectedClaims.length === 0 ? (
                <p className="text-center text-[var(--text-muted)] py-12 text-sm">No rejected claims found.</p>
              ) : (
                <div className="space-y-3">
                  {rejectedClaims.map((claim) => (
                    <div key={claim.reimbursement_id} className="flex items-center justify-between p-4 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--card-hover)] transition-colors">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">{claim.receipt_code}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] uppercase">{claim.users?.full_name || "Unknown"} • {claim.categories?.category_name || "Other"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5">Rejected</Badge>
                        <span className="text-xs font-black text-blue-400 whitespace-nowrap">{formatCurrency(claim.amount_claimed)}</span>
                        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">{formatDate(claim.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </ManagerLayout>
    </RouteProtection>
  );
}
