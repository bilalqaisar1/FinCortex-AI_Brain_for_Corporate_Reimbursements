"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  BarChart3,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  FileText,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  StatsCard,
  PageHeader,
  QuickAnalytics
} from "@/components/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAdminStats,
  fetchPendingApprovals,
  fetchRecentActivity,
  type AdminStats,
  type PendingApproval,
  type RecentActivity
} from "@/app/api/v1/admin/admin-api";
import {
  deletePolicyRule,
  fetchViolations,
  type PolicyRule,
  type RuleType,
  type CreateRuleInput,
  type PolicyViolation
} from "@/app/api/v1/admin/policy-rules-api";

// Quick actions
const quickActions = [
  {
    title: "Manage Users",
    description: "View and manage users",
    icon: Users,
    href: "/admin/users",
    color: "bg-blue-500"
  },
  {
    title: "View Reports",
    description: "Generate analytics reports",
    icon: BarChart3,
    href: "/admin/analytics",
    color: "bg-green-500"
  },
  {
    title: "Budget Overview",
    description: "Check budget utilization",
    icon: DollarSign,
    href: "/admin/budget",
    color: "bg-purple-500"
  },
  {
    title: "Policy Rules",
    description: "Manage reimbursement policies",
    icon: FileText,
    href: "/admin/policy-rules",
    color: "bg-orange-500"
  }
];

