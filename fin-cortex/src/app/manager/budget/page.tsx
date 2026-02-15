
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
    // Prefer manager_id from profile when available; fall back to user_id
    const managerId = userProfile?.manager_id || userProfile?.user_id;
    if (managerId) {
      fetchBudget(managerId);
    }
  }, [userProfile?.manager_id, userProfile?.user_id]);

  const fetchBudget = async (managerId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/v1/manager/budget?manager_id=${managerId}`);
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.warn("Budget fetch returned non-OK:", response.status, errBody.detail || "");
        // Don't throw — show the "no data" state instead
        setBudgetData(null);
        return;
      }
      const result = await response.json();
      setBudgetData(result.data);
    } catch (err: any) {
      console.warn("Budget fetch error:", err.message || err);
      setBudgetData(null);
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
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-amber-500";
    return "text-emerald-500";
  };

  if (loading) {
    return (
      <RouteProtection allowedRoles={['manager']}>
        <ManagerLayout>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        </ManagerLayout>
      </RouteProtection>
    );
  }

  if (!budgetData) {
    return (
      <RouteProtection allowedRoles={['manager']}>
        <ManagerLayout>
          <div className="p-6 text-center text-[var(--text-secondary)]">
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
            iconColor="text-emerald-500"
            iconBgColor="bg-emerald-500/10"
          />

          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Total Budget</p>
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(budgetData.total_budget)}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  For {budgetData.department_name}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Used Budget</p>
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(budgetData.used_budget)}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {budgetData.utilization_percentage}% utilized
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Remaining</p>
                  <TrendingDown className="w-5 h-5 text-emerald-500" />
                </div>
                <p className={`text-2xl font-bold ${getUtilizationColor(budgetData.utilization_percentage)}`}>
                  {formatCurrency(budgetData.remaining_budget)}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {100 - budgetData.utilization_percentage}% remaining
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Monthly Used</p>
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(budgetData.monthly_used)}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  of {budgetData.monthly_limit > 0 ? formatCurrency(budgetData.monthly_limit) : "No Limit"} limit
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget by Category */}
            <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-[var(--text-primary)]">
                  <PieChart className="w-5 h-5 mr-2 text-purple-500" />
                  Budget by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgetData.categories && budgetData.categories.length > 0 ? (
                  budgetData.categories.map((item: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {item.category}
                        </span>
                        <span className="text-sm text-[var(--text-secondary)]">
                          {formatCurrency(item.used)}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--border-medium)] rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${"bg-blue-500"
                            }`}
                          style={{ width: `${Math.min(item.percentage || 50, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)]">
                          Spent
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-[var(--text-muted)] py-4">No category spending data yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-[var(--text-primary)]">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgetData.recent_transactions && budgetData.recent_transactions.length > 0 ? (
                    budgetData.recent_transactions.map((transaction: any) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === "Credit"
                              ? "bg-green-500/10"
                              : "bg-red-500/10"
                              }`}
                          >
                            {transaction.type === "Credit" ? (
                              <ArrowUp className="w-5 h-5 text-green-500" />
                            ) : (
                              <ArrowDown className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${transaction.type === "Credit"
                              ? "text-green-500"
                              : "text-red-500"
                              }`}
                          >
                            {transaction.type === "Credit" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <Badge
                            variant="secondary"
                            className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs mt-1"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[var(--text-muted)] py-4">No recent transactions.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Warning */}
          {budgetData.utilization_percentage >= 70 && budgetData.total_budget > 0 && (
            <Card className="mt-6 bg-amber-500/10 border-amber-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      Budget Alert
                    </p>
                    <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
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

