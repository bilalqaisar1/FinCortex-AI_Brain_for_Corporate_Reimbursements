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
  StatsCard,
  PageHeader,
  DashboardLayout
} from "@/components/dashboard";
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

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const { userProfile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("Admin Dashboard");

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
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile?.user_id]);

  // Map stats to card format
  const essentialStats = stats ? [
    {
      title: "Total Claims",
      value: stats.total_claims?.value?.toLocaleString() || "0",
      change: stats.total_claims?.change || "0%",
      changeType: stats.total_claims?.change?.startsWith("+") ? "positive" as const : "neutral" as const,
      icon: Activity,
      description: stats.total_claims?.description || "This month"
    },
    {
      title: "Pending Approvals",
      value: stats.pending_approvals?.value?.toString() || "0",
      change: stats.pending_approvals?.change || "0",
      changeType: "warning" as const,
      icon: Clock,
      description: stats.pending_approvals?.description || "Require attention"
    },
    {
      title: "Budget Used",
      value: `${stats.budget_utilization?.value || 0}%`,
      change: stats.budget_utilization?.change || "0%",
      changeType: stats.budget_utilization?.change?.startsWith("-") ? "positive" as const : "neutral" as const,
      icon: DollarSign,
      description: stats.budget_utilization?.description || "Utilization"
    },
    {
      title: "Policy Violations",
      value: stats.policy_violations?.value?.toString() || "0",
      change: stats.policy_violations?.change || "0",
      changeType: (stats.policy_violations?.value || 0) > 0 ? "negative" as const : "positive" as const,
      icon: AlertTriangle,
      description: stats.policy_violations?.description || "Potential issues"
    }
  ] : [];

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader
        title={companyName}
        description={`Dashboard for ${companyName} - Monitor performance and manage operations`}
        icon={Shield}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-200" onClick={() => router.push("/admin/analytics")}>
              <Eye className="w-4 h-4 mr-2" />
              View All
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white" onClick={() => router.push("/admin/users/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Quick Add
            </Button>
          </div>
        }
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-slate-600">Loading dashboard data...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="bg-red-50 border-red-200 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Essential KPIs - Mobile First Grid */}
      {!loading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 w-full min-w-0">
          {essentialStats.map((stat, index) => (
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
                description={stat.description}
              />
            </div>
          ))}
        </div>
      )}

      {/* Main Content - Mobile First Layout */}
      {!loading && (
        <div className="space-y-6">
          {/* Pending Approvals - Priority Section */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-500" />
                  Pending Approvals
                </CardTitle>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  {pendingApprovals.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No pending approvals. All caught up!</p>
                </div>
              ) : (
                pendingApprovals.map((approval, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {approval.id}
                        </span>
                        <Badge
                          variant={approval.priority === 'high' ? 'destructive' : approval.priority === 'medium' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {approval.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {approval.user} • {approval.amount} • {approval.category}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {approval.reason} • {approval.submitted}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/admin/approvals")}
                        className="h-8 px-3"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className={`w-2 h-2 rounded-full ${activity.type === 'submission' ? 'bg-blue-500' :
                      activity.type === 'approval' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {activity.action}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {activity.user} • {activity.amount} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
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
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {action.description}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}