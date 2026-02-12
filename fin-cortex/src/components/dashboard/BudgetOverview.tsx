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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
    fetchBudgets,
    createBudget,
    addFundsToBudget,
    topUpCompanyBalance,
    fetchDepartments,
    type Budget,
    type CreateBudgetInput,
    type Department
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
    const { userProfile } = useAuth();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [balanceInfo, setBalanceInfo] = useState({
        account_balance: 0,
        total_allocated: 0,
        company_name: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add budget dialog state
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isAddingBudget, setIsAddingBudget] = useState(false);
    const [newBudget, setNewBudget] = useState<CreateBudgetInput>({
        total_amount: 0,
        monthly_limit: 0,
        department_id: undefined,
        currency: "PKR"
    });

    // Add funds dialog state
    const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false);
    const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
    const [fundsAmount, setFundsAmount] = useState(0);
    const [isAddingFunds, setIsAddingFunds] = useState(false);

    // Top up dialog state
    const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(0);
    const [isToppingUp, setIsToppingUp] = useState(false);

    useEffect(() => {
        if (userProfile?.user_id) {
            loadBudgets();
            loadDepartments();
        }
    }, [userProfile?.user_id]);

    const loadDepartments = async () => {
        try {
            const depts = await fetchDepartments();
            setDepartments(depts);
        } catch (err) {
            console.error("Failed to load departments:", err);
        }
    };

    const loadBudgets = async () => {
        if (!userProfile?.user_id) return;
        try {
            setLoading(true);
            setError(null);
            const response = await fetchBudgets(userProfile.user_id);
            if (response.success) {
                setBudgets(response.data || []);
                setBalanceInfo({
                    account_balance: response.account_balance || 0,
                    total_allocated: response.total_allocated || 0,
                    company_name: response.company_name || ""
                });
            }
        } catch (err) {
            console.error("Failed to load budgets:", err);
            setError("Failed to load budgets. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddBudget = async () => {
        // Validation: Must select department
        if (!newBudget.department_id) {
            alert("Please select a department for this budget.");
            return;
        }

        // Validation: Check if amount exceeds account balance
        // The account_balance fetched from the API is already the remaining liquid balance
        // We SHOULD NOT subtract total_allocated again on the frontend
        const availableToAllocate = balanceInfo.account_balance;

        if (newBudget.total_amount > availableToAllocate) {
            alert(`Insufficient balance in Company Account. Available: ${formatCurrency(availableToAllocate)}`);
            return;
        }

        try {
            setIsAddingBudget(true);
            await createBudget({
                ...newBudget,
                admin_id: userProfile?.user_id
            });
            setIsAddDialogOpen(false);
            setNewBudget({ total_amount: 0, monthly_limit: 0, department_id: undefined, currency: "PKR" });
            await loadBudgets();
        } catch (err) {
            console.error("Failed to add budget:", err);
            alert("Failed to create budget. Please try again.");
        } finally {
            setIsAddingBudget(false);
        }
    };

    const handleTopUp = async () => {
        if (!userProfile?.user_id || topUpAmount <= 0) return;

        try {
            setIsToppingUp(true);
            await topUpCompanyBalance(userProfile.user_id, topUpAmount);
            setIsTopUpDialogOpen(false);
            setTopUpAmount(0);
            await loadBudgets();
        } catch (err) {
            console.error("Failed to top up:", err);
            alert("Failed to top up balance. Please try again.");
        } finally {
            setIsToppingUp(false);
        }
    };

    const handleAddFunds = async () => {
        if (!selectedBudgetId || fundsAmount <= 0) return;

        // Validation: Check if amount exceeds account balance
        if (fundsAmount > balanceInfo.account_balance) {
            alert(`Insufficient balance in Company Account. Available: ${formatCurrency(balanceInfo.account_balance)}`);
            return;
        }

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
            case "healthy": return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
            case "warning": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "critical": return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
            default: return "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400";
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
            <Card className={cn("bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800", className)}>
                <CardContent className="pt-6">
                    <div className="flex items-center text-red-700 dark:text-red-400">
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
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-none shadow-lg text-white">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium opacity-80">Company Account Balance</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(balanceInfo.account_balance)}
                            </p>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 px-2 text-[10px] mt-2 bg-white/20 hover:bg-white/30 border-none text-white"
                                onClick={() => setIsTopUpDialogOpen(true)}
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Top Up Account
                            </Button>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Allocated</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(balanceInfo.total_allocated)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Available: {formatCurrency(balanceInfo.account_balance - balanceInfo.total_allocated)}
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
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Used from Budgets</p>
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
                                <DialogContent className="sm:max-w-[500px] bg-card border-subtle shadow-2xl p-0 overflow-hidden gap-0">
                                    <DialogHeader className="p-6 pb-2">
                                        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                                            <Plus className="w-6 h-6 text-white" />
                                        </div>
                                        <DialogTitle className="text-2xl font-bold text-center text-primary">
                                            Add New Budget
                                        </DialogTitle>
                                        <DialogDescription className="text-center text-muted">
                                            Create a new budget allocation for a company.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-5 py-4 px-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="department" className="text-sm font-medium text-secondary">Department</Label>
                                            <Select
                                                value={newBudget.department_id?.toString()}
                                                onValueChange={(value) => setNewBudget({ ...newBudget, department_id: parseInt(value) })}
                                            >
                                                <SelectTrigger id="department" className="h-11 bg-card border-subtle text-primary rounded-xl">
                                                    <SelectValue placeholder="Select a department" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                    {departments.map((dept) => (
                                                        <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                                                            {dept.department_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="total_amount" className="text-sm font-medium text-secondary">Total Budget</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 text-xs font-bold text-muted">PKR</span>
                                                    <Input
                                                        id="total_amount"
                                                        type="number"
                                                        value={newBudget.total_amount || ""}
                                                        onChange={(e) => setNewBudget({ ...newBudget, total_amount: Number(e.target.value) })}
                                                        placeholder="500,000"
                                                        className="pl-10 h-11 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="monthly_limit" className="text-sm font-medium text-secondary">Monthly Limit</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 text-xs font-bold text-muted">PKR</span>
                                                    <Input
                                                        id="monthly_limit"
                                                        type="number"
                                                        value={newBudget.monthly_limit || ""}
                                                        onChange={(e) => setNewBudget({ ...newBudget, monthly_limit: Number(e.target.value) })}
                                                        placeholder="50,000"
                                                        className="pl-10 h-11 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter className="p-6 pt-2 gap-3 sm:gap-0 bg-slate-50/50 dark:bg-slate-900/50">
                                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl h-11 border-subtle hover:bg-slate-100 dark:hover:bg-slate-800">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddBudget}
                                            disabled={isAddingBudget || !newBudget.total_amount}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl h-11 shadow-md hover:shadow-lg transition-all"
                                        >
                                            {isAddingBudget ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
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
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                            <BarChart3 className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                                {budget.department_name || budget.category_name || "General Budget"}
                                            </h3>
                                            <p className="text-xs text-slate-500">{budget.company_name}</p>
                                        </div>
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
                <DialogContent className="sm:max-w-[400px] bg-card border-subtle shadow-xl p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 pb-2">
                        <div className="mx-auto w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md mb-3">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-center text-primary">Add Funds</DialogTitle>
                        <DialogDescription className="text-center text-muted">
                            Enter the amount to add to this budget
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 px-6">
                        <div className="grid gap-2">
                            <Label htmlFor="funds_amount" className="text-sm font-medium text-secondary">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-xs font-bold text-muted">PKR</span>
                                <Input
                                    id="funds_amount"
                                    type="number"
                                    value={fundsAmount || ""}
                                    onChange={(e) => setFundsAmount(Number(e.target.value))}
                                    placeholder="e.g. 100,000"
                                    className="pl-10 h-11 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-2 gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                        <Button variant="outline" onClick={() => setIsAddFundsDialogOpen(false)} className="rounded-xl h-10 border-subtle hover:bg-slate-100 dark:hover:bg-slate-800">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddFunds}
                            disabled={isAddingFunds || fundsAmount <= 0}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 rounded-xl h-10 shadow-md hover:shadow-lg transition-all"
                        >
                            {isAddingFunds ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Add Funds
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Top Up Account Dialog */}
            <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-card border-subtle shadow-xl p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 pb-2">
                        <div className="mx-auto w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md mb-3">
                            <Plus className="w-5 h-5 text-white" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-center text-primary">Top Up Company Account</DialogTitle>
                        <DialogDescription className="text-center text-muted">
                            Add funds to your main company account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 px-6">
                        <div className="grid gap-2">
                            <Label htmlFor="topup_amount" className="text-sm font-medium text-secondary">Amount to Add</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-xs font-bold text-muted">PKR</span>
                                <Input
                                    id="topup_amount"
                                    type="number"
                                    value={topUpAmount || ""}
                                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                                    placeholder="e.g. 1,000,000"
                                    className="pl-10 h-11 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-2 gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                        <Button variant="outline" onClick={() => setIsTopUpDialogOpen(false)} className="rounded-xl h-10 border-subtle hover:bg-slate-100 dark:hover:bg-slate-800">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTopUp}
                            disabled={isToppingUp || topUpAmount <= 0}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 rounded-xl h-10 shadow-md hover:shadow-lg transition-all"
                        >
                            {isToppingUp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Add Funds
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
