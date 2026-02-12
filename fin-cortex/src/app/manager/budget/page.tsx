
"use client";

import { useState, useEffect } from "react";
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
import { useAuth } from "@/context/AuthContext";

export default function BudgetPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.user_id) {
      fetchBudget(userProfile.user_id);
    }
  }, [userProfile?.user_id]);

  const fetchBudget = async (managerId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/manager/budget?manager_id=${managerId}`);
      if (!response.ok) throw new Error("Failed to fetch budget");
      const result = await response.json();
      setBudgetData(result.data);
    } catch (err) {
      setError("Failed to load budget data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
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

  if (loading) {
    return (
      <RouteProtection allowedRoles={['manager']}>
        <ManagerLayout>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </ManagerLayout>
      </RouteProtection>
    );
  }

  if (!budgetData) {
    return (
      <RouteProtection allowedRoles={['manager']}>
        <ManagerLayout>
          <div className="p-6 text-center">
            <p>No budget data available.</p>
          </div>
        </ManagerLayout>
      </RouteProtection>
    )
  }

  return (
    <RouteProtection allowedRoles={['manager']}>
      <ManagerLayout>
        <div className="w-full max-w-full overflow-hidden">
          <PageHeader
            title={`${budgetData.department_name} Budget`}
            description="Monitor and manage your department's budget allocation and spending"
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
                <p className="text-xs text-slate-500 mt-1">
                  For {budgetData.department_name}
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
                  of {budgetData.monthly_limit > 0 ? formatCurrency(budgetData.monthly_limit) : "No Limit"} limit
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
                {budgetData.categories && budgetData.categories.length > 0 ? (
                  budgetData.categories.map((item: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {item.category}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {formatCurrency(item.used)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${"bg-blue-500"
                            }`}
                          style={{ width: `${Math.min(item.percentage || 50, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-300">
                          Spent
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-4">No category spending data yet.</p>
                )}
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
                  {budgetData.recent_transactions && budgetData.recent_transactions.length > 0 ? (
                    budgetData.recent_transactions.map((transaction: any) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === "Credit"
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
                            className={`text-sm font-semibold ${transaction.type === "Credit"
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
                    ))
                  ) : (
                    <p className="text-center text-slate-500 py-4">No recent transactions.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Warning */}
          {budgetData.utilization_percentage >= 70 && budgetData.total_budget > 0 && (
            <Card className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-200">
                      Budget Alert
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Your department has used {budgetData.utilization_percentage}% of the allocated budget.
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

