"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface AnalyticsData {
  period: string;
  totalClaims: number;
  totalAmount: number;
  averageClaim: number;
  approvedClaims: number;
  pendingClaims: number;
  rejectedClaims: number;
  topCategory: string;
  topDepartment: string;
  monthlyTrend: number;
  weeklyTrend: number;
  activeUsers?: number;
}

interface QuickAnalyticsProps {
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const defaultData: AnalyticsData = {
  period: "Last 30 days",
  totalClaims: 0,
  totalAmount: 0,
  averageClaim: 0,
  approvedClaims: 0,
  pendingClaims: 0,
  rejectedClaims: 0,
  topCategory: "N/A",
  topDepartment: "N/A",
  monthlyTrend: 0,
  weeklyTrend: 0,
  activeUsers: 0
};

export function QuickAnalytics({
  onRefresh,
  onExport,
  className
}: QuickAnalyticsProps) {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [data, setData] = useState<AnalyticsData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const adminId = user?.id || '';
      const response = await fetch(`${BACKEND_URL}/api/v1/admin/analytics?admin_id=${adminId}&period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedPeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics();
    onRefresh?.();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-purple-500" />
              Quick Analytics
            </CardTitle>

            <div className="flex items-center space-x-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>

              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-8 px-3"
              >
                {isLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                Refresh
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={onExport}
                className="h-8 px-3"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Claims</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {data.totalClaims.toLocaleString()}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(data.monthlyTrend)}
                  <span className={cn("text-xs font-medium", getTrendColor(data.monthlyTrend))}>
                    {Math.abs(data.monthlyTrend)}%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Amount</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(data.totalAmount)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(data.weeklyTrend)}
                  <span className={cn("text-xs font-medium", getTrendColor(data.weeklyTrend))}>
                    {Math.abs(data.weeklyTrend)}%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Average Claim</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(data.averageClaim)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Per claim
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {(data.activeUsers || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  This period
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Status Breakdown */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Claims Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-green-900 dark:text-green-100">Approved</h3>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  {data.approvedClaims}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {((data.approvedClaims / data.totalClaims) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {data.approvedClaims.toLocaleString()} claims
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Pending</h3>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                  {data.pendingClaims}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {((data.pendingClaims / data.totalClaims) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {data.pendingClaims.toLocaleString()} claims
              </p>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-red-900 dark:text-red-100">Rejected</h3>
                <Badge variant="outline" className="bg-red-100 text-red-700">
                  {data.rejectedClaims}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {((data.rejectedClaims / data.totalClaims) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {data.rejectedClaims.toLocaleString()} claims
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Categories & Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Top Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {data.topCategory}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Most claimed category this period
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Top Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {data.topDepartment}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Most active department this period
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
