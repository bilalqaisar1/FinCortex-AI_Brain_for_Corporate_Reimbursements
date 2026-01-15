"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Building2,
  BarChart3,
  Calendar,
  Plus,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  fetchBudgets,
  createBudget,
  addFundsToBudget,
  type Budget,
  type CreateBudgetInput
} from "@/app/api/v1/admin/budget-api";

interface BudgetOverviewProps {
  onViewDetails?: (companyId: string) => void;
  onAddBudget?: () => void;
  className?: string;
}

export function BudgetOverview({
  onViewDetails,
  onAddBudget,
  className
}: BudgetOverviewProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  // Add budget dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState<CreateBudgetInput>({
    company_name: "",
    total_amount: 0,
    monthly_limit: 0,
    currency: "PKR"
  });

  // Add funds dialog state
  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [fundsAmount, setFundsAmount] = useState(0);
  const [isAddingFunds, setIsAddingFunds] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBudgets();
      setBudgets(data);
    } catch (err) {
      console.error("Failed to load budgets:", err);
      setError("Failed to load budgets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async () => {
    try {
      setIsAddingBudget(true);
      await createBudget(newBudget);
      setIsAddDialogOpen(false);
      setNewBudget({ company_name: "", total_amount: 0, monthly_limit: 0, currency: "PKR" });
      await loadBudgets();
    } catch (err) {
      console.error("Failed to add budget:", err);
      alert("Failed to create budget. Please try again.");
    } finally {
      setIsAddingBudget(false);
    }
  };

  const handleAddFunds = async () => {
    if (!selectedBudgetId || fundsAmount <= 0) return;

    try {
      setIsAddingFunds(true);
      await addFundsToBudget(selectedBudgetId, fundsAmount);
      setIsAddFundsDialogOpen(false);
      setFundsAmount(0);
      setSelectedBudgetId(null);
      await loadBudgets();
    } catch (err) {
      console.error("Failed to add funds:", err);
      alert("Failed to add funds. Please try again.");
    } finally {
      setIsAddingFunds(false);
    }
  };

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

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.total_amount, 0);
  const totalUsed = budgets.reduce((sum, budget) => sum + budget.used_amount, 0);
  const totalRemaining = totalBudget - totalUsed;
  const overallUtilization = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-slate-600">Loading budgets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn("bg-red-50 border-red-200", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
            <Button variant="outline" size="sm" className="ml-4" onClick={loadBudgets}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 px-3">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Budget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Budget</DialogTitle>
                    <DialogDescription>
                      Create a new budget allocation for a company
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={newBudget.company_name}
                        onChange={(e) => setNewBudget({ ...newBudget, company_name: e.target.value })}
                        placeholder="e.g. TechCorp Solutions"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="total_amount">Total Budget (PKR)</Label>
                      <Input
                        id="total_amount"
                        type="number"
                        value={newBudget.total_amount || ""}
                        onChange={(e) => setNewBudget({ ...newBudget, total_amount: Number(e.target.value) })}
                        placeholder="e.g. 500000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="monthly_limit">Monthly Limit (PKR)</Label>
                      <Input
                        id="monthly_limit"
                        type="number"
                        value={newBudget.monthly_limit || ""}
                        onChange={(e) => setNewBudget({ ...newBudget, monthly_limit: Number(e.target.value) })}
                        placeholder="e.g. 50000"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddBudget} disabled={isAddingBudget || !newBudget.company_name || !newBudget.total_amount}>
                      {isAddingBudget ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Budget
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {budgets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No budgets configured</p>
              <p className="text-sm">Click "Add Budget" to create your first budget allocation</p>
            </div>
          ) : (
            budgets.map((budget) => (
              <div
                key={budget.budget_id}
                className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {budget.company_name}
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
                      Updated {budget.last_updated ? new Date(budget.last_updated).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Budget</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(budget.total_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Used Amount</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(budget.used_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Remaining</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(budget.remaining_amount)}
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
                      {budget.utilization_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        budget.status === "critical" ? "bg-red-500" :
                          budget.status === "warning" ? "bg-yellow-500" : "bg-green-500"
                      )}
                      style={{ width: `${Math.min(budget.utilization_percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Monthly Usage */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Monthly: {formatCurrency(budget.monthly_used)} / {formatCurrency(budget.monthly_limit)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBudgetId(budget.budget_id);
                        setIsAddFundsDialogOpen(true);
                      }}
                      className="h-8 px-3"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Funds
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails?.(budget.company_id)}
                      className="h-8 px-3"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add Funds Dialog */}
      <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to Budget</DialogTitle>
            <DialogDescription>
              Enter the amount to add to this budget
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="funds_amount">Amount (PKR)</Label>
              <Input
                id="funds_amount"
                type="number"
                value={fundsAmount || ""}
                onChange={(e) => setFundsAmount(Number(e.target.value))}
                placeholder="e.g. 100000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFundsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFunds} disabled={isAddingFunds || fundsAmount <= 0}>
              {isAddingFunds ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
