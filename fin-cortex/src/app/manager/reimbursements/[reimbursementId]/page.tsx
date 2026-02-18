"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea"; // Added
import { BACKEND_URL } from "@/lib/config";
import {
    ArrowLeft,
    Receipt,
    Calendar,
    DollarSign,
    User,
    Building2,
    FileText,
    CreditCard,
    Tag,
    CheckCircle,
    XCircle,
    Clock,
    Download,
    Paperclip,
    Image as ImageIcon,
    Loader2,
    AlertCircle,
    AlertTriangle,
    Eye,
    X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchReimbursementDetail } from "@/app/api/v1/manager/fetch-reimbursements/detail";
import { ReimbursementDetail } from "@/types/reimbursement-detail";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Updated imports
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const statusColors = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    under_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function ReimbursementDetailPage({ params }: { params: Promise<{ reimbursementId: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { reimbursementId } = use(params);
    const { userProfile } = useAuth();

    const userIdParam = searchParams.get('userId');
    const userId = userIdParam === "undefined" ? null : userIdParam;

    const [detail, setDetail] = useState<ReimbursementDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Approval Logic State
    const [decisionType, setDecisionType] = useState<"approved" | "rejected" | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [comment, setComment] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [budgetError, setBudgetError] = useState<string | null>(null);

    const loadDetail = async () => {
        if (!userProfile?.user_id || !userId) {
            if (!userId && !loading) setError("Missing User ID. Unable to load details.");
            return;
        }

        try {
            setLoading(true);
            const response = await fetchReimbursementDetail(userProfile.user_id, userId, reimbursementId);
            setDetail(response.data);
        } catch (err) {
            console.error("Failed to load reimbursement detail:", err);
            setError("Failed to load reimbursement details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
    }, [userProfile?.user_id, userId, reimbursementId]);

    const handleApprove = () => {
        setDecisionType("approved");
        setIsDialogOpen(true);
    };

    const handleReject = () => {
        setDecisionType("rejected");
        setIsDialogOpen(true);
    };

    const confirmDecision = async () => {
        if (!decisionType) return;
        if (decisionType === "rejected" && !comment.trim()) return;

        setIsProcessing(true);
        setBudgetError(null);
        try {
            const baseUrl = BACKEND_URL;
            const response = await fetch(`${baseUrl}/api/v1/reimbursements/${reimbursementId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: decisionType,
                    comments: comment,
                    approver_id: userProfile?.user_id
                })
            });
            const payload = await response.json();

            if (!response.ok) {
                const detail = payload.detail;
                if (detail && typeof detail === 'object' && detail.error_code === 'budget_exceeded') {
                    setBudgetError(detail.message || 'Insufficient department budget. Please contact admin to increase allocation.');
                } else {
                    setBudgetError(typeof detail === 'string' ? detail : 'Failed to update claim status.');
                }
                return;
            }

            if (payload.success) {
                setIsDialogOpen(false);
                setComment("");
                setDecisionType(null);
                setBudgetError(null);
                loadDetail(); // Refresh data to show new status
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            setBudgetError('Network error. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number | null | undefined, currency: string = "PKR") => {
        if (amount === null || amount === undefined) return "N/A";
        return `${currency} ${amount.toLocaleString()}`;
    };

    // Helper to construct image URL
    const getImageUrl = (filePath: string) => {
        return `https://dczlyrrkjnxbmqkbgtgz.supabase.co/storage/v1/object/public/receipts-bucket/${filePath}`;
    };

    if (!userId && !loading) {
        return (
            <RouteProtection allowedRoles={['manager']}>
                <ManagerLayout>
                    <div className="p-8 text-center text-red-500">
                        Error: User ID is required to view this page. Please navigate from the main list.
                    </div>
                </ManagerLayout>
            </RouteProtection>
        )
    }

    return (
        <RouteProtection allowedRoles={['manager']}>
            <ManagerLayout>
                <div className="w-full max-w-5xl mx-auto space-y-6 pb-20"> {/* Added padding bottom for fixed footer if needed, but using inline for now */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="pl-0 hover:pl-2 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Reimbursements
                        </Button>

                        <div className="flex gap-2">
                            {detail && (
                                <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </Button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                            <p className="text-[var(--text-muted)]">Loading details...</p>
                        </div>
                    ) : error || !detail ? (
                        <Card className="border-red-500/20 bg-red-500/5">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-red-600 dark:text-red-400">
                                <AlertCircle className="w-12 h-12 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Error Loading Details</h3>
                                <p>{error || "Reimbursement not found."}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Header Card */}
                            <Card className="border-l-4 border-l-purple-500 shadow-md bg-[var(--card-dark)] border-[var(--border-subtle)]">
                                <CardHeader className="pb-4">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-2xl font-bold text-[var(--text-primary)]">
                                                    {detail.receipt_code}
                                                </CardTitle>
                                                <Badge className={statusColors[detail.status as keyof typeof statusColors]}>
                                                    {detail.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                Submitted on {formatDate(detail.created_at)}
                                            </CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-[var(--text-muted)] font-medium uppercase tracking-wider">Amount Claimed</p>
                                            <p className="text-3xl font-bold text-[var(--text-primary)]">
                                                {formatCurrency(detail.amount_claimed, detail.currency)}
                                            </p>
                                            {detail.amount_approved && (
                                                <p className="text-sm text-green-600 font-medium mt-1">
                                                    Approved: {formatCurrency(detail.amount_approved, detail.currency)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Main Content - Left Column */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Items Section */}
                                    {detail.items && detail.items.length > 0 && (
                                        <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)]">
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Tag className="w-5 h-5 text-purple-500" />
                                                    Line Items
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[var(--surface-elevated)] text-left">
                                                            <tr>
                                                                <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Item</th>
                                                                <th className="px-4 py-3 font-medium text-[var(--text-muted)] text-center">Qty</th>
                                                                <th className="px-4 py-3 font-medium text-[var(--text-muted)] text-right">Unit Price</th>
                                                                <th className="px-4 py-3 font-medium text-[var(--text-muted)] text-right">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[var(--border-subtle)]">
                                                            {detail.items.map((item) => (
                                                                <tr key={item.item_id}>
                                                                    <td className="px-4 py-3 text-[var(--text-primary)]">{item.item_name}</td>
                                                                    <td className="px-4 py-3 text-center text-[var(--text-secondary)]">{item.quantity}</td>
                                                                    <td className="px-4 py-3 text-right text-[var(--text-secondary)]">{formatCurrency(item.unit_price, detail.currency)}</td>
                                                                    <td className="px-4 py-3 text-right font-medium text-[var(--text-primary)]">{formatCurrency(item.total_price, detail.currency)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot className="bg-[var(--surface-elevated)] font-medium">
                                                            <tr>
                                                                <td colSpan={3} className="px-4 py-3 text-right text-[var(--text-secondary)]">Total</td>
                                                                <td className="px-4 py-3 text-right text-[var(--text-primary)]">{formatCurrency(detail.amount_claimed, detail.currency)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Basic Info Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)]">
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-blue-500" />
                                                    <span>Details</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Category</p>
                                                    <p className="text-sm font-medium">{detail.category_name} &rsaquo; {detail.subcategory_name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Description</p>
                                                    <p className="text-sm">{detail.description}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Expense Date</p>
                                                    <p className="text-sm">{formatDate(detail.expense_date)?.split(',')[0]}</p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)]">
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Building2 className="w-5 h-5 text-orange-500" />
                                                    <span>Vendor Info</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Vendor Name</p>
                                                    <p className="text-sm font-medium">{detail.vendor_name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Invoice #</p>
                                                    <p className="text-sm font-mono bg-[var(--surface-elevated)] border border-[var(--border-subtle)] px-2 py-1 rounded inline-block text-[var(--text-primary)]">
                                                        {detail.invoice_number}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Payment Method</p>
                                                    <p className="text-sm capitalize">{detail.payment_method}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Attachments Section */}
                                    <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)]">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Paperclip className="w-5 h-5 text-[var(--text-muted)]" />
                                                <span>Attachments ({detail.attachments?.length || 0})</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {detail.attachments && detail.attachments.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                    {detail.attachments.map((file) => (
                                                        <Dialog key={file.attachment_id}>
                                                            <DialogTrigger asChild>
                                                                <div className="group relative aspect-square bg-[var(--surface-elevated)] rounded-lg overflow-hidden border border-[var(--border-subtle)] cursor-pointer hover:border-purple-500 transition-all">
                                                                    {file.file_type.startsWith("image/") ? (
                                                                        <div className="w-full h-full relative">
                                                                            <Image
                                                                                src={getImageUrl(file.file_path)}
                                                                                alt={file.file_name}
                                                                                fill
                                                                                className="object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <Eye className="w-8 h-8 text-white" />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                                                            <FileText className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                                                                            <p className="text-xs text-center text-[var(--text-secondary)] truncate w-full">{file.file_name}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none" aria-describedby={undefined}>
                                                                <VisuallyHidden>
                                                                    <DialogTitle>Attachment Preview</DialogTitle>
                                                                </VisuallyHidden>
                                                                <div className="relative w-full h-[80vh] bg-black/90 rounded-lg flex items-center justify-center">
                                                                    {file.file_type.startsWith("image/") ? (
                                                                        <div className="relative w-full h-full">
                                                                            <Image
                                                                                src={getImageUrl(file.file_path)}
                                                                                alt={file.file_name}
                                                                                fill
                                                                                className="object-contain"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-white text-center">
                                                                            <FileText className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                                                                            <p>Preview not available for this file type.</p>
                                                                            <Button variant="secondary" className="mt-4" onClick={() => window.open(getImageUrl(file.file_path), '_blank')}>
                                                                                Download File
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[var(--text-muted)] italic">No attachments found.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Sidebar - Right Column */}
                                <div className="space-y-6">
                                    {/* User Profile Card */}
                                    <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)]">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <User className="w-5 h-5 text-purple-600" />
                                                <span>Employee</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold">
                                                    {detail.full_name?.charAt(0) || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--text-primary)]">{detail.full_name}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{detail.email}</p>
                                                </div>
                                            </div>
                                            <Separator className="my-3" />
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-muted)]">Dept</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{detail.department_name}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-muted)]">Code</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{detail.employee_code}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-muted)]">Phone</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{detail.phone_number || "N/A"}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Timeline / Additional Meta */}
                                    <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)]">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-[var(--text-muted)]" />
                                                <span>Timeline</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="relative pl-4 border-l-2 border-[var(--border-medium)] space-y-6">
                                                <div className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-[var(--card-dark)]"></div>
                                                    <p className="text-sm font-medium text-[var(--text-primary)]">Request Submitted</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{formatDate(detail.created_at)}</p>
                                                </div>
                                                {detail.reviewed_at && (
                                                    <div className="relative">
                                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-[var(--card-dark)]"></div>
                                                        <p className="text-sm font-medium text-[var(--text-primary)]">Reviewed by Manager</p>
                                                        <p className="text-xs text-[var(--text-muted)]">{formatDate(detail.reviewed_at)}</p>
                                                        <p className="text-xs text-[var(--text-muted)] mt-1">Reviewer: {detail.manager_name}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* OCR Score */}
                                    {detail.ocr_confidence !== null && (
                                        <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)]">
                                            <CardContent className="pt-6">
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-[var(--surface-elevated)] border border-[var(--border-subtle)] mb-2">
                                                        <Receipt className="w-8 h-8 text-[var(--text-secondary)]" />
                                                        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[var(--card-dark)] ${(detail.ocr_confidence || 0) > 0.8 ? 'bg-green-500' :
                                                            (detail.ocr_confidence || 0) > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}>
                                                            {Math.round((detail.ocr_confidence || 0) * 100)}%
                                                        </div>
                                                    </div>
                                                    <p className="font-medium text-[var(--text-primary)]">AI Confidence Score</p>
                                                    <p className="text-xs text-[var(--text-muted)]">Based on receipt scan analysis</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Policy Violation Flags */}
                                    {detail.policy_flags && detail.policy_flags.length > 0 && (
                                        <Card className="border-l-4 border-l-amber-500 shadow-md bg-[var(--card-dark)] border-[var(--border-subtle)]">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                                    <AlertCircle className="w-5 h-5" />
                                                    <span>Policy Violations ({detail.policy_flags.length})</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {detail.policy_flags.map((flag, idx) => {
                                                    const severityMap: Record<string, string> = {
                                                        critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
                                                        high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
                                                        medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
                                                        low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                                                    };
                                                    const colorClass = severityMap[flag.severity] || severityMap.medium;
                                                    return (
                                                        <div key={idx} className={`p-3 rounded-lg border ${colorClass}`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge className={colorClass}>
                                                                    {flag.severity?.toUpperCase()}
                                                                </Badge>
                                                                <span className="text-xs font-mono opacity-70">{flag.code}</span>
                                                            </div>
                                                            <p className="text-sm">{flag.message}</p>
                                                        </div>
                                                    );
                                                })}
                                                <p className="text-xs text-[var(--text-muted)] italic mt-2">
                                                    ⚠️ These flags are informational — review and decide accordingly.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Action Bar */}
                            {detail.status.toLowerCase() === 'pending' && (
                                <Card className="mt-6 border-t-4 border-t-purple-500 shadow-lg bg-[var(--card-dark)] border-[var(--border-subtle)]">
                                    <CardContent className="flex items-center justify-between p-6">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Review Action</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                Please review the claim details and attachments before making a decision.
                                            </p>
                                        </div>
                                        <div className="flex gap-4">
                                            <Button
                                                size="lg"
                                                onClick={handleReject}
                                                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-8 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all font-bold rounded-xl"
                                            >
                                                <XCircle className="w-5 h-5 mr-2" />
                                                Reject Claim
                                            </Button>
                                            <Button
                                                size="lg"
                                                onClick={handleApprove}
                                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all font-bold rounded-xl"
                                            >
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Approve Claim
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>

                {/* Confirm Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="bg-[var(--card-dark)] border border-[var(--border-subtle)] shadow-2xl rounded-2xl max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black uppercase tracking-wider text-[var(--text-primary)]">
                                {decisionType === "approved" ? "Approve" : "Reject"} Reimbursement
                            </DialogTitle>
                            <DialogDescription className="text-sm text-[var(--text-secondary)]">
                                {decisionType === "approved"
                                    ? "Are you sure you want to approve this reimbursement claim?"
                                    : "Are you sure you want to reject this reimbursement claim? Please provide a reason for the user."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {budgetError && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-red-400 mb-1">Budget Exceeded</p>
                                        <p className="text-xs text-red-300/80">{budgetError}</p>
                                        <p className="text-xs text-amber-400/80 mt-2 font-medium">Please contact your admin to increase budget allocation.</p>
                                    </div>
                                    <button onClick={() => setBudgetError(null)} className="text-red-400/60 hover:text-red-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-semibold text-[var(--text-primary)] mb-2 block">
                                    {decisionType === "approved" ? "Comments (Optional)" : "Reason for Rejection *"}
                                </label>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={decisionType === "approved"
                                        ? "Add any comments..."
                                        : "Please provide a reason for rejection..."}
                                    className="min-h-[100px] bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
                                    required={decisionType === "rejected"}
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setComment("");
                                    setDecisionType(null);
                                    setBudgetError(null);
                                }}
                                disabled={isProcessing}
                                className="border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--surface-elevated)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmDecision}
                                disabled={isProcessing || (decisionType === "rejected" && !comment.trim())}
                                className={decisionType === "approved"
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                                    : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20"}
                            >
                                {isProcessing ? (
                                    <div className="flex items-center space-x-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Processing...</span>
                                    </div>
                                ) : (
                                    <>
                                        {decisionType === "approved" ? (<><CheckCircle className="w-4 h-4 mr-2" />Approve</>) : (<><XCircle className="w-4 h-4 mr-2" />Reject</>)}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </ManagerLayout>
        </RouteProtection>
    );
}
