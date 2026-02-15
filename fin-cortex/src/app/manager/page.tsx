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
  Download
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
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
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
  const [timeRange, setTimeRange] = useState("6months");

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
        <div className="flex flex-col gap-12">
          <PageHeader
            title="Manager Command Center"
            description="Operational oversight & team reimbursement control"
            icon={Activity}
          />

          {/* Manager KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {managerStats.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                changeType={stat.changeType}
                icon={stat.icon}
                className="animate-fade-in-up"
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
                            <Button variant="secondary" className="h-12 text-[10px] font-black uppercase tracking-widest border-[var(--border-subtle)] bg-[var(--card-dark)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] transition-all rounded-2xl" onClick={() => router.push(`/manager/reimbursements/${claim.reimbursement_id}`)}>
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
                      <div key={claim.reimbursement_id} className="flex items-center justify-between p-4 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-2xl hover:bg-[var(--card-hover)] transition-colors group cursor-pointer" onClick={() => router.push(`/manager/reimbursements/${claim.reimbursement_id}`)}>
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
