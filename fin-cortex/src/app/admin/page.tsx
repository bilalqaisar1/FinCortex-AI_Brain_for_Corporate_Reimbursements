"use client";

import { useState } from "react";
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
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  StatsCard, 
  PageHeader, 
  DashboardLayout
} from "@/components/dashboard";

// Essential KPIs only
const essentialStats = [
  {
    title: "Total Claims",
    value: "1,247",
    change: "+12%",
    changeType: "positive" as const,
    icon: Activity,
    description: "This month"
  },
  {
    title: "Pending Approvals",
    value: "23",
    change: "3 new",
    changeType: "warning" as const,
    icon: Clock,
    description: "Require attention"
  },
  {
    title: "Budget Used",
    value: "67%",
    change: "-5%",
    changeType: "positive" as const,
    icon: DollarSign,
    description: "Across all companies"
  },
  {
    title: "Policy Violations",
    value: "5",
    change: "2 resolved",
    changeType: "negative" as const,
    icon: AlertTriangle,
    description: "This week"
  }
];

// Pending approvals data
const pendingApprovals = [
  {
    id: "R-001",
    user: "John Smith",
    amount: "PKR 80,000",
    category: "Medical",
    reason: "Exceeds annual cap",
    priority: "high" as const,
    submitted: "2 hours ago"
  },
  {
    id: "R-002", 
    user: "Sarah Ahmed",
    amount: "PKR 15,000",
    category: "Travel",
    reason: "Unknown vendor",
    priority: "medium" as const,
    submitted: "4 hours ago"
  },
  {
    id: "R-003",
    user: "Ali Khan",
    amount: "PKR 5,000",
    category: "Meals",
    reason: "Exceeds daily limit",
    priority: "low" as const,
    submitted: "6 hours ago"
  }
];

// Recent activity data
const recentActivity = [
  {
    action: "User submitted claim",
    user: "John Smith",
    amount: "PKR 2,500",
    time: "5 minutes ago",
    type: "submission" as const
  },
  {
    action: "Manager approved 3 claims",
    user: "Sarah Ahmed",
    amount: "PKR 8,000",
    time: "1 hour ago",
    type: "approval" as const
  },
  {
    action: "System flagged violation",
    user: "Ali Khan",
    amount: "PKR 1,200",
    time: "2 hours ago",
    type: "violation" as const
  }
];

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
    title: "Pending Approvals",
    description: "Review pending claims",
    icon: Clock,
    href: "/admin/approvals",
    color: "bg-orange-500"
  }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <DashboardLayout>
      <div className="w-full max-w-full overflow-hidden">
        <PageHeader
          title="Admin Dashboard"
          description="Monitor system performance and manage operations"
          icon={Shield}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          actions={
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-200">
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Quick Add
              </Button>
            </div>
          }
        />

        {/* Essential KPIs - Mobile First Grid */}
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

        {/* Main Content - Mobile First Layout */}
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
              {pendingApprovals.map((approval, index) => (
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
              ))}
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
              {recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'submission' ? 'bg-blue-500' :
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
              ))}
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
      </div>
    </DashboardLayout>
  );
}