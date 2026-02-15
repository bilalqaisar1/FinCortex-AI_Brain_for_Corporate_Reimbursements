"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    FileText,
    Plus,
    Edit2,
    Trash2,
    AlertTriangle,
    CheckCircle,
    Loader2,
    Shield,
    Ban,
    Clock,
    DollarSign,
    ShieldCheck
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
    PageHeader,
    PolicyViolations
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import {
    fetchPolicyRules,
    fetchRuleTypes,
    createPolicyRule,
    updatePolicyRule,
    deletePolicyRule,
    fetchViolations,
    type PolicyRule,
    type RuleType,
    type CreateRuleInput,
    type PolicyViolation
} from "@/app/api/v1/admin/policy-rules-api";

const ruleTypeIcons: Record<string, typeof FileText> = {
    max_claims_per_day: Clock,
    max_amount: DollarSign,
    monthly_limit: DollarSign,
    restricted_keywords: Ban
};

const severityColors: Record<string, string> = {
    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    critical: "bg-red-500/10 text-red-400 border-red-500/20"
};

export default function PolicyRulesPage() {
    const router = useRouter();

    const [rules, setRules] = useState<PolicyRule[]>([]);
    const [ruleTypes, setRuleTypes] = useState<RuleType[]>([]);
    const [violations, setViolations] = useState<PolicyViolation[]>([]);
    const [loading, setLoading] = useState(true);
    const [violationsLoading, setViolationsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [violationsError, setViolationsError] = useState<string | null>(null);

    // Dialog state
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<PolicyRule | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState<CreateRuleInput>({
        rule_name: "",
        rule_type: "max_claims_per_day",
        rule_value: "",
        description: "",
        is_active: true,
        severity: "high"
    });

    const { userProfile } = useAuth();

    useEffect(() => {
        if (userProfile?.user_id) {
            loadData();
        }
    }, [userProfile?.user_id]);

    const loadData = async () => {
        if (!userProfile?.user_id) return;
        try {
            setLoading(true);
            setError(null);
            const [rulesData, typesData] = await Promise.all([
                fetchPolicyRules(userProfile.user_id),
                fetchRuleTypes()
            ]);
            setRules(rulesData);
            setRuleTypes(typesData);

            // Also load violations in background
            loadViolations();
        } catch (err) {
            console.error("Failed to load policy rules:", err);
            setError("Failed to load policy rules. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const loadViolations = async () => {
        if (!userProfile?.user_id) return;
        try {
            setViolationsLoading(true);
            setViolationsError(null);
            const data = await fetchViolations(userProfile.user_id);
            setViolations(data);
        } catch (err) {
            console.error("Failed to load violations", err);
            setViolationsError("Failed to load violations. Please try again.");
        } finally {
            setViolationsLoading(false);
        }
    };

    const handleAddRule = async () => {
        try {
            setIsSaving(true);
            await createPolicyRule(formData, userProfile?.user_id);
            setIsAddDialogOpen(false);
            resetForm();
            await loadData();
        } catch (err) {
            console.error("Failed to add rule:", err);
            alert("Failed to create rule. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditRule = async () => {
        if (!selectedRule) return;
        try {
            setIsSaving(true);
            await updatePolicyRule(selectedRule.rule_id, formData, userProfile?.user_id);
            setIsEditDialogOpen(false);
            setSelectedRule(null);
            resetForm();
            await loadData();
        } catch (err) {
            console.error("Failed to update rule:", err);
            alert("Failed to update rule. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRule = async () => {
        if (!selectedRule) return;
        try {
            setIsSaving(true);
            await deletePolicyRule(selectedRule.rule_id, userProfile?.user_id);
            setIsDeleteDialogOpen(false);
            setSelectedRule(null);
            await loadData();
        } catch (err) {
            console.error("Failed to delete rule:", err);
            alert("Failed to delete rule. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResolveViolation = (violationId: string) => {
        console.log("Resolve violation:", violationId);
        if (confirm("Are you sure you want to resolve this violation?")) {
            // Implement resolve logic matching ViolationsPage
        }
    };

    const handleDismissViolation = (violationId: string) => {
        console.log("Dismiss violation:", violationId);
        if (confirm("Are you sure you want to dismiss this violation?")) {
            // Implement dismiss logic matching ViolationsPage
        }
    };

    const openEditDialog = (rule: PolicyRule) => {
        setSelectedRule(rule);
        setFormData({
            rule_name: rule.rule_name,
            rule_type: rule.rule_type,
            rule_value: rule.rule_value,
            description: rule.description || "",
            is_active: rule.is_active,
            severity: rule.severity
        });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (rule: PolicyRule) => {
        setSelectedRule(rule);
        setIsDeleteDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            rule_name: "",
            rule_type: "max_claims_per_day",
            rule_value: "",
            description: "",
            is_active: true,
            severity: "high"
        });
    };

    const getRuleTypeInfo = (type: string) => {
        return ruleTypes.find(t => t.type === type);
    };

    const RuleForm = ({ isEdit = false }: { isEdit?: boolean }) => (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="rule_name">Rule Name</Label>
                <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g. Max 3 Claims Per Day"
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="rule_type">Rule Type</Label>
                <Select
                    value={formData.rule_type}
                    onValueChange={(value) => setFormData({ ...formData, rule_type: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                        {ruleTypes.map((type) => (
                            <SelectItem key={type.type} value={type.type}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {formData.rule_type && (
                    <p className="text-xs text-[var(--text-muted)]">
                        {getRuleTypeInfo(formData.rule_type)?.description}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="rule_value">
                    Rule Value
                    <span className="text-xs text-[var(--text-muted)] ml-2">
                        (e.g. {getRuleTypeInfo(formData.rule_type)?.example})
                    </span>
                </Label>
                <Input
                    id="rule_value"
                    value={formData.rule_value}
                    onChange={(e) => setFormData({ ...formData, rule_value: e.target.value })}
                    placeholder={getRuleTypeInfo(formData.rule_type)?.example || "Enter value"}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this rule does..."
                    rows={2}
                />
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Rule is Active</Label>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-full overflow-hidden">
            <PageHeader
                title="Policy Rules"
                description="Define and manage reimbursement policies that are automatically applied to claims"
                icon={Shield}
                iconColor="text-orange-400"
                iconBgColor="bg-orange-500/20"
                actions={
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="bg-[var(--card-dark)] border-[var(--border-medium)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)]"
                        >
                            ← Back
                        </Button>
                        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                            setIsAddDialogOpen(open);
                            if (!open) resetForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-[linear-gradient(135deg,#6366f1_0%,#a855f7_50%,#ec4899_100%)] hover:shadow-purple-500/20 hover:scale-105 active:scale-95 text-white shadow-lg">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Rule
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Create New Policy Rule</DialogTitle>
                                    <DialogDescription>
                                        Define a new rule that will be automatically applied to claims
                                    </DialogDescription>
                                </DialogHeader>
                                <RuleForm />
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddRule}
                                        disabled={isSaving || !formData.rule_name || !formData.rule_value}
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Create Rule
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                }
            />

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Loading policy rules...</span>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <Card className="bg-red-500/5 border-red-500/20 backdrop-blur-xl mb-6">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-red-500">
                                <AlertTriangle className="w-6 h-6" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] font-black uppercase tracking-widest border-red-500/20 text-red-500"
                                onClick={loadData}
                            >
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="rules" className="w-full">
                <TabsList className="bg-[var(--card-dark)] border border-[var(--border-subtle)] p-1 mb-8">
                    <TabsTrigger
                        value="rules"
                        className="data-[state=active]:bg-[linear-gradient(135deg,#6366f1_0%,#a855f7_50%,#ec4899_100%)] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20 text-[10px] font-black uppercase tracking-widest px-6"
                    >
                        <Shield className="w-3.5 h-3.5 mr-2" />
                        Policy Rules
                    </TabsTrigger>
                    <TabsTrigger
                        value="violations"
                        className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest px-6"
                    >
                        <AlertTriangle className="w-3.5 h-3.5 mr-2" />
                        Violations Monitor
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="mt-0 outline-none animate-in fade-in duration-500">
                    {/* Rules List (Existing logic) */}
                    {!loading && (
                        <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] backdrop-blur-xl shadow-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center">
                                        <FileText className="w-5 h-5 mr-2 text-orange-400" />
                                        <span className="text-[var(--text-primary)]">Active Rules ({rules.filter(r => r.is_active).length})</span>
                                    </span>
                                    <Badge variant="outline" className="text-[var(--text-secondary)] border-[var(--border-medium)] bg-[var(--card-dark)] text-[10px] font-black uppercase tracking-widest">
                                        {rules.length} total
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {rules.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Shield className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                                        <p className="text-lg font-medium text-[var(--text-secondary)]">No policy rules defined</p>
                                        <p className="text-sm text-[var(--text-muted)]">Click &quot;Add Rule&quot; to create your first policy rule</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {rules.map((rule) => {
                                            const IconComponent = ruleTypeIcons[rule.rule_type] || FileText;
                                            return (
                                                <div
                                                    key={rule.rule_id}
                                                    className={`p-4 rounded-lg border transition-colors ${rule.is_active
                                                        ? "bg-[var(--card-dark)] border-[var(--border-subtle)] hover:bg-[var(--card-hover)]"
                                                        : "bg-[var(--card-dark)] border-[var(--border-subtle)] opacity-60"
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start space-x-3">
                                                            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                                                <IconComponent className="w-5 h-5 text-orange-400" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center space-x-2 mb-1">
                                                                    <h3 className="font-semibold text-[var(--text-primary)]">
                                                                        {rule.rule_name}
                                                                    </h3>
                                                                    <Badge className={severityColors[rule.severity] || "bg-slate-500/10 text-slate-400"}>
                                                                        {rule.severity}
                                                                    </Badge>
                                                                    {!rule.is_active && (
                                                                        <Badge variant="outline" className="text-[var(--text-muted)] border-[var(--border-medium)]">
                                                                            Inactive
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-[var(--text-secondary)]">
                                                                    <span className="font-medium text-[var(--text-primary)]">Type:</span> {getRuleTypeInfo(rule.rule_type)?.label || rule.rule_type}
                                                                </p>
                                                                <p className="text-sm text-[var(--text-secondary)]">
                                                                    <span className="font-medium text-[var(--text-primary)]">Value:</span> {rule.rule_value}
                                                                </p>
                                                                {rule.description && (
                                                                    <p className="text-xs text-[var(--text-muted)] mt-1">{rule.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => openEditDialog(rule)}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => openDeleteDialog(rule)}
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="violations" className="mt-0 outline-none animate-in fade-in duration-500">
                    {violationsLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl">
                            <Loader2 className="w-12 h-12 animate-spin text-red-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Scanning for violations...</span>
                        </div>
                    ) : violationsError ? (
                        <div className="text-center py-12 text-red-500 bg-red-500/5 border border-red-500/20 rounded-xl">
                            <span className="text-xs font-black uppercase tracking-widest">{violationsError}</span>
                            <Button
                                onClick={loadViolations}
                                variant="outline"
                                className="ml-4 text-[10px] font-black uppercase tracking-widest border-red-500/20 text-red-500"
                            >
                                Retry
                            </Button>
                        </div>
                    ) : violations.length === 0 ? (
                        <div className="text-center py-20 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-3xl">
                            <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-green-400" />
                            <p className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">System Integrity Verified</p>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-2 max-w-md mx-auto">
                                No policy violations detected in the current claim stream.
                            </p>
                        </div>
                    ) : (
                        <PolicyViolations
                            violations={violations as any}
                            onView={(id) => console.log("View:", id)}
                            onResolve={handleResolveViolation}
                            onDismiss={handleDismissViolation}
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) {
                    setSelectedRule(null);
                    resetForm();
                }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Policy Rule</DialogTitle>
                        <DialogDescription>
                            Update the rule configuration
                        </DialogDescription>
                    </DialogHeader>
                    <RuleForm isEdit />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditRule}
                            disabled={isSaving || !formData.rule_name || !formData.rule_value}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Policy Rule</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{selectedRule?.rule_name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteRule}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Delete Rule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
