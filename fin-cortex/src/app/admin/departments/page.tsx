"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Trash2,
    Loader2,
    Building2,
    Search,
    AlertTriangle,
    Users,
    Crown,
    Mail,
    User,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";

interface Department {
    department_id: number;
    department_name: string;
    created_at?: string;
}

interface DeptMember {
    manager_id?: string;
    user_id?: string;
    full_name: string;
    email: string;
    designation?: string;
}

interface DeptDetail {
    department: Department;
    managers: DeptMember[];
    employees: DeptMember[];
}

export default function DepartmentsPage() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Detail state
    const [deptDetail, setDeptDetail] = useState<DeptDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Form state
    const [deptName, setDeptName] = useState("");

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            setLoading(true);
            setError(null);
            const adminId = userProfile?.user_id;
            const url = adminId
                ? `/api/v1/admin/departments?admin_id=${encodeURIComponent(adminId)}`
                : "/api/v1/admin/departments";
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.success) {
                setDepartments(data.data || []);
            } else {
                throw new Error(data.error || "Failed to load departments");
            }
        } catch (err: any) {
            console.error("Failed to load departments:", err);
            setError(err.message || "Failed to load departments. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddDepartment = async () => {
        if (!deptName.trim()) return;
        try {
            setIsSaving(true);
            const resp = await fetch("/api/v1/admin/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ department_name: deptName.trim(), admin_id: userProfile?.user_id }),
            });
            const data = await resp.json();
            if (!data.success) {
                throw new Error(data.error || "Failed to create department");
            }
            setIsAddOpen(false);
            setDeptName("");
            await loadDepartments();
        } catch (err: any) {
            console.error("Failed to add department:", err);
            alert(err.message || "Failed to create department");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDepartment = async () => {
        if (!selectedDept) return;
        try {
            setIsSaving(true);
            const adminId = userProfile?.user_id;
            const deleteUrl = adminId
                ? `/api/v1/admin/departments/${selectedDept.department_id}?admin_id=${encodeURIComponent(adminId)}`
                : `/api/v1/admin/departments/${selectedDept.department_id}`;
            const resp = await fetch(deleteUrl, {
                method: "DELETE",
            });
            const data = await resp.json();
            if (!data.success) {
                throw new Error(data.error || "Failed to delete department");
            }
            setIsDeleteOpen(false);
            setSelectedDept(null);
            await loadDepartments();
        } catch (err: any) {
            console.error("Failed to delete department:", err);
            alert(err.message || "Failed to delete department");
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteDialog = (dept: Department, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDept(dept);
        setIsDeleteOpen(true);
    };

    const openDetailDialog = async (dept: Department) => {
        setSelectedDept(dept);
        setIsDetailOpen(true);
        setDetailLoading(true);
        setDeptDetail(null);
        try {
            const adminId = userProfile?.user_id || "";
            const resp = await fetch(`/api/v1/admin/departments/${dept.department_id}?admin_id=${adminId}`);
            const data = await resp.json();
            if (data.success) {
                setDeptDetail(data.data);
            }
        } catch (err) {
            console.error("Failed to load department detail:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    const filteredDepartments = departments.filter((d) =>
        d.department_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full max-w-full overflow-hidden">
            <PageHeader
                title="DEPARTMENTS"
                description="Manage company departments and organizational structure"
                icon={Building2}
                actions={
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--card-hover)]"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    </div>
                }
            />

            <div className="space-y-6 mt-8">
                {/* Search + Add */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] group-focus-within:text-purple-500 transition-colors z-10" />
                        <Input
                            placeholder="Search departments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-[var(--card-dark)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        />
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Department
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[var(--card-dark)] border border-[var(--border-subtle)] text-[var(--text-primary)] backdrop-blur-xl shadow-xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Add New Department</DialogTitle>
                                <DialogDescription className="text-[var(--text-muted)]">
                                    Create a new department for your organization.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="dept_name" className="text-[var(--text-secondary)] font-medium">Department Name</Label>
                                    <Input
                                        id="dept_name"
                                        value={deptName}
                                        onChange={(e) => setDeptName(e.target.value)}
                                        placeholder="e.g. Engineering, Marketing, Finance"
                                        className="bg-[var(--background-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-purple-500/20"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && deptName.trim()) {
                                                handleAddDepartment();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="hover:bg-[var(--card-hover)] text-[var(--text-secondary)]">Cancel</Button>
                                <Button
                                    onClick={handleAddDepartment}
                                    disabled={isSaving || !deptName.trim()}
                                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0 shadow-lg shadow-purple-500/20"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    Create Department
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Loader */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-3xl">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Loading Departments...</span>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <Card className="bg-red-500/5 border-red-500/20 mb-6">
                        <CardContent className="p-8 flex items-center gap-4 text-red-500">
                            <AlertTriangle className="w-6 h-6" />
                            <span>{error}</span>
                            <Button variant="outline" size="sm" onClick={loadDepartments} className="ml-auto border-red-500/20 text-red-500">
                                Retry
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Department Grid */}
                {!loading && !error && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <Building2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                                {filteredDepartments.length} Department{filteredDepartments.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDepartments.map((dept) => (
                                <Card
                                    key={dept.department_id}
                                    onClick={() => openDetailDialog(dept)}
                                    className="bg-[var(--card-dark)] border-[var(--border-subtle)] hover:bg-[var(--card-hover)] transition-all duration-500 group overflow-hidden hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/5 cursor-pointer"
                                >
                                    <CardHeader className="pb-3 border-b border-[var(--border-subtle)] relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-500 border border-purple-500/20">
                                                    <Building2 className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-bold text-[var(--text-primary)] group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                                                        {dept.department_name}
                                                    </CardTitle>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">
                                                        ID: {dept.department_id}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                                                onClick={(e) => openDeleteDialog(dept, e)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 relative z-10">
                                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                            <Users className="w-3.5 h-3.5" />
                                            <span className="text-xs">Click to view members</span>
                                        </div>
                                        {dept.created_at && (
                                            <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                                Created {new Date(dept.created_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {filteredDepartments.length === 0 && (
                            <div className="text-center py-16">
                                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[var(--card-dark)] flex items-center justify-center border border-[var(--border-subtle)]">
                                    <Search className="h-8 w-8 text-[var(--text-muted)]" />
                                </div>
                                <h3 className="text-lg font-medium text-[var(--text-secondary)]">
                                    {searchTerm ? "No departments found" : "No departments yet"}
                                </h3>
                                <p className="text-[var(--text-muted)] mt-1">
                                    {searchTerm
                                        ? "Try adjusting your search."
                                        : "Create your first department to get started."}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Department Detail Dialog */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="bg-[var(--card-dark)] border border-[var(--border-subtle)] text-[var(--text-primary)] backdrop-blur-xl shadow-xl max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-[var(--text-primary)]">
                                        {selectedDept?.department_name}
                                    </DialogTitle>
                                    <DialogDescription className="text-[var(--text-muted)] text-xs">
                                        Department ID: {selectedDept?.department_id}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {detailLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Loading...</span>
                            </div>
                        ) : deptDetail ? (
                            <div className="space-y-6 py-2">
                                {/* Manager Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Crown className="w-4 h-4 text-amber-400" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                                            Manager{deptDetail.managers.length !== 1 ? "s" : ""}
                                        </h3>
                                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-1.5 py-0">
                                            {deptDetail.managers.length}
                                        </Badge>
                                    </div>
                                    {deptDetail.managers.length > 0 ? (
                                        <div className="space-y-2">
                                            {deptDetail.managers.map((mgr) => (
                                                <div
                                                    key={mgr.manager_id}
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-subtle)]"
                                                >
                                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-400 border border-amber-500/20 flex-shrink-0">
                                                        <Crown className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{mgr.full_name}</p>
                                                        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                                                            <Mail className="w-3 h-3 flex-shrink-0" />
                                                            <span className="text-xs truncate">{mgr.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-dashed border-[var(--border-subtle)] text-center">
                                            <p className="text-xs text-[var(--text-muted)]">No manager assigned</p>
                                        </div>
                                    )}
                                </div>

                                {/* Employees Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                                            Employees
                                        </h3>
                                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-1.5 py-0">
                                            {deptDetail.employees.length}
                                        </Badge>
                                    </div>
                                    {deptDetail.employees.length > 0 ? (
                                        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                                            {deptDetail.employees.map((emp) => (
                                                <div
                                                    key={emp.user_id}
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] transition-colors"
                                                >
                                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 flex-shrink-0">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{emp.full_name}</p>
                                                        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                                                            <Mail className="w-3 h-3 flex-shrink-0" />
                                                            <span className="text-xs truncate">{emp.email}</span>
                                                        </div>
                                                        {emp.designation && (
                                                            <span className="text-[10px] text-purple-400 font-medium mt-0.5 block">{emp.designation}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-dashed border-[var(--border-subtle)] text-center">
                                            <p className="text-xs text-[var(--text-muted)]">No employees in this department</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center text-[var(--text-muted)]">
                                Failed to load department details.
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                onClick={() => setIsDetailOpen(false)}
                                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-purple-500/20 px-6"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="bg-[var(--card-dark)] border border-red-500/20 text-[var(--text-primary)] backdrop-blur-xl shadow-xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">Delete Department?</DialogTitle>
                            <DialogDescription className="text-[var(--text-muted)]">
                                Are you sure you want to delete <span className="text-[var(--text-primary)] font-semibold">&quot;{selectedDept?.department_name}&quot;</span>? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-8 gap-3">
                            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="hover:bg-[var(--card-hover)] text-[var(--text-secondary)]">Cancel</Button>
                            <Button
                                onClick={handleDeleteDepartment}
                                disabled={isSaving}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Delete Department
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
