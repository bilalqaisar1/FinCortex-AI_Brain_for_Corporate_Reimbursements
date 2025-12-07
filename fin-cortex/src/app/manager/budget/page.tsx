"use client";

import { useState } from "react";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  PieChart,
  BarChart3,
  Calendar,
  AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/dashboard";

// Mock data - replace with actual API call
const budgetData = {
  total_budget: 500000,
  used_budget: 225000,
  remaining_budget: 275000,
  utilization_percentage: 45,
  monthly_limit: 100000,
  monthly_used: 45000,
  monthly_remaining: 55000
};

const budgetByCategory = [
  { category: "Travel", used: 120000, limit: 200000, percentage: 60 },
  { category: "Meals", used: 45000, limit: 100000, percentage: 45 },
  { category: "Office Supplies", used: 30000, limit: 80000, percentage: 37.5 },
  { category: "Training", used: 30000, limit: 120000, percentage: 25 },
];

const recentTransactions = [
  {
    id: "1",
    type: "Debit",
    amount: 15000,
    description: "Reimbursement - RCP-2024-001",
    date: "2024-01-15T10:30:00Z",
    status: "completed"
  },
  {
    id: "2",
    type: "Debit",
    amount: 8500,
    description: "Reimbursement - RCP-2024-002",
    date: "2024-01-14T14:20:00Z",
    status: "completed"
  },
  {
    id: "3",
    type: "Credit",
    amount: 50000,
    description: "Budget Allocation",
    date: "2024-01-01T00:00:00Z",
    status: "completed"
  }
];

export default function BudgetPage() {
  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600 dark:text-red-400";
    if (percentage >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <RouteProtection allowedRoles={['manager']}>
      <ManagerLayout>
      <div className="w-full max-w-full overflow-hidden">
        <PageHeader
          title="Budget Management"
          description="Monitor and manage your team's budget allocation and spending"
          icon={DollarSign}
          iconColor="text-green-600 dark:text-green-400"
          iconBgColor="bg-green-100 dark:bg-green-900/30"
        />

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Budget</p>
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(budgetData.total_budget)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Used Budget</p>
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(budgetData.used_budget)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {budgetData.utilization_percentage}% utilized
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Remaining</p>
                <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className={`text-2xl font-bold ${getUtilizationColor(budgetData.utilization_percentage)}`}>
                {formatCurrency(budgetData.remaining_budget)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {100 - budgetData.utilization_percentage}% remaining
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Monthly Used</p>
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(budgetData.monthly_used)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                of {formatCurrency(budgetData.monthly_limit)} limit
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget by Category */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Budget by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetByCategory.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.category}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatCurrency(item.used)} / {formatCurrency(item.limit)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        item.percentage >= 90
                          ? "bg-red-500"
                          : item.percentage >= 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-300">
                      {item.percentage.toFixed(1)}% used
                    </span>
                    <span className="text-slate-500 dark:text-slate-300">
                      {formatCurrency(item.limit - item.used)} remaining
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "Credit"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-red-100 dark:bg-red-900/30"
                        }`}
                      >
                        {transaction.type === "Credit" ? (
                          <ArrowUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          transaction.type === "Credit"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaction.type === "Credit" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs mt-1"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Warning */}
        {budgetData.utilization_percentage >= 70 && (
          <Card className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-200">
                    Budget Alert
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Your team has used {budgetData.utilization_percentage}% of the allocated budget. 
                    Consider reviewing spending patterns or requesting additional budget allocation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ManagerLayout>
    </RouteProtection>
  );
}

