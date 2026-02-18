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
    const totalRemaining = Math.max(0, totalBudget - totalUsed);
    const overallUtilization = totalBudget > 0 ? Math.min(100, (totalUsed / totalBudget) * 100) : 0;

    if (loading) {
        return (
            <div className={cn("flex items-center justify-center py-12", className)}>
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-[var(--text-muted)]">Loading budgets...</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-10 transition-opacity" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-white/20 hover:bg-white/30 border-none text-white backdrop-blur-md transition-all"
                                onClick={() => setIsTopUpDialogOpen(true)}
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Top Up
                            </Button>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white/80 uppercase tracking-widest mb-1">Account Balance</p>
                            <p className="text-3xl font-black text-white tracking-tight">
                                {formatCurrency(balanceInfo.account_balance)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--card-dark)] backdrop-blur-3xl border-[var(--border-subtle)] shadow-2xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                <DollarSign className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="h-8 flex items-center">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Allocated</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Allocated</p>
                            <p className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                                {formatCurrency(balanceInfo.total_allocated)}
                            </p>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-2 uppercase tracking-wider">
                                Available: <span className="text-emerald-400">{formatCurrency(balanceInfo.account_balance - balanceInfo.total_allocated)}</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--card-dark)] backdrop-blur-3xl border-[var(--border-subtle)] shadow-2xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                                <TrendingUp className="w-6 h-6 text-orange-400" />
                            </div>
                            <div className="h-8 flex items-center">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Usage</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Used</p>
                            <p className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                                {formatCurrency(totalUsed)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--card-dark)] backdrop-blur-3xl border-[var(--border-subtle)] shadow-2xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                                <BarChart3 className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="h-8 flex items-center">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Utilization</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-widest mb-1">Overall Utilization</p>
                            <p className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                                {overallUtilization.toFixed(1)}%
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Company Budgets */}
            <Card className="bg-[var(--card-dark)] backdrop-blur-3xl border-[var(--border-subtle)] shadow-2xl overflow-hidden">
                <CardHeader className="pb-4 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-black text-[var(--text-primary)] flex items-center tracking-tight">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-3">
                                <Building2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            COMPANY BUDGETS
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        className="bg-[var(--card-dark)] hover:bg-[var(--card-hover)] text-[var(--text-primary)] border-0 backdrop-blur-md"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        ADD BUDGET
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] bg-[#0A0A0B]/95 backdrop-blur-3xl border-white/10 text-white shadow-2xl p-0 overflow-hidden gap-0">
                                    <DialogHeader className="p-8 pb-4 border-b border-white/5">
                                        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                                            <Plus className="w-7 h-7 text-white" />
                                        </div>
                                        <DialogTitle className="text-2xl font-black text-center text-white tracking-tight">
                                            ADD NEW BUDGET
                                        </DialogTitle>
                                        <DialogDescription className="text-center text-slate-400">
                                            Create a new budget allocation for a department.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 p-8">
                                        <div className="grid gap-2">
                                            <Label htmlFor="department" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</Label>
                                            <Select
                                                value={newBudget.department_id?.toString()}
                                                onValueChange={(value) => setNewBudget({ ...newBudget, department_id: parseInt(value) })}
                                            >
                                                <SelectTrigger id="department" className="h-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/20 focus:border-blue-500/40">
                                                    <SelectValue placeholder="Select a department" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#0A0A0B] border-white/10 text-white">
                                                    {departments.map((dept) => (
                                                        <SelectItem key={dept.department_id} value={dept.department_id.toString()} className="focus:bg-white/10 focus:text-white">
                                                            {dept.department_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="total_amount" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Budget</Label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-500">PKR</span>
                                                    <Input
                                                        id="total_amount"
                                                        type="number"
                                                        value={newBudget.total_amount || ""}
                                                        onChange={(e) => setNewBudget({ ...newBudget, total_amount: Number(e.target.value) })}
                                                        placeholder="500,000"
                                                        className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="monthly_limit" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Limit</Label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-500">PKR</span>
                                                    <Input
                                                        id="monthly_limit"
                                                        type="number"
                                                        value={newBudget.monthly_limit || ""}
                                                        onChange={(e) => setNewBudget({ ...newBudget, monthly_limit: Number(e.target.value) })}
                                                        placeholder="50,000"
                                                        className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter className="p-8 pt-0 gap-3">
                                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1 rounded-xl h-12 border-white/10 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white uppercase tracking-wider text-xs font-bold">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddBudget}
                                            disabled={isAddingBudget || !newBudget.total_amount}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 rounded-xl h-12 shadow-lg shadow-blue-500/20 uppercase tracking-wider text-xs font-bold"
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

                <CardContent className="p-0">
                    <div className="divide-y divide-[var(--border-subtle)]">
                        {budgets.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-[var(--card-dark)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-medium)]">
                                    <DollarSign className="w-8 h-8 text-[var(--text-muted)]" />
                                </div>
                                <p className="text-[var(--text-secondary)] font-medium">No budgets configured</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider">
                                    Click "Add Budget" to get started
                                </p>
                            </div>
                        ) : (
                            budgets.map((budget) => (
                                <div
                                    key={budget.budget_id}
                                    className="p-6 hover:bg-[var(--card-hover)] transition-colors group"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 border border-[var(--border-medium)] rounded-2xl flex items-center justify-center shadow-inner">
                                                <BarChart3 className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[var(--text-primary)] text-lg tracking-tight mb-1">
                                                    {budget.department_name || budget.category_name || "General Budget"}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{budget.company_name}</p>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border-0",
                                                            budget.status === 'healthy' ? "bg-emerald-500/10 text-emerald-400" :
                                                                budget.status === 'warning' ? "bg-yellow-500/10 text-yellow-400" :
                                                                    "bg-red-500/10 text-red-400"
                                                        )}
                                                    >
                                                        {budget.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col lg:items-end gap-1">
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                                Last Updated
                                            </p>
                                            <p className="text-xs text-[var(--text-secondary)] font-mono">
                                                {budget.last_updated ? new Date(budget.last_updated).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-[var(--card-dark)] rounded-xl border border-[var(--border-subtle)]">
                                        <div>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Budget</p>
                                            <p className="font-bold text-[var(--text-primary)] text-lg">
                                                {formatCurrency(budget.total_amount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Used Amount</p>
                                            <p className="font-bold text-[var(--text-primary)] text-lg">
                                                {formatCurrency(budget.used_amount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Remaining</p>
                                            <p className={cn("font-bold text-lg",
                                                budget.remaining_amount < budget.total_amount * 0.2 ? "text-red-400" : "text-emerald-400"
                                            )}>
                                                {formatCurrency(Math.max(0, budget.remaining_amount))}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                                Utilization
                                            </span>
                                            <span className="text-xs font-bold text-[var(--text-primary)]">
                                                {budget.utilization_percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-[var(--card-dark)] rounded-full h-2 overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]",
                                                    budget.status === "critical" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" :
                                                        budget.status === "warning" ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                )}
                                                style={{ width: `${Math.min(budget.utilization_percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Monthly Usage & Actions */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="text-xs font-medium text-[var(--text-secondary)] flex items-center bg-[var(--card-dark)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] w-fit">
                                            <Calendar className="w-3.5 h-3.5 mr-2 text-purple-400" />
                                            Monthly: <span className="text-[var(--text-primary)] ml-1">{formatCurrency(budget.monthly_used)}</span> <span className="mx-1 text-[var(--text-muted)]">/</span> {formatCurrency(budget.monthly_limit)}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                size="sm"
                                                className="h-9 bg-[var(--card-dark)] hover:bg-[var(--card-hover)] text-[var(--text-primary)] border-0 text-xs font-bold uppercase tracking-wider"
                                                onClick={() => {
                                                    setSelectedBudgetId(budget.budget_id);
                                                    setIsAddFundsDialogOpen(true);
                                                }}
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Add Funds
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-9 bg-[var(--card-dark)] hover:bg-[var(--card-hover)] text-[var(--text-primary)] border-0 text-xs font-bold uppercase tracking-wider"
                                                onClick={() => onViewDetails?.(budget.company_id)}
                                            >
                                                Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add Funds Dialog */}
            <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-[var(--card-dark)] backdrop-blur-3xl border border-[var(--border-subtle)] shadow-2xl p-0 overflow-hidden gap-0 rounded-2xl">
                    <DialogHeader className="p-8 pb-4 border-b border-[var(--border-subtle)]">
                        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                            <DollarSign className="w-7 h-7 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-center text-[var(--text-primary)] tracking-tight">ADD FUNDS</DialogTitle>
                        <DialogDescription className="text-center text-[var(--text-secondary)]">
                            Enter the amount to add to this budget
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 p-8">
                        <div className="grid gap-2">
                            <Label htmlFor="funds_amount" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-sm font-black text-[var(--text-primary)] tracking-wider">PKR</span>
                                <Input
                                    id="funds_amount"
                                    type="number"
                                    value={fundsAmount || ""}
                                    onChange={(e) => setFundsAmount(Number(e.target.value))}
                                    placeholder="e.g. 100,000"
                                    className="pl-14 h-12 bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/40 focus:ring-purple-500/20 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-8 pt-0 gap-3">
                        <Button variant="outline" onClick={() => setIsAddFundsDialogOpen(false)} className="flex-1 rounded-xl h-12 border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] uppercase tracking-wider text-xs font-bold">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddFunds}
                            disabled={isAddingFunds || fundsAmount <= 0}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 rounded-xl h-12 shadow-lg shadow-blue-500/20 uppercase tracking-wider text-xs font-bold"
                        >
                            {isAddingFunds ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Top Up Account Dialog */}
            <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-[var(--card-dark)] backdrop-blur-3xl border border-[var(--border-subtle)] shadow-2xl p-0 overflow-hidden gap-0 rounded-2xl">
                    <DialogHeader className="p-8 pb-4 border-b border-[var(--border-subtle)]">
                        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
                            <Plus className="w-7 h-7 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-center text-[var(--text-primary)] tracking-tight">TOP UP ACCOUNT</DialogTitle>
                        <DialogDescription className="text-center text-[var(--text-secondary)]">
                            Add funds to your main company account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 p-8">
                        <div className="grid gap-2">
                            <Label htmlFor="topup_amount" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Amount to Add</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-sm font-black text-[var(--text-primary)] tracking-wider">PKR</span>
                                <Input
                                    id="topup_amount"
                                    type="number"
                                    value={topUpAmount || ""}
                                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                                    placeholder="e.g. 1,000,000"
                                    className="pl-14 h-12 bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/40 focus:ring-purple-500/20 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-8 pt-0 gap-3">
                        <Button variant="outline" onClick={() => setIsTopUpDialogOpen(false)} className="flex-1 rounded-xl h-12 border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] uppercase tracking-wider text-xs font-bold">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTopUp}
                            disabled={isToppingUp || topUpAmount <= 0}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 rounded-xl h-12 shadow-lg shadow-purple-500/20 uppercase tracking-wider text-xs font-bold"
                        >
                            {isToppingUp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirm Top Up
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
