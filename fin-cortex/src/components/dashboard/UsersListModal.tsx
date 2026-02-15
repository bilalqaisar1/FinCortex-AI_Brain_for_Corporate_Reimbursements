"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Users, ShieldCheck, Mail, Building, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface UserItem {
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    status: string;
    assigned_manager?: string;
}

interface UsersListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: UserItem[];
    type: 'manager' | 'user';
}

export function UsersListModal({
    isOpen,
    onClose,
    title,
    data,
    type
}: UsersListModalProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl bg-[var(--background-secondary)] border-[var(--border-subtle)] shadow-2xl p-0 overflow-hidden text-[var(--text-primary)]">
                <DialogHeader className="px-6 py-4 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--background-secondary)] z-10">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border",
                                type === 'manager' ? "bg-purple-500/10 border-purple-500/20" : "bg-orange-500/10 border-orange-500/20"
                            )}>
                                {type === 'manager' ?
                                    <ShieldCheck className="w-5 h-5 text-purple-400" /> :
                                    <Users className="w-5 h-5 text-orange-400" />
                                }
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-[var(--text-primary)] tracking-tight uppercase">
                                    {title}
                                </DialogTitle>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
                                    {filteredData.length} Active {type === 'manager' ? 'Managers' : 'Users'}
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
                            placeholder={`Search by name, email, or department...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-[var(--card-dark)] border-[var(--border-medium)] focus:border-purple-500/50 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        />
                    </div>
                </div>

                <ScrollArea className="h-[60vh] bg-[var(--background-secondary)]">
                    <div className="p-2 space-y-2">
                        {filteredData.length > 0 ? (
                            filteredData.map((item) => (
                                <div
                                    key={item.id}
                                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-[var(--card-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-all duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[var(--card-dark)] flex items-center justify-center border border-[var(--border-subtle)] group-hover:border-[var(--border-medium)] transition-colors">
                                            <span className="text-sm font-black text-[var(--text-secondary)]">
                                                {item.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[var(--text-primary)]">{item.name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 h-4 border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                                                    <Building className="w-2.5 h-2.5" /> {item.department}
                                                </Badge>
                                                {type === 'user' && item.assigned_manager && (
                                                    <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 h-4 border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                                                        <ShieldCheck className="w-2.5 h-2.5" /> Mgr: {item.assigned_manager}
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 h-4 border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center gap-1">
                                                    <Mail className="w-2.5 h-2.5" /> {item.email || 'N/A'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <Badge className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border-0",
                                        item.status === 'Active' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                    )}>
                                        {item.status}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-[var(--text-muted)]">
                                <User className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-sm font-medium">No results found</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
