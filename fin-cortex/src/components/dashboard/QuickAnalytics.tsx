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
import { BACKEND_URL } from "@/lib/config";

import { UsersListModal, UserItem } from "./UsersListModal";

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
  activeManagers?: number;
  managersList?: UserItem[];
  usersList?: UserItem[];
}

interface QuickAnalyticsProps {
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
}

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
  activeUsers: 0,
  activeManagers: 0,
  managersList: [],
  usersList: []
};

export function QuickAnalytics({
  onRefresh,
  onExport,
  className
}: QuickAnalyticsProps) {
  const { userProfile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [data, setData] = useState<AnalyticsData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'manager' | 'user'>('user');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const adminId = userProfile?.user_id || '';
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
  }, [userProfile?.user_id, selectedPeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics();
    onRefresh?.();
  };

  const openModal = (type: 'manager' | 'user') => {
    setModalType(type);
    setModalOpen(true);
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

  return (
    <div className={cn("space-y-6", className)}>
      <UsersListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === 'manager' ? "Active Managers" : "Active Users"}
        type={modalType}
        data={modalType === 'manager' ? (data.managersList || []) : (data.usersList || [])}
      />

      {/* Header */}
      <Card className="bg-[var(--card-dark)] backdrop-blur-3xl border-[var(--border-subtle)] shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <CardTitle className="text-xl font-black text-[var(--text-primary)] flex items-center tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mr-3">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              QUICK ANALYTICS
            </CardTitle>

            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-4 py-2 border border-[var(--border-medium)] rounded-xl bg-[var(--card-dark)] text-[var(--text-secondary)] text-[10px] font-bold tracking-widest focus:outline-none focus:border-purple-500/40 appearance-none cursor-pointer hover:bg-[var(--card-hover)] transition-colors"
                style={{ backgroundImage: 'none' }}
              >
                <option value="7d" className="bg-slate-900">LAST 7 DAYS</option>
                <option value="30d" className="bg-slate-900">LAST 30 DAYS</option>
                <option value="90d" className="bg-slate-900">LAST 90 DAYS</option>
                <option value="1y" className="bg-slate-900">LAST YEAR</option>
              </select>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-9 px-4 rounded-xl hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all text-[10px] font-black tracking-widest"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />}
                REFRESH
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onExport}
                className="h-9 px-4 rounded-xl hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all text-[10px] font-black tracking-widest"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                EXPORT
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Claims", value: data.totalClaims.toLocaleString(), trend: data.monthlyTrend, icon: FileText, color: "blue", action: null },
          { label: "Total Amount", value: formatCurrency(data.totalAmount), trend: data.weeklyTrend, icon: DollarSign, color: "green", action: null },
          { label: "Average Claim", value: formatCurrency(data.averageClaim), sub: "Per claim", icon: BarChart3, color: "purple", action: null },
          { label: "Active Users", value: (data.activeUsers || 0).toLocaleString(), sub: "Total users", icon: Users, color: "orange", action: () => openModal('user') },
          { label: "Active Managers", value: (data.activeManagers || 0).toLocaleString(), sub: "Dept Heads", icon: Users, color: "cyan", action: () => openModal('manager') }
        ].map((metric, idx) => (
          <Card
            key={idx}
            className={cn("bg-[var(--card-dark)] backdrop-blur-3xl border-[var(--border-subtle)] shadow-2xl relative group overflow-hidden transition-all duration-300",
              metric.action ? "cursor-pointer hover:border-purple-500/30 hover:shadow-purple-500/10 hover:-translate-y-1" : ""
            )}
            onClick={metric.action || undefined}
          >
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
              metric.color === 'blue' ? "bg-blue-500/5" :
                metric.color === 'green' ? "bg-green-500/5" :
                  metric.color === 'purple' ? "bg-purple-500/5" :
                    metric.color === 'orange' ? "bg-orange-500/5" : "bg-cyan-500/5"
            )} />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border",
                  metric.color === 'blue' ? "bg-blue-500/10 border-blue-500/20" :
                    metric.color === 'green' ? "bg-green-500/10 border-green-500/20" :
                      metric.color === 'purple' ? "bg-purple-500/10 border-purple-500/20" :
                        metric.color === 'orange' ? "bg-orange-500/10 border-orange-500/20" : "bg-cyan-500/10 border-cyan-500/20"
                )}>
                  <metric.icon className={cn("w-5 h-5",
                    metric.color === 'blue' ? "text-blue-400" :
                      metric.color === 'green' ? "text-green-400" :
                        metric.color === 'purple' ? "text-purple-400" :
                          metric.color === 'orange' ? "text-orange-400" : "text-cyan-400"
                  )} />
                </div>
                {metric.trend !== undefined && (
                  <div className="flex items-center gap-1 bg-[var(--card-dark)] px-2 py-1 rounded-lg border border-[var(--border-subtle)]">
                    {getTrendIcon(metric.trend)}
                    <span className={cn("text-[10px] font-black", metric.trend >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {Math.abs(metric.trend)}%
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{metric.label}</p>
                <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-1.5">{metric.value}</p>
                {metric.sub && <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{metric.sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Claims Status Breakdown */}
      <Card className="bg-[var(--card-dark)] backdrop-blur-3xl border-[var(--border-subtle)] shadow-2xl">
        <CardHeader className="pb-4 border-b border-[var(--border-subtle)]">
          <CardTitle className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">
            Claims Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Approved", count: data.approvedClaims, color: "emerald" },
              { label: "Pending", count: data.pendingClaims, color: "yellow" },
              { label: "Rejected", count: data.rejectedClaims, color: "red" }
            ].map((status, idx) => (
              <div key={idx} className="p-6 bg-[var(--card-dark)] rounded-2xl border border-[var(--border-subtle)] group hover:bg-[var(--card-hover)] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={cn("text-[10px] font-black uppercase tracking-widest",
                    status.color === 'emerald' ? "text-emerald-400" :
                      status.color === 'yellow' ? "text-yellow-400" : "text-red-400"
                  )}>{status.label}</h3>
                  <Badge variant="outline" className={cn("border-0 text-[10px] font-black px-2 py-0.5",
                    status.color === 'emerald' ? "bg-emerald-500/10 text-emerald-400" :
                      status.color === 'yellow' ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"
                  )}>
                    {status.count}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">
                    {data.totalClaims > 0 ? ((status.count / data.totalClaims) * 100).toFixed(1) : "0"}%
                  </p>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Share</span>
                </div>
                <div className="mt-4 w-full bg-[var(--card-dark)] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-700",
                      status.color === 'emerald' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                        status.color === 'yellow' ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" :
                          "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                    )}
                    style={{ width: `${data.totalClaims > 0 ? (status.count / data.totalClaims) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Categories & Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: "Top Category", icon: FileText, value: data.topCategory, sub: "Most claimed category", color: "blue" },
          { title: "Top Department", icon: Users, value: data.topDepartment, sub: "Most active department", color: "purple" }
        ].map((section, idx) => (
          <Card key={idx} className="bg-[var(--card-dark)] backdrop-blur-3xl border-[var(--border-subtle)] shadow-2xl group overflow-hidden">
            <div className={cn("absolute inset-y-0 right-0 w-32 opacity-0 group-hover:opacity-10 transition-opacity blur-3xl",
              section.color === 'blue' ? "bg-blue-600" : "bg-purple-600"
            )} />
            <CardHeader className="pb-4 border-b border-[var(--border-subtle)]">
              <CardTitle className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border shadow-inner transition-transform group-hover:scale-110 duration-500",
                  section.color === 'blue' ? "bg-blue-500/10 border-blue-500/20" : "bg-purple-500/10 border-purple-500/20"
                )}>
                  <section.icon className={cn("w-10 h-10",
                    section.color === 'blue' ? "text-blue-400" : "text-purple-400"
                  )} />
                </div>
                <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter mb-2 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[var(--text-primary)] group-hover:to-[var(--text-muted)] transition-all duration-500">
                  {section.value}
                </h3>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                  {section.sub}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
