"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, Building, User, X, ArrowLeft, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ClaimItem {
    id: string;
    reimbursement_id: string;
    employee_name: string;
    department: string;
    manager: string;
    status: string;
    amount: number;
    created_at: string;
}

interface ClaimsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ClaimItem[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
    approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-400" },
    pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-400" },
    rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400" },
};

export function ClaimsListModal({
    isOpen,
    onClose,
    data,
}: ClaimsListModalProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredData = data.filter(item =>
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.manager.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl bg-[var(--background-secondary)] border-[var(--border-subtle)] shadow-2xl p-0 overflow-hidden text-[var(--text-primary)]">
                <DialogHeader className="px-6 py-4 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--background-secondary)] z-10">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mr-1"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-[var(--text-primary)] tracking-tight uppercase">
                                    All Claims
                                </DialogTitle>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
                                    {filteredData.length} Total Claims
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </DialogHeader>

                <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--background-secondary)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <Input
                            placeholder="Search by claim ID, employee, department, or status..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-[var(--card-dark)] border-[var(--border-medium)] focus:border-purple-500/50 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        />
                    </div>
                </div>

                <ScrollArea className="h-[60vh] bg-[var(--background-secondary)]">
                    <div className="p-2 space-y-2">
                        {filteredData.length > 0 ? (
                            filteredData.map((item, idx) => {
                                const sc = statusConfig[item.status] || statusConfig.pending;
                                return (
                                    <div
                                        key={item.reimbursement_id || idx}
                                        className="group flex items-center justify-between p-4 rounded-xl hover:bg-[var(--card-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-[var(--card-dark)] flex items-center justify-center border border-[var(--border-subtle)] group-hover:border-[var(--border-medium)] transition-colors flex-shrink-0">
                                                <span className="text-sm font-black text-[var(--text-secondary)]">
                                                    {item.employee_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{item.employee_name}</h4>
                                                    <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 h-4 border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider flex-shrink-0">
                                                        {item.id}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 h-4 border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                                                        <Building className="w-2.5 h-2.5" /> {item.department}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 h-4 border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                                                        <User className="w-2.5 h-2.5" /> Mgr: {item.manager}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 h-4 border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center gap-1">
                                                        <DollarSign className="w-2.5 h-2.5" /> {formatCurrency(item.amount)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <Badge className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border-0 flex-shrink-0 ml-3", sc.color)}>
                                            {sc.label}
                                        </Badge>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-[var(--text-muted)]">
                                <FileText className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-sm font-medium">No results found</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
