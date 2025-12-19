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
    Eye
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchReimbursementDetail } from "@/app/api/v1/manager/fetch-reimbursements/detail";
import { ReimbursementDetail } from "@/types/reimbursement-detail";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
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

    // We need the user_id to fetch details. In a real app, this should probably come from the
    // previous page or be handled by the backend knowing the relationship.
    // For now, we'll try to get it from query params or fail gracefully if the API requires it
    // But wait! The updated backend function takes p_user_id. The previous list page had this data.
    // Let's assume for this implementation we pass userId via query param for simplicity,
    // OR we can't reliably get it if the user navigates directly.
    // CRITICAL FIX: The backend function REQUIRES user_id. We must get it. 
    // Ideally, the backend endpoint shouldn't require user_id if manager_id and reimbursement_id are provided (as reimbursement_id is unique).
    // However, proceeding with the provided RPC signature. We'll use a query param `userId`.
    const userIdParam = searchParams.get('userId');
    const userId = userIdParam === "undefined" ? null : userIdParam;

    const [detail, setDetail] = useState<ReimbursementDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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

        loadDetail();
    }, [userProfile?.user_id, userId, reimbursementId]);

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
                <div className="w-full max-w-5xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="pl-0 hover:pl-2 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Reimbursements
                        </Button>

                        {detail && (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </Button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                            <p className="text-slate-500">Loading details...</p>
                        </div>
                    ) : error || !detail ? (
                        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-red-600 dark:text-red-400">
                                <AlertCircle className="w-12 h-12 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Error Loading Details</h3>
                                <p>{error || "Reimbursement not found."}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Header Card */}
                            <Card className="border-l-4 border-l-purple-500 shadow-md">
                                <CardHeader className="pb-4">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
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
                                            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Amount Claimed</p>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
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
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Tag className="w-5 h-5 text-purple-500" />
                                                    Line Items
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="border rounded-lg overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-slate-50 dark:bg-slate-800 text-left">
                                                            <tr>
                                                                <th className="px-4 py-3 font-medium text-slate-500">Item</th>
                                                                <th className="px-4 py-3 font-medium text-slate-500 text-center">Qty</th>
                                                                <th className="px-4 py-3 font-medium text-slate-500 text-right">Unit Price</th>
                                                                <th className="px-4 py-3 font-medium text-slate-500 text-right">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {detail.items.map((item) => (
                                                                <tr key={item.item_id}>
                                                                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{item.item_name}</td>
                                                                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                                                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.unit_price, detail.currency)}</td>
                                                                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">{formatCurrency(item.total_price, detail.currency)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot className="bg-slate-50 dark:bg-slate-800 font-medium">
                                                            <tr>
                                                                <td colSpan={3} className="px-4 py-3 text-right">Total</td>
                                                                <td className="px-4 py-3 text-right">{formatCurrency(detail.amount_claimed, detail.currency)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Basic Info Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-blue-500" />
                                                    <span>Details</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-slate-500 uppercase">Category</p>
                                                    <p className="text-sm font-medium">{detail.category_name} &rsaquo; {detail.subcategory_name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-slate-500 uppercase">Description</p>
                                                    <p className="text-sm">{detail.description}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-slate-500 uppercase">Expense Date</p>
                                                    <p className="text-sm">{formatDate(detail.expense_date)?.split(',')[0]}</p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Building2 className="w-5 h-5 text-orange-500" />
                                                    <span>Vendor Info</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-slate-500 uppercase">Vendor Name</p>
                                                    <p className="text-sm font-medium">{detail.vendor_name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-slate-500 uppercase">Invoice #</p>
                                                    <p className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">
                                                        {detail.invoice_number}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-slate-500 uppercase">Payment Method</p>
                                                    <p className="text-sm capitalize">{detail.payment_method}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Attachments Section */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Paperclip className="w-5 h-5 text-slate-500" />
                                                <span>Attachments ({detail.attachments?.length || 0})</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {detail.attachments && detail.attachments.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                    {detail.attachments.map((file) => (
                                                        <Dialog key={file.attachment_id}>
                                                            <DialogTrigger asChild>
                                                                <div className="group relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border cursor-pointer hover:border-purple-500 transition-all">
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
                                                                            <FileText className="w-8 h-8 text-slate-400 mb-2" />
                                                                            <p className="text-xs text-center text-slate-500 truncate w-full">{file.file_name}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none" aria-describedby={undefined}>
                                                                <VisuallyHidden>
                                                                    <DialogTitle>Attachment Preview</DialogTitle>
                                                                </VisuallyHidden>
                                                                <div className="relative w-full h-[80vh] bg-black/90 rounded-lg flex items-center justify-center">
                                                                    {file.file_type.startsWith("image/") && (
                                                                        <div className="relative w-full h-full">
                                                                            <Image
                                                                                src={getImageUrl(file.file_path)}
                                                                                alt={file.file_name}
                                                                                fill
                                                                                className="object-contain"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    {/* Fallback for non-images (like PDF) if we had a viewer, currently just same placeholder logic or download link */}
                                                                    {!file.file_type.startsWith("image/") && (
                                                                        <div className="text-white text-center">
                                                                            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
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
                                                <p className="text-slate-500 italic">No attachments found.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Sidebar - Right Column */}
                                <div className="space-y-6">
                                    {/* User Profile Card */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <User className="w-5 h-5 text-purple-600" />
                                                <span>Employee</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold">
                                                    {detail.full_name?.charAt(0) || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">{detail.full_name}</p>
                                                    <p className="text-xs text-slate-500">{detail.email}</p>
                                                </div>
                                            </div>
                                            <Separator className="my-3" />
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Dept</span>
                                                    <span className="font-medium">{detail.department_name}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Code</span>
                                                    <span className="font-medium">{detail.employee_code}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Phone</span>
                                                    <span className="font-medium">{detail.phone_number || "N/A"}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Timeline / Additional Meta */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-slate-500" />
                                                <span>Timeline</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
                                                <div className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-white dark:ring-slate-900"></div>
                                                    <p className="text-sm font-medium">Request Submitted</p>
                                                    <p className="text-xs text-slate-500">{formatDate(detail.created_at)}</p>
                                                </div>
                                                {detail.reviewed_at && (
                                                    <div className="relative">
                                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900"></div>
                                                        <p className="text-sm font-medium">Reviewed by Manager</p>
                                                        <p className="text-xs text-slate-500">{formatDate(detail.reviewed_at)}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Reviewer: {detail.manager_name}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* OCR Score */}
                                    {detail.ocr_confidence !== null && (
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-2">
                                                        <Receipt className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                                                        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-900 ${(detail.ocr_confidence || 0) > 0.8 ? 'bg-green-500' :
                                                            (detail.ocr_confidence || 0) > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}>
                                                            {Math.round((detail.ocr_confidence || 0) * 100)}%
                                                        </div>
                                                    </div>
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">AI Confidence Score</p>
                                                    <p className="text-xs text-slate-500">Based on receipt scan analysis</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ManagerLayout>
        </RouteProtection>
    );
}
