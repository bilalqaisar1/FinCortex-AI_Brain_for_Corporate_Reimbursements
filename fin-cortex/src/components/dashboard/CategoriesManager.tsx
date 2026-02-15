"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Loader2,
    Briefcase,
    ChevronRight,
    Search,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    fetchCategories,
    createCategory,
    createSubcategory,
    deleteCategory,
    deleteSubcategory,
    type Category,
    type Subcategory,
    type CreateCategoryInput,
    type CreateSubcategoryInput
} from "@/app/api/v1/admin/categories-api";

export function CategoriesManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog states
    const [isAddCatOpen, setIsAddCatOpen] = useState(false);
    const [isAddSubOpen, setIsAddSubOpen] = useState(false);
    const [isDeleteCatOpen, setIsDeleteCatOpen] = useState(false);
    const [isDeleteSubOpen, setIsDeleteSubOpen] = useState(false);

    // Selected items
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);

    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [catForm, setCatForm] = useState<CreateCategoryInput>({
        category_name: "",
        description: ""
    });

    const [subForm, setSubForm] = useState<CreateSubcategoryInput>({
        subcategory_name: "",
        category_id: 0,
        description: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchCategories();
            setCategories(data);
        } catch (err) {
            console.error("Failed to load categories:", err);
            setError("Failed to load categories. Please ensure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!catForm.category_name) return;
        try {
            setIsSaving(true);
            await createCategory(catForm);
            setIsAddCatOpen(false);
            setCatForm({ category_name: "", description: "" });
            await loadData();
        } catch (err) {
            console.error("Failed to add category:", err);
            alert("Failed to create category");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSubcategory = async () => {
        if (!subForm.subcategory_name || !selectedCategory) return;
        try {
            setIsSaving(true);
            await createSubcategory({
                ...subForm,
                category_id: selectedCategory.category_id
            });
            setIsAddSubOpen(false);
            setSubForm({ subcategory_name: "", category_id: 0, description: "" });
            setSelectedCategory(null);
            await loadData();
        } catch (err) {
            console.error("Failed to add subcategory:", err);
            alert("Failed to create subcategory");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategory) return;
        try {
            setIsSaving(true);
            await deleteCategory(selectedCategory.category_id);
            setIsDeleteCatOpen(false);
            setSelectedCategory(null);
            await loadData();
        } catch (err: any) {
            console.error("Failed to delete category:", err);
            const message = err?.message || "Failed to delete category";
            // Show the backend's detailed error (e.g. FK constraint reason)
            alert(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSubcategory = async () => {
        if (!selectedSubcategory) return;
        try {
            setIsSaving(true);
            await deleteSubcategory(selectedSubcategory.subcategory_id);
            setIsDeleteSubOpen(false);
            setSelectedSubcategory(null);
            await loadData();
        } catch (err) {
            console.error("Failed to delete subcategory:", err);
            alert("Failed to delete subcategory");
        } finally {
            setIsSaving(false);
        }
    };

    const openAddSubDialog = (category: Category) => {
        setSelectedCategory(category);
        setSubForm({ ...subForm, category_id: category.category_id });
        setIsAddSubOpen(true);
    };

    const openDeleteCatDialog = (category: Category) => {
        setSelectedCategory(category);
        setIsDeleteCatOpen(true);
    };

    const openDeleteSubDialog = (sub: Subcategory) => {
        setSelectedSubcategory(sub);
        setIsDeleteSubOpen(true);
    };

    const filteredCategories = categories.filter(cat =>
        cat.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.subcategories?.some(sub => sub.subcategory_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors z-10" />
                    <Input
                        placeholder="Search categories and subcategories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 glass-effect border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <Dialog open={isAddCatOpen} onOpenChange={setIsAddCatOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-effect border-[var(--border-subtle)] backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Add New Category</DialogTitle>
                            <DialogDescription className="text-[var(--text-muted)]">
                                Create a new main category for expenses.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-6">
                            <div className="grid gap-2">
                                <Label htmlFor="cat_name" className="text-[var(--text-secondary)] font-medium">Category Name</Label>
                                <Input
                                    id="cat_name"
                                    value={catForm.category_name}
                                    onChange={(e) => setCatForm({ ...catForm, category_name: e.target.value })}
                                    placeholder="e.g. Travel, Office Supplies"
                                    className="glass-effect border-[var(--border-subtle)] focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cat_desc" className="text-[var(--text-secondary)] font-medium">Description (Optional)</Label>
                                <Textarea
                                    id="cat_desc"
                                    value={catForm.description}
                                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                                    placeholder="Description of this category..."
                                    className="glass-effect border-[var(--border-subtle)] focus:ring-2 focus:ring-blue-500/20 min-h-[100px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsAddCatOpen(false)} className="hover:bg-white/5 text-[var(--text-secondary)]">Cancel</Button>
                            <Button
                                onClick={handleAddCategory}
                                disabled={isSaving || !catForm.category_name}
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg shadow-blue-500/20"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Create Category
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Subcategory Dialog */}
            <Dialog open={isAddSubOpen} onOpenChange={setIsAddSubOpen}>
                <DialogContent className="glass-effect border-[var(--border-subtle)] backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Add Subcategory</DialogTitle>
                        <DialogDescription className="text-[var(--text-muted)]">
                            Add a subcategory to <span className="text-[var(--text-primary)] font-semibold">"{selectedCategory?.category_name}"</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid gap-2">
                            <Label htmlFor="sub_name" className="text-[var(--text-secondary)] font-medium">Subcategory Name</Label>
                            <Input
                                id="sub_name"
                                value={subForm.subcategory_name}
                                onChange={(e) => setSubForm({ ...subForm, subcategory_name: e.target.value })}
                                placeholder="e.g. Flight, Hotel, Taxi"
                                className="glass-effect border-[var(--border-subtle)] focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddSubOpen(false)} className="hover:bg-white/5 text-[var(--text-secondary)]">Cancel</Button>
                        <Button
                            onClick={handleAddSubcategory}
                            disabled={isSaving || !subForm.subcategory_name}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg shadow-blue-500/20"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Add Subcategory
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Loader */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[var(--card-dark)] border border-[var(--border-subtle)] rounded-3xl">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Loading Categories...</span>
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <Card className="bg-red-500/5 border-red-500/20 mb-6">
                    <CardContent className="p-8 flex items-center gap-4 text-red-500">
                        <AlertTriangle className="w-6 h-6" />
                        <span>{error}</span>
                        <Button variant="outline" size="sm" onClick={loadData} className="ml-auto border-red-500/20 text-red-500">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Content */}
            {!loading && !error && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCategories.map((category) => (
                            <Card key={category.category_id} className="glass-effect border-[var(--border-subtle)] hover:bg-white/[0.02] transition-all duration-500 group overflow-hidden hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/5">
                                <CardHeader className="pb-3 border-b border-white/[0.05] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-500 border border-blue-500/20">
                                                <Briefcase className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors uppercase tracking-tight">{category.category_name}</CardTitle>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">
                                                    {(category.subcategories?.length || 0)} subcategories
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                                            onClick={() => openDeleteCatDialog(category)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 relative z-10">
                                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                        {category.subcategories && category.subcategories.length > 0 ? (
                                            category.subcategories.map((sub) => (
                                                <div key={sub.subcategory_id} className="flex items-center justify-between group/sub p-2.5 rounded-xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5">
                                                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500/40 group-hover/sub:bg-blue-400 group-hover/sub:scale-125 transition-all" />
                                                        <span className="group-hover/sub:text-[var(--text-primary)] transition-colors">{sub.subcategory_name}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-all rounded-full hover:bg-red-500/10"
                                                        onClick={() => openDeleteSubDialog(sub)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10 opacity-60">
                                                <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">No subcategories</p>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80 hover:text-blue-300 hover:bg-blue-500/10 border border-dashed border-blue-500/20 rounded-xl h-10 group/btn transition-all"
                                        onClick={() => openAddSubDialog(category)}
                                    >
                                        <Plus className="h-3 w-3 mr-2 group-hover/btn:scale-125 transition-transform" />
                                        Add Subcategory
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredCategories.length === 0 && (
                        <div className="text-center py-12">
                            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                                <Search className="h-8 w-8 text-[var(--text-muted)]" />
                            </div>
                            <h3 className="text-lg font-medium text-[var(--text-secondary)]">No categories found</h3>
                            <p className="text-[var(--text-muted)] mt-1">Try adjusting your search or add a new category.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Category Confirmation */}
            <Dialog open={isDeleteCatOpen} onOpenChange={setIsDeleteCatOpen}>
                <DialogContent className="glass-effect border-red-500/20 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">Delete Category?</DialogTitle>
                        <DialogDescription className="text-[var(--text-muted)]">
                            Are you sure you want to delete <span className="text-[var(--text-primary)] font-semibold">"{selectedCategory?.category_name}"</span> and all its subcategories? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-8 gap-3">
                        <Button variant="ghost" onClick={() => setIsDeleteCatOpen(false)} className="hover:bg-white/5 text-[var(--text-secondary)]">Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteCategory}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 border-0 shadow-lg shadow-red-500/20"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Delete Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Subcategory Confirmation */}
            <Dialog open={isDeleteSubOpen} onOpenChange={setIsDeleteSubOpen}>
                <DialogContent className="glass-effect border-red-500/20 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">Delete Subcategory?</DialogTitle>
                        <DialogDescription className="text-[var(--text-muted)]">
                            Are you sure you want to delete <span className="text-[var(--text-primary)] font-semibold">"{selectedSubcategory?.subcategory_name}"</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-8 gap-3">
                        <Button variant="ghost" onClick={() => setIsDeleteSubOpen(false)} className="hover:bg-white/5 text-[var(--text-secondary)]">Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSubcategory}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 border-0 shadow-lg shadow-red-500/20"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Delete Subcategory
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
