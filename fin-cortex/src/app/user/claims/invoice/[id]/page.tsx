"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Receipt,
    Download,
    ArrowLeft,
    CheckCircle2,
    Building2,
    User,
    Calendar,
    Hash,
    Tag,
    Ban,
    DollarSign,
    FileText,
    MapPin,
    Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { UserNavbar } from "@/components/dashboard/UserNavbar";

interface InvoiceItem {
    item: string;
    price: string;
    quantity: string;
    category?: string;
    subcategory?: string;
    reimbursable?: boolean;
}

interface InvoiceData {
    reimbursement_id: string;
    receipt_code: string;
    vendor_name: string;
    date: string;
    total_amount: string;
    invoice_number: string;
    category: string;
    subcategory: string;
    address: string;
    description: string;
    items: InvoiceItem[];
    user_name: string;
    user_email: string;
    employee_code: string;
    department: string;
    manager: string;
    receipt_type: string;
    vendor_type: string;
    policy_flags: any[];
}

export default function InvoicePage() {
    const router = useRouter();
    const { isDarkTheme, toggleTheme, themeIcon } = useTheme();
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem("invoiceData");
        if (stored) {
            setInvoiceData(JSON.parse(stored));
        }
    }, []);

    const reimbursableItems =
        invoiceData?.items.filter((i) => i.reimbursable !== false) || [];
    const nonReimbursableItems =
        invoiceData?.items.filter((i) => i.reimbursable === false) || [];

    const reimbursableTotal = reimbursableItems.reduce(
        (sum, i) =>
            sum + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 1),
        0
    );
    const nonReimbursableTotal = nonReimbursableItems.reduce(
        (sum, i) =>
            sum + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 1),
        0
    );

    const handlePrint = () => {
        window.print();
    };

    // Empty state — no invoice
    if (!invoiceData) {
        return (
            <div className="flex min-h-[calc(100vh-0px)] w-full">
                <UserNavbar toggleTheme={toggleTheme} themeIcon={themeIcon} />
                <main className="flex min-h-[100dvh] flex-1 flex-col pt-20 items-center justify-center">
                    <div className="text-center space-y-4">
                        <Receipt className="size-16 text-muted mx-auto" />
                        <h2 className="text-xl font-bold text-primary">No Invoice Data</h2>
                        <p className="text-muted text-sm">
                            No invoice data found. Please submit a claim first.
                        </p>
                        <Button
                            onClick={() => router.push("/user/claims/new")}
                            variant="outline"
                        >
                            Submit a Claim
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-0px)] w-full">
            {/* Navbar */}
            <UserNavbar toggleTheme={toggleTheme} themeIcon={themeIcon} />

            <main className="flex min-h-[100dvh] flex-1 flex-col pt-20 relative overflow-hidden">
                {/* Visual Background Elements */}
                <div className="absolute top-[-10%] right-[-10%] size-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none print:hidden" />
                <div className="absolute bottom-[-10%] left-[-10%] size-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none print:hidden" />

                {/* Header */}
                <div className="border-b border-subtle glass-effect px-4 md:px-6 py-4 relative z-10 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Receipt className="size-6 md:size-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-primary">
                                Claim Invoice
                            </h1>
                            <p className="text-xs md:text-sm text-muted">
                                Your claim has been submitted successfully
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 relative z-10">
                    {/* Action Bar */}
                    <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/user/claims/new")}
                            className="gap-2 text-muted hover:text-primary"
                        >
                            <ArrowLeft className="size-4" />
                            Submit New Claim
                        </Button>
                        <Button
                            onClick={handlePrint}
                            className="gap-2 relative overflow-hidden group shadow-lg shadow-primary/20 hover:shadow-primary/30"
                        >
                            <div className="absolute inset-0 bg-primary-gradient group-hover:opacity-90 transition-opacity" />
                            <div className="relative z-10 flex items-center gap-2 font-bold text-white">
                                <Download className="size-4" />
                                Download / Print
                            </div>
                        </Button>
                    </div>

                    {/* Success Banner */}
                    <div className="max-w-3xl mx-auto mb-6 print:hidden">
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-full">
                                <CheckCircle2 className="size-5 text-emerald-400" />
                            </div>
                            <div className="flex-1 pt-0.5">
                                <p className="text-sm font-bold text-emerald-400">
                                    Claim Submitted Successfully!
                                </p>
                                <p className="text-xs text-muted mt-0.5">
                                    Your reimbursement request has been submitted and is pending
                                    review. You can download this invoice for your records.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Card */}
                    <div
                        id="invoice-print-area"
                        className="max-w-3xl mx-auto bg-card border border-subtle rounded-2xl shadow-xl overflow-hidden"
                    >
                        {/* Invoice Header */}
                        <div className="bg-primary-gradient p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white/20 rounded-xl">
                                        <Receipt className="size-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold">
                                            Reimbursement Invoice
                                        </h1>
                                        <p className="text-white/70 text-sm">
                                            Claim Confirmation
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-white/60 uppercase tracking-wider">
                                        Receipt Code
                                    </p>
                                    <p className="text-lg font-mono font-bold">
                                        {invoiceData.receipt_code}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Employee & Company Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                                        <User className="size-3.5" /> Employee Details
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted">Name</span>
                                            <span className="font-medium text-primary">
                                                {invoiceData.user_name || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted">Email</span>
                                            <span className="font-medium text-primary text-right truncate max-w-[180px]">
                                                {invoiceData.user_email || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted">Employee Code</span>
                                            <span className="font-medium text-primary">
                                                {invoiceData.employee_code || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted">Claim ID</span>
                                            <span className="font-mono text-xs text-primary">
                                                {invoiceData.reimbursement_id || "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                                        <Building2 className="size-3.5" /> Organization
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted">Department</span>
                                            <span className="font-medium text-primary">
                                                {invoiceData.department || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted">Manager</span>
                                            <span className="font-medium text-primary">
                                                {invoiceData.manager || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted">Receipt Type</span>
                                            <span className="font-medium text-primary">
                                                {invoiceData.receipt_type || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted">Vendor Type</span>
                                            <span className="font-medium text-primary">
                                                {invoiceData.vendor_type || "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-subtle" />

                            {/* Expense Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="size-3.5 text-muted" />
                                        <span className="text-muted">Vendor</span>
                                        <span className="ml-auto font-medium text-primary">
                                            {invoiceData.vendor_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="size-3.5 text-muted" />
                                        <span className="text-muted">Date</span>
                                        <span className="ml-auto font-medium text-primary">
                                            {invoiceData.date || "—"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Hash className="size-3.5 text-muted" />
                                        <span className="text-muted">Invoice #</span>
                                        <span className="ml-auto font-medium text-primary">
                                            {invoiceData.invoice_number || "—"}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Tag className="size-3.5 text-muted" />
                                        <span className="text-muted">Category</span>
                                        <span className="ml-auto font-medium text-primary">
                                            {invoiceData.category || "—"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tag className="size-3.5 text-muted" />
                                        <span className="text-muted">Subcategory</span>
                                        <span className="ml-auto font-medium text-primary">
                                            {invoiceData.subcategory || "—"}
                                        </span>
                                    </div>
                                    {invoiceData.address && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="size-3.5 text-muted mt-0.5" />
                                            <span className="text-muted">Address</span>
                                            <span className="ml-auto font-medium text-primary text-right max-w-[200px]">
                                                {invoiceData.address}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-subtle" />

                            {/* Reimbursable Items Table */}
                            {reimbursableItems.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <CheckCircle2 className="size-3.5" /> Reimbursable Items
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-subtle">
                                                    <th className="text-left py-2 text-muted font-medium">
                                                        #
                                                    </th>
                                                    <th className="text-left py-2 text-muted font-medium">
                                                        Item
                                                    </th>
                                                    <th className="text-left py-2 text-muted font-medium">
                                                        Category
                                                    </th>
                                                    <th className="text-center py-2 text-muted font-medium">
                                                        Qty
                                                    </th>
                                                    <th className="text-right py-2 text-muted font-medium">
                                                        Price
                                                    </th>
                                                    <th className="text-right py-2 text-muted font-medium">
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reimbursableItems.map((item, idx) => {
                                                    const qty = parseFloat(item.quantity) || 1;
                                                    const price = parseFloat(item.price) || 0;
                                                    return (
                                                        <tr
                                                            key={idx}
                                                            className="border-b border-subtle/50"
                                                        >
                                                            <td className="py-2.5 text-muted">{idx + 1}</td>
                                                            <td className="py-2.5 text-primary font-medium">
                                                                {item.item}
                                                            </td>
                                                            <td className="py-2.5">
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">
                                                                    {item.category || "—"}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 text-center text-primary">
                                                                {qty}
                                                            </td>
                                                            <td className="py-2.5 text-right text-primary">
                                                                PKR {price.toFixed(2)}
                                                            </td>
                                                            <td className="py-2.5 text-right font-medium text-primary">
                                                                PKR {(qty * price).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Non-Reimbursable Items Table */}
                            {nonReimbursableItems.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Ban className="size-3.5" /> Non-Reimbursable Items
                                        (Excluded)
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm opacity-60">
                                            <thead>
                                                <tr className="border-b border-red-500/20">
                                                    <th className="text-left py-2 text-muted font-medium">
                                                        #
                                                    </th>
                                                    <th className="text-left py-2 text-muted font-medium">
                                                        Item
                                                    </th>
                                                    <th className="text-left py-2 text-muted font-medium">
                                                        Reason
                                                    </th>
                                                    <th className="text-center py-2 text-muted font-medium">
                                                        Qty
                                                    </th>
                                                    <th className="text-right py-2 text-muted font-medium line-through">
                                                        Price
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {nonReimbursableItems.map((item, idx) => {
                                                    const qty = parseFloat(item.quantity) || 1;
                                                    const price = parseFloat(item.price) || 0;
                                                    return (
                                                        <tr
                                                            key={idx}
                                                            className="border-b border-red-500/10"
                                                        >
                                                            <td className="py-2.5 text-muted">{idx + 1}</td>
                                                            <td className="py-2.5 text-red-400 line-through">
                                                                {item.item}
                                                            </td>
                                                            <td className="py-2.5">
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400">
                                                                    <Ban className="size-2.5" />
                                                                    {item.category || "Not categorized"} — Not
                                                                    Allowed
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 text-center text-muted">
                                                                {qty}
                                                            </td>
                                                            <td className="py-2.5 text-right text-muted line-through">
                                                                PKR {price.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <hr className="border-subtle" />

                            {/* Totals Section */}
                            <div className="space-y-2">
                                {nonReimbursableItems.length > 0 && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted">Subtotal (All Items)</span>
                                            <span className="text-primary">
                                                PKR{" "}
                                                {(reimbursableTotal + nonReimbursableTotal).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-red-400">
                                                Non-Reimbursable Deduction
                                            </span>
                                            <span className="text-red-400">
                                                - PKR {nonReimbursableTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <hr className="border-subtle" />
                                    </>
                                )}
                                <div className="flex justify-between items-center pt-1">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="size-5 text-emerald-400" />
                                        <span className="text-base font-bold text-primary">
                                            Total Reimbursable Amount
                                        </span>
                                    </div>
                                    <span className="text-2xl font-bold text-emerald-400">
                                        PKR {reimbursableTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            {invoiceData.description && (
                                <>
                                    <hr className="border-subtle" />
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                                            <FileText className="size-3.5" /> Notes
                                        </h3>
                                        <p className="text-sm text-primary">
                                            {invoiceData.description}
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Footer */}
                            <div className="pt-4 border-t border-subtle text-center">
                                <p className="text-[10px] text-muted">
                                    This invoice was auto-generated by FinCortex AI on{" "}
                                    {new Date().toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                    . Please retain this for your records.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Go Back Button (below invoice) */}
                    <div className="max-w-3xl mx-auto mt-6 text-center print:hidden">
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/user/claims/new")}
                            className="gap-2 text-muted hover:text-primary"
                        >
                            <ArrowLeft className="size-4" />
                            Submit Another Claim
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
