"use client";

import { useState, useEffect } from "react";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  DollarSign,
  Download,
  Filter,
  Loader2
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

// Mock data - replace with actual API call
const analyticsData: AnalyticsData = {
  totalClaims: 342,
  totalAmount: 1250000,
  averageClaim: 3655,
  approvalRate: 87.5,
  rejectionRate: 8.2,
  pendingRate: 4.3,
  topCategories: [
    { category: "Travel", count: 145, amount: 580000, percentage: 46.4 },
    { category: "Meals", count: 98, amount: 392000, percentage: 31.4 },
    { category: "Office Supplies", count: 65, amount: 195000, percentage: 15.6 },
    { category: "Training", count: 34, amount: 83000, percentage: 6.6 },
  ],
  monthlyTrend: [
    { month: "Jan", claims: 45, amount: 180000 },
    { month: "Feb", claims: 52, amount: 208000 },
    { month: "Mar", claims: 48, amount: 192000 },
    { month: "Apr", claims: 55, amount: 220000 },
    { month: "May", claims: 62, amount: 248000 },
    { month: "Jun", claims: 58, amount: 232000 },
  ],
  teamPerformance: [
    { user: "John Smith", claims: 45, amount: 180000, avgTime: "2.5 days" },
    { user: "Sarah Ahmed", claims: 38, amount: 152000, avgTime: "2.1 days" },
    { user: "Ali Khan", claims: 32, amount: 128000, avgTime: "3.2 days" },
  ]
};

export default function AnalyticsPage() {
  const { userProfile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("6months");

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userProfile?.user_id) return;
      setIsLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${baseUrl}/api/v1/reimbursements/manager/${userProfile.user_id}/stats`);
        const payload = await response.json();
        if (payload.success) {
          setData(payload.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [userProfile?.user_id]);

  const formatCurrency = (amount: number) => {
    return `PKR ${amount?.toLocaleString() || "0"}`;
  };

  if (isLoading) {
    return (
      <RouteProtection allowedRoles={['manager']}>
        <ManagerLayout>
          <div className="flex items-center justify-center h-[600px]">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        </ManagerLayout>
      </RouteProtection>
    );
  }

  const analytics: AnalyticsData = data || analyticsData;

  return (
    <RouteProtection allowedRoles={['manager']}>
      <ManagerLayout>
        <div className="w-full max-w-full overflow-hidden">
          <PageHeader
            title="Analytics & Reports"
            description="Comprehensive insights into your team's reimbursement patterns and performance"
            icon={BarChart3}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            actions={
              <div className="flex items-center space-x-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-40 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">Last Month</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-200">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            }
          />

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Claims</p>
                  <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {analytics.totalClaims}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-xs text-green-600 dark:text-green-400">+12% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Amount</p>
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(analytics.totalAmount)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-xs text-green-600 dark:text-green-400">+8% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Approval Rate</p>
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {analytics.approvalRate}%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-xs text-green-600 dark:text-green-400">+2.5% improvement</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Claim Amount</p>
                  <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(analytics.averageClaim)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  <span className="text-xs text-red-600 dark:text-red-400">-3% from last period</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Categories */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Top Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {category.category}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(category.amount)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                            ({category.count} claims)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {category.percentage.toFixed(1)}% of total amount
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Monthly Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.monthlyTrend.map((month, index) => {
                    const maxAmount = Math.max(...analytics.monthlyTrend.map(m => m.amount));
                    const percentage = (month.amount / maxAmount) * 100;

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {month.month}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {formatCurrency(month.amount)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                              ({month.claims} claims)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full bg-gradient-to-r from-green-500 to-blue-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Performance */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.teamPerformance.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.user.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {member.user}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {member.claims} claims • Avg: {member.avgTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(member.amount)}
                      </p>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mt-1">
                        Active
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ManagerLayout>
    </RouteProtection>
  );
}

