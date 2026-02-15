"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { useAuth } from "@/context/AuthContext";
import { NotificationCenter } from "@/components/NotificationCenter";
import { UserLayout } from "@/components/dashboard/UserLayout";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  RotateCcw,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { BACKEND_URL } from "@/lib/config";

export default function UserDashboardPage() {
  const { toggleTheme, themeIcon } = useTheme();
  const { user, userProfile } = useAuth();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/reimbursements/user/${user.id}/dashboard-stats`);

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }

      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (err: any) {
      console.error("Error fetching dashboard stats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboardStats();
      const interval = setInterval(fetchDashboardStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const displayName =
    userProfile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const roleLabel =
    userProfile?.roles?.role_name ||
    (userProfile?.userRole
      ? userProfile.userRole.charAt(0).toUpperCase() + userProfile.userRole.slice(1)
      : userProfile?.employee_code
        ? "Employee"
        : "Member");

  const employeeCode = userProfile?.employee_code || "N/A";
  const userInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const today = React.useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }, []);

  const kpis = dashboardData?.kpis || [
    { label: "Total Reimbursed (YTD)", value: "₹0.00", sub: "Loading...", subClass: "text-muted-foreground" },
    { label: "Allowed Reimbursement", value: "₹0.00", sub: "Loading...", subClass: "text-muted-foreground" },
    { label: "Pending Claims", value: "0", sub: "Loading...", subClass: "text-muted-foreground" },
    { label: "Approval Rate", value: "0%", sub: "Loading...", subClass: "text-muted-foreground" },
  ];

  const recentClaims = dashboardData?.recent_claims?.map((c: any) => ({
    id: c.receipt_code || `#C-${c.reimbursement_id.slice(0, 5)}`,
    category: c.categories?.category_name || "Other",
    date: new Date(c.created_at).toLocaleDateString(),
    amount: `₹${parseFloat(c.amount_claimed || 0).toLocaleString()}`,
    status: {
      label: c.status.charAt(0).toUpperCase() + c.status.slice(1),
      color: c.status === 'approved' ? "text-emerald-400/90" : c.status === 'pending' ? "text-amber-400/90" : "text-red-500/90",
      bg: c.status === 'approved' ? "bg-emerald-400/10" : c.status === 'pending' ? "bg-amber-400/10" : "bg-red-500/10"
    }
  })) || [];

  const budgetOverview = dashboardData?.budget_overview || [
    { category: "Travel", used: 0, limit: 1, percentage: 0 },
    { category: "Meals & Entertainment", used: 0, limit: 1, percentage: 0 },
    { category: "Office Supplies", used: 0, limit: 1, percentage: 0 },
  ];

  return (
    <RouteProtection allowedRoles={['user']}>
      <UserLayout>
        <div className="flex flex-col gap-10">
          {/* Top Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] flex items-center justify-center text-white text-xl font-black shadow-lg shadow-purple-500/20">
                  {userInitials}
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] uppercase">Welcome, {displayName}</h1>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm font-medium">
                    <span className="bg-[var(--card-dark)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest text-purple-400">{roleLabel}</span>
                    <span>•</span>
                    <span>{employeeCode}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Current Date</p>
              <p className="text-sm font-bold text-[var(--text-primary)] uppercase">{today}</p>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi: any, idx: number) => (
              <Card key={kpi.label} className="group overflow-hidden border-[var(--border-subtle)] bg-[var(--card-dark)] hover:bg-[var(--card-hover)] transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-8 flex flex-col gap-1">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-purple-400 transition-colors">{kpi.label}</p>
                  <p className="text-3xl font-black text-[var(--text-primary)]">{kpi.value}</p>
                  <p className={cn("text-xs font-bold mt-2", kpi.subClass)}>{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Budget Overview (2/3 width) */}
            <Card className="lg:col-span-2 border-[var(--border-subtle)] bg-[var(--card-dark)]">
              <CardHeader className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Budget Utilization</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">Real-time spend tracking by category</CardDescription>
                  </div>
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 flex flex-col gap-8">
                {budgetOverview.map((item: any, idx: number) => (
                  <div key={idx} className="group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">{item.category}</span>
                      <div className="text-right">
                        <span className="text-sm font-black text-[var(--text-primary)]">₹{item.used?.toLocaleString()}</span>
                        <span className="text-xs font-bold text-slate-500 ml-1">/ ₹{item.limit?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-[var(--background-dark)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out",
                          item.percentage > 90 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" :
                            item.percentage > 70 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" :
                              "bg-gradient-to-r from-[#6366f1] to-[#a855f7] shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        )}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        item.percentage > 90 ? "text-red-400" : item.percentage > 70 ? "text-amber-400" : "text-slate-500"
                      )}>
                        {item.percentage}% CONFIGURED
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        ₹{(item.limit - item.used).toLocaleString()} REMAINING
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions (1/3 width) */}
            <div className="flex flex-col gap-6">
              <Card className="border-[var(--border-subtle)] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 shadow-xl border-indigo-500/20 overflow-hidden relative group">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
                <CardContent className="p-8 flex flex-col gap-6 relative z-10">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <RotateCcw className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Need a Refund?</h3>
                    <p className="text-indigo-200/60 text-sm mt-1 font-medium italic">Fast AI-powered processing</p>
                  </div>
                  <Link href="/user/claims/new">
                    <Button variant="brand" className="w-full">Submit New Claim</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-[var(--border-subtle)] bg-[var(--card-dark)] flex-1">
                <CardHeader className="px-8 pt-8">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Support Access</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-4 flex flex-col gap-4">
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer group">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">AI Assistant</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">24/7 Support</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer group">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">Policy Guide</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Read Terms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Recent Claims</h2>
              <Link href="/user/claims/history">
                <Button variant="ghost" size="sm" className="text-xs font-black uppercase text-slate-500 tracking-widest hover:text-white">View Full History</Button>
              </Link>
            </div>
            <Card className="border-[var(--border-subtle)] bg-[var(--card-dark)] overflow-hidden">
              <Table>
                <TableHeader className="bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Claim ID</TableHead>
                    <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Category</TableHead>
                    <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Submission Date</TableHead>
                    <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Amount</TableHead>
                    <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentClaims.map((c: any) => (
                    <TableRow key={c.id} className="border-b border-[var(--border-subtle)] group hover:bg-[var(--card-hover)] transition-colors">
                      <TableCell className="px-8 py-6 text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{c.id}</TableCell>
                      <TableCell className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-400 uppercase bg-white/5 px-2 py-1 rounded-md">{c.category}</span>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-xs font-bold text-slate-500 uppercase">{c.date}</TableCell>
                      <TableCell className="px-8 py-6 text-right">
                        <span className="text-base font-black text-[var(--text-primary)]">{c.amount}</span>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-center">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          c.status.color.includes('emerald') ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            c.status.color.includes('amber') ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                          {c.status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentClaims.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-600">No recent claims discovered</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Additional Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-[var(--border-subtle)] bg-[var(--card-dark)] p-8 group hover:bg-[var(--card-hover)] transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Avg Claim</p>
              </div>
              <p className="text-3xl font-black text-[var(--text-primary)]">₹{dashboardData?.avg_claim_amount?.toLocaleString() || "0"}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Annualized average</p>
            </Card>

            <Card className="border-[var(--border-subtle)] bg-[var(--card-dark)] p-8 group hover:bg-[var(--card-hover)] transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Fastest Approval</p>
              </div>
              <p className="text-3xl font-black text-[var(--text-primary)]">{dashboardData?.fastest_approval || "2 Days"}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Peak efficiency</p>
            </Card>

            <Card className="border-[var(--border-subtle)] bg-[var(--card-dark)] p-8 group hover:bg-[var(--card-hover)] transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Longest Wait</p>
              </div>
              <p className="text-3xl font-black text-[var(--text-primary)]">{dashboardData?.slowest_approval || "12 Days"}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Maximum duration</p>
            </Card>
          </div>
        </div>
      </UserLayout>
    </RouteProtection>
  );
}