import { cn, formatCurrency, formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const { userProfile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [ruleTypes, setRuleTypes] = useState<RuleType[]>([]);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("Executive Console");
  const [auditApproval, setAuditApproval] = useState<PendingApproval | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!userProfile?.user_id) return;

      try {
        setLoading(true);
        setError(null);

        const adminId = userProfile.user_id;
        const [statsData, approvalsData, activityData] = await Promise.all([
          fetchAdminStats(adminId),
          fetchPendingApprovals(adminId),
          fetchRecentActivity(adminId)
        ]);

        setStats(statsData);
        if (statsData?.company_name) {
          setCompanyName(statsData.company_name);
        }
        setPendingApprovals(approvalsData || []);
        setRecentActivity(activityData || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Operational sync failed. Re-initiating connection...");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile?.user_id]);

  // Map stats to card format
  const essentialStats = stats ? [
    {
      title: "Consolidated Claims",
      value: stats.total_claims?.value?.toLocaleString() || "0",
      change: stats.total_claims?.change || "0%",
      changeType: stats.total_claims?.change?.startsWith("+") ? "positive" as const : "neutral" as const,
      icon: Activity,
      description: "MONTHLY THROUGHPUT"
    },
    {
      title: "Vetting Queue",
      value: stats.pending_approvals?.value?.toString() || "0",
      change: stats.pending_approvals?.change || "0",
      changeType: "warning" as const,
      icon: Clock,
      description: "CRITICAL ACTIONS"
    },
    {
      title: "Capital Utilization",
      value: `${stats.budget_utilization?.value || 0}%`,
      change: stats.budget_utilization?.change || "0%",
      changeType: stats.budget_utilization?.change?.startsWith("-") ? "positive" as const : "neutral" as const,
      icon: DollarSign,
      description: "BUDGET DEPLETION"
    },
    {
      title: "Integrity Flags",
      value: stats.policy_violations?.value?.toString() || "0",
      change: stats.policy_violations?.change || "0",
      changeType: (stats.policy_violations?.value || 0) > 0 ? "negative" as const : "positive" as const,
      icon: AlertTriangle,
      description: "POLICY COMPLIANCE"
    }
  ] : [];

  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        title={companyName}
        description="System-wide oversight & infrastructure management"
        icon={Shield}
        actions={
          <div className="flex items-center gap-4">
            <Button variant="brand" className="h-10 text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.push("/admin/users/create")}>
              <Plus className="w-4 h-4 mr-2" /> Deploy Asset
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="bg-[var(--card-dark)] border border-[var(--border-subtle)] p-1 mb-8">
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-[linear-gradient(135deg,#6366f1_0%,#a855f7_50%,#ec4899_100%)] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20 text-[10px] font-black uppercase tracking-widest px-6"
          >
            <BarChart3 className="w-3.5 h-3.5 mr-2" />
            Vetting Analytics
          </TabsTrigger>
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-[linear-gradient(135deg,#6366f1_0%,#a855f7_50%,#ec4899_100%)] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20 text-[10px] font-black uppercase tracking-widest px-6"
          >
            <Activity className="w-3.5 h-3.5 mr-2" />
            Consolidated Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 outline-none animate-in fade-in duration-500">
          <div className="flex flex-col gap-12">
            {/* Essential KPIs */}
            {!loading && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {essentialStats.map((stat, index) => (
                  <StatsCard
                    key={index}
                    {...stat}
                    className="animate-fade-in-up"
                  />
                ))}
              </div>
            )}

            {!loading && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* Main Console Area */}
                <div className="xl:col-span-8 flex flex-col gap-12">
                  {/* Pending Approvals */}
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                          <Clock className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Active Verifications</h2>
                      </div>
                      <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                        {pendingApprovals.length} PENDING BATCH
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-4">
                      {pendingApprovals.length === 0 ? (
                        <Card className="border-[var(--border-subtle)] bg-[var(--card-dark)] p-20 text-center">
                          <CheckCircle className="w-12 h-12 mx-auto mb-6 text-emerald-500 opacity-50" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Infrastructure integrity verified. No pending tasks.</p>
                        </Card>
                      ) : (
                        pendingApprovals.map((approval, index) => (
                          <Card
                            key={index}
                            className="group overflow-hidden border-[var(--border-subtle)] bg-[var(--card-dark)] hover:bg-[var(--card-hover)] transition-all duration-500"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-8 flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 mb-3">
                                  <span className="text-lg font-black text-[var(--text-primary)] tracking-tight">
                                    {approval.id}
                                  </span>
                                  <Badge
                                    className={cn(
                                      "text-[9px] font-black uppercase tracking-widest",
                                      approval.priority === 'high' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                        approval.priority === 'medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                    )}
                                  >
                                    {approval.priority} PRIORITY
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Originator</span>
                                    <span className="text-xs font-bold text-[var(--text-primary)] uppercase">{approval.user}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Valuation</span>
                                    <span className="text-xs font-bold text-purple-400">{approval.amount}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Sector</span>
                                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{approval.category}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Timestamp</span>
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{approval.submitted}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="secondary"
                                onClick={() => setAuditApproval(approval)}
                                className="h-10 text-[10px] font-black uppercase tracking-widest bg-[var(--card-dark)] border-[var(--border-subtle)] hover:bg-[var(--card-hover)]"
                              >
                                <Eye className="w-4 h-4 mr-2" /> Audit
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Actions Grid */}
                  <div className="flex flex-col gap-6">
                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] px-2 text-center">Infrastructure Controls</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      {quickActions.map((action, index) => (
                        <Card key={index} className="group overflow-hidden border-[var(--border-subtle)] bg-[var(--card-dark)] hover:bg-[var(--card-hover)] transition-all duration-500 cursor-pointer" onClick={() => router.push(action.href)}>
                          <CardContent className="p-8 flex flex-col items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110", action.color.replace('bg-', 'bg-opacity-20 text-').replace('-500', '-400'))}>
                              <action.icon className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest mb-1">{action.title}</p>
                              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase leading-tight">{action.description}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar Area */}
                <div className="xl:col-span-4 flex flex-col gap-12">
                  {/* System Log / Recent Activity */}
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3 px-2">
                      <Activity className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Real-time Telemetry</h3>
                    </div>

                    <div className="flex flex-col gap-3">
                      {recentActivity.length === 0 ? (
                        <Card className="border-[var(--border-subtle)] bg-[var(--card-dark)] p-12 text-center">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic">Establishing data stream...</p>
                        </Card>
                      ) : (
                        recentActivity.map((activity, index) => (
                          <div
                            key={index}
                            className="group flex flex-col gap-3 p-5 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-2xl hover:border-[var(--border-medium)] transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  activity.type === 'submission' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                                    activity.type === 'approval' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                      'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                )} />
                                <p className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-wide group-hover:text-purple-400 transition-colors">
                                  {activity.action}
                                </p>
                              </div>
                              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tabular-nums">{activity.time}</span>
                            </div>
                            <div className="flex items-center justify-between pl-5">
                              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{activity.user}</span>
                              <span className="text-[10px] font-black text-[var(--text-primary)]">{activity.amount}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <Button variant="ghost" className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] hover:text-[var(--text-primary)]" onClick={() => router.push('/admin/activity')}>
                      Access Historic Records
                    </Button>
                  </div>


                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 outline-none animate-in fade-in duration-500">
          <QuickAnalytics
            onRefresh={() => console.log("Refresh")}
            onExport={() => console.log("Export")}
          />
        </TabsContent>
      </Tabs>

      {/* Audit Detail Modal */}
      <Dialog open={!!auditApproval} onOpenChange={(open) => { if (!open) setAuditApproval(null); }}>
        <DialogContent className="sm:max-w-[520px] bg-[var(--card-dark)] border-[var(--border-subtle)] text-[var(--text-primary)] backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] text-lg font-black uppercase tracking-tight">
              Audit Details
            </DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              Verification record for claim {auditApproval?.id}
            </DialogDescription>
          </DialogHeader>

          {auditApproval && (
            <div className="space-y-6 py-4">
              {/* Claim ID & Priority */}
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-[var(--text-primary)] tracking-tight">{auditApproval.id}</span>
                <Badge
                  className={cn(
                    "text-[9px] font-black uppercase tracking-widest",
                    auditApproval.priority === 'high' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      auditApproval.priority === 'medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  )}
                >
                  {auditApproval.priority} PRIORITY
                </Badge>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Originator</span>
                  <span className="text-sm font-bold text-[var(--text-primary)] uppercase">{auditApproval.user}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Valuation</span>
                  <span className="text-sm font-bold text-purple-400">{auditApproval.amount}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Sector</span>
                  <span className="text-sm font-bold text-[var(--text-secondary)] uppercase">{auditApproval.category}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Submitted</span>
                  <span className="text-sm font-bold text-[var(--text-muted)] uppercase">{auditApproval.submitted}</span>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setAuditApproval(null)}
                  className="bg-[var(--card-dark)] border-[var(--border-medium)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}