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
    DollarSign
} from "lucide-react";
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
    DashboardLayout
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { RouteProtection } from "@/components/auth/RouteProtection";
import {
    fetchPolicyRules,
    fetchRuleTypes,
    createPolicyRule,
    updatePolicyRule,
    deletePolicyRule,
    type PolicyRule,
    type RuleType,
    type CreateRuleInput
} from "@/app/api/v1/admin/policy-rules-api";

const ruleTypeIcons: Record<string, typeof FileText> = {
    max_claims_per_day: Clock,
    max_amount: DollarSign,
    monthly_limit: DollarSign,
    restricted_keywords: Ban
};

const severityColors: Record<string, string> = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700"
};

export default function PolicyRulesPage() {
    const router = useRouter();

    const [rules, setRules] = useState<PolicyRule[]>([]);
    const [ruleTypes, setRuleTypes] = useState<RuleType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        } catch (err) {
            console.error("Failed to load policy rules:", err);
            setError("Failed to load policy rules. Please try again.");
        } finally {
            setLoading(false);
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
                    <p className="text-xs text-slate-500">
                        {getRuleTypeInfo(formData.rule_type)?.description}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="rule_value">
                    Rule Value
                    <span className="text-xs text-slate-500 ml-2">
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
                iconColor="text-orange-600"
                iconBgColor="bg-orange-100"
                actions={
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="hover:bg-slate-50"
                        >
                            ← Back
                        </Button>
                        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                            setIsAddDialogOpen(open);
                            if (!open) resetForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white">
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
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                    <span className="ml-2 text-slate-600">Loading policy rules...</span>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <Card className="bg-red-50 border-red-200 mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center text-red-700">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            <span>{error}</span>
                            <Button variant="outline" size="sm" className="ml-4" onClick={loadData}>
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Rules List */}
            {!loading && (
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-orange-600" />
                                Active Rules ({rules.filter(r => r.is_active).length})
                            </span>
                            <Badge variant="outline" className="text-slate-600">
                                {rules.length} total
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rules.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <p className="text-lg font-medium">No policy rules defined</p>
                                <p className="text-sm">Click "Add Rule" to create your first policy rule</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {rules.map((rule) => {
                                    const IconComponent = ruleTypeIcons[rule.rule_type] || FileText;
                                    return (
                                        <div
                                            key={rule.rule_id}
                                            className={`p-4 rounded-lg border transition-colors ${rule.is_active
                                                ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                                : "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600 opacity-60"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                                        <IconComponent className="w-5 h-5 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                                                {rule.rule_name}
                                                            </h3>
                                                            <Badge className={severityColors[rule.severity] || "bg-slate-100"}>
                                                                {rule.severity}
                                                            </Badge>
                                                            {!rule.is_active && (
                                                                <Badge variant="outline" className="text-slate-500">
                                                                    Inactive
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            <span className="font-medium">Type:</span> {getRuleTypeInfo(rule.rule_type)?.label || rule.rule_type}
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            <span className="font-medium">Value:</span> {rule.rule_value}
                                                        </p>
                                                        {rule.description && (
                                                            <p className="text-xs text-slate-500 mt-1">{rule.description}</p>
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
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
