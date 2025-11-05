"use client";

import { useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Building2,
  BarChart3,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BudgetData {
  companyId: string;
  companyName: string;
  totalBudget: number;
  usedAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  status: "healthy" | "warning" | "critical";
  lastUpdated: string;
  monthlyLimit: number;
  monthlyUsed: number;
}

interface BudgetOverviewProps {
  budgets?: BudgetData[];
  onViewDetails?: (companyId: string) => void;
  onAddBudget?: () => void;
  className?: string;
}

const mockBudgets: BudgetData[] = [
  {
    companyId: "C-001",
    companyName: "TechCorp Solutions",
    totalBudget: 500000,
    usedAmount: 320000,
    remainingAmount: 180000,
    utilizationPercentage: 64,
    status: "healthy",
    lastUpdated: "2 hours ago",
    monthlyLimit: 50000,
    monthlyUsed: 35000
  },
  {
    companyId: "C-002",
    companyName: "FinanceHub Ltd",
    totalBudget: 300000,
    usedAmount: 280000,
    remainingAmount: 20000,
    utilizationPercentage: 93,
    status: "critical",
    lastUpdated: "1 hour ago",
    monthlyLimit: 30000,
    monthlyUsed: 28000
  },
  {
    companyId: "C-003",
    companyName: "MarketingPro Inc",
    totalBudget: 200000,
    usedAmount: 120000,
    remainingAmount: 80000,
    utilizationPercentage: 60,
    status: "healthy",
    lastUpdated: "3 hours ago",
    monthlyLimit: 20000,
    monthlyUsed: 15000
  },
  {
    companyId: "C-004",
    companyName: "StartupXYZ",
    totalBudget: 100000,
    usedAmount: 85000,
    remainingAmount: 15000,
    utilizationPercentage: 85,
    status: "warning",
    lastUpdated: "4 hours ago",
    monthlyLimit: 10000,
    monthlyUsed: 8500
  }
];

export function BudgetOverview({ 
  budgets = mockBudgets,
  onViewDetails,
  onAddBudget,
  className 
}: BudgetOverviewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600 bg-green-100";
      case "warning": return "text-yellow-600 bg-yellow-100";
      case "critical": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-4 h-4" />;
      case "warning": return <AlertTriangle className="w-4 h-4" />;
      case "critical": return <AlertTriangle className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.totalBudget, 0);
  const totalUsed = budgets.reduce((sum, budget) => sum + budget.usedAmount, 0);
  const totalRemaining = totalBudget - totalUsed;
  const overallUtilization = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Budget</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Used Amount</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(totalUsed)}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Remaining</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Utilization</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {overallUtilization.toFixed(1)}%
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Budgets */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center">
              <Building2 className="w-6 h-6 mr-2 text-blue-500" />
              Company Budgets
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={onAddBudget}
                className="h-8 px-3"
              >
                <DollarSign className="w-3 h-3 mr-1" />
                Add Budget
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {budgets.map((budget, index) => (
            <div 
              key={budget.companyId}
              className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {budget.companyName}
                  </h3>
                  <Badge 
                    variant="outline"
                    className={cn("text-xs flex items-center space-x-1", getStatusColor(budget.status))}
                  >
                    {getStatusIcon(budget.status)}
                    <span className="capitalize">{budget.status}</span>
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Updated {budget.lastUpdated}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Budget</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(budget.totalBudget)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Used Amount</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(budget.usedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Remaining</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(budget.remainingAmount)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Budget Utilization
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {budget.utilizationPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      budget.status === "critical" ? "bg-red-500" :
                      budget.status === "warning" ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${Math.min(budget.utilizationPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Monthly Usage */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Monthly: {formatCurrency(budget.monthlyUsed)} / {formatCurrency(budget.monthlyLimit)}
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onViewDetails?.(budget.companyId)}
                  className="h-8 px-3"
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
