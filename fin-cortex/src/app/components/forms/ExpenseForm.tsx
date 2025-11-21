"use client";

import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRPCColumnValues } from "@/hooks/useRPCColumnValues";
import { useToastNotification } from "@/hooks/useToastNotification";
import { useAuth } from "@/context/AuthContext";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, "")
  : typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : null;

const RECEIPT_UPLOAD_ENDPOINT = BACKEND_BASE_URL ? `${BACKEND_BASE_URL}/api/v1/receipt/upload` : null;
const RECEIPT_CODE_ENDPOINT = BACKEND_BASE_URL ? `${BACKEND_BASE_URL}/api/v1/receipt-code/generate` : null;

interface ExpenseFormProps {
  isDarkTheme: boolean;
}

interface FormData {
  receiptCode: string;
  vendorName: string;
  date: string;
  categoryId: string;
  subcategoryId: string;
  address: string;
  totalAmount: string;
  invoiceNumber: string;
  items: Array<{ item: string; price: string; quantity: string }>;
  receiptType: string;
  vendorType: string;
  description: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

type SelectOption = {
  id: string;
  label: string;
};

type SubcategoryOption = SelectOption & {
  categoryId: string | null;
};

interface OCRData {
  "Vendor Name"?: string;
  Date?: string;
  Categories?: string[];
  Subcategories?: string[];
  items?: Array<{ item: string; price: string }>;
  Address?: string;
  "Total Amount"?: string;
  "Invoice Number"?: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ isDarkTheme }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToastNotification();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    receiptCode: "",
    vendorName: "",
    date: "",
    categoryId: "",
    subcategoryId: "",
    address: "",
    totalAmount: "",
    invoiceNumber: "",
    items: [{ item: "", price: "", quantity: "" }],
    receiptType: "",
    vendorType: "",
    description: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrData, setOcrData] = useState<OCRData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showReviewMessage, setShowReviewMessage] = useState(false);

  // Load categories
  const {
    data: categoryOptions,
    loading: categoriesLoading,
    error: categoriesError,
  } = useRPCColumnValues<SelectOption, "id" | "label">({
    tableName: "expense_categories",
    columns: [
      { key: "id", columnName: "category_id" },
      { key: "label", columnName: "category_name" },
    ],
    transform: (rows) =>
      rows
        .map((row) => ({
          id: String(row["id"] ?? ""),
          label: String(row["label"] ?? ""),
        }))
        .filter((option) => option.id && option.label),
  });

  // Load subcategories
  const {
    data: subcategoryOptions,
    loading: subcategoriesLoading,
    error: subcategoriesError,
  } = useRPCColumnValues<SubcategoryOption, "id" | "label" | "categoryId">({
    tableName: "expense_subcategories",
    columns: [
      { key: "id", columnName: "subcategory_id" },
      { key: "label", columnName: "subcategory_name" },
      { key: "categoryId", columnName: "category_id" },
    ],
    transform: (rows) =>
      rows
        .map((row) => ({
          id: String(row["id"] ?? ""),
          label: String(row["label"] ?? ""),
          categoryId: row["categoryId"] ? String(row["categoryId"]) : null,
        }))
        .filter((option) => option.id && option.label),
  });

  // Hardcoded receipt types
  const receiptTypeOptions: SelectOption[] = [
    { id: "1", label: "Paper" },
    { id: "2", label: "Bank Transfer" },
    { id: "3", label: "Bill" },
    { id: "4", label: "Invoice" },
    { id: "5", label: "Digital Receipt" },
    { id: "6", label: "Credit Card Statement" },
  ];

  // Hardcoded vendor types
  const vendorTypeOptions: SelectOption[] = [
    { id: "1", label: "Logistic" },
    { id: "2", label: "Hardware" },
    { id: "3", label: "Software" },
    { id: "4", label: "Agriculture" },
    { id: "5", label: "Retail" },
    { id: "6", label: "Food & Beverage" },
    { id: "7", label: "Transportation" },
    { id: "8", label: "Healthcare" },
    { id: "9", label: "Education" },
    { id: "10", label: "Other" },
  ];

  // Filter subcategories by selected category
  const availableSubcategories = React.useMemo(() => {
    if (!formData.categoryId) return [];
    return subcategoryOptions.filter((option) => option.categoryId === formData.categoryId);
  }, [formData.categoryId, subcategoryOptions]);

  // Create stable reference keys to avoid useEffect dependency array size issues
  const categoryOptionsKey = React.useMemo(
    () => categoryOptions.map((opt) => opt.id).join(","),
    [categoryOptions]
  );
  const availableSubcategoriesKey = React.useMemo(
    () => availableSubcategories.map((opt) => opt.id).join(","),
    [availableSubcategories]
  );
  const subcategoryOptionsKey = React.useMemo(
    () => subcategoryOptions.map((opt) => opt.id).join(","),
    [subcategoryOptions]
  );

  // Generate receipt code on mount
  useEffect(() => {
    const generateReceiptCode = async () => {
      if (!RECEIPT_CODE_ENDPOINT) return;
      try {
        const response = await fetch(RECEIPT_CODE_ENDPOINT);
        const payload = await response.json();
        if (payload?.success && payload?.data?.receipt_code) {
          setFormData((prev) => ({ ...prev, receiptCode: payload.data.receipt_code }));
        }
      } catch (error) {
        console.error("Failed to generate receipt code", error);
      }
    };
    generateReceiptCode();
  }, []);

  // Helper function to parse amount (removes currency symbols, commas, etc.)
  const parseAmount = (amountStr: string): string => {
    if (!amountStr) return "";
    // Remove currency symbols, commas, and spaces, but keep digits, dots, and minus signs
    return amountStr.replace(/[^\d.-]/g, "").replace(/,/g, "");
  };

  // Helper function to parse date (handles various formats)
  const parseDate = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      // Try parsing as-is first
      let date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
      // Try common date formats
      const formats = [
        /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/, // YYYY-MM-DD or YYYY/MM/DD
        /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
        /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})/,  // MM/DD/YY or DD/MM/YY
      ];
      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          if (format === formats[0]) {
            // YYYY-MM-DD format
            date = new Date(`${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`);
          } else {
            // Try MM/DD/YYYY first, then DD/MM/YYYY
            date = new Date(`${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`);
            if (isNaN(date.getTime())) {
              date = new Date(`${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`);
            }
          }
          if (!isNaN(date.getTime())) {
            return date.toISOString().split("T")[0];
          }
        }
      }
    } catch {}
    return "";
  };

  // Helper function to find best category match (fuzzy matching)
  const findCategoryMatch = (categoryName: string): SelectOption | undefined => {
    if (!categoryName) return undefined;
    const normalized = categoryName.toLowerCase().trim();
    
    // Exact match first
    let match = categoryOptions.find((opt) => opt.label.toLowerCase() === normalized);
    if (match) return match;
    
    // Partial match (contains)
    match = categoryOptions.find((opt) => 
      opt.label.toLowerCase().includes(normalized) || 
      normalized.includes(opt.label.toLowerCase())
    );
    if (match) return match;
    
    // Word-based match
    const words = normalized.split(/\s+/);
    match = categoryOptions.find((opt) => {
      const optWords = opt.label.toLowerCase().split(/\s+/);
      return words.some((word) => optWords.some((optWord) => optWord.includes(word) || word.includes(optWord)));
    });
    
    return match;
  };

  // Helper function to find best subcategory match (fuzzy matching)
  const findSubcategoryMatch = (
    subcategoryName: string,
    categoryIdOverride?: string
  ): SubcategoryOption | undefined => {
    if (!subcategoryName) return undefined;
    const targetCategoryId = categoryIdOverride || formData.categoryId;
    if (!targetCategoryId) return undefined;

    const normalized = subcategoryName.toLowerCase().trim();

    const scopedSubcategories = subcategoryOptions.filter((opt) => opt.categoryId === targetCategoryId);
    
    // Exact match first
    let match = scopedSubcategories.find((opt) => opt.label.toLowerCase() === normalized);
    if (match) return match;
    
    // Partial match (contains)
    match = scopedSubcategories.find((opt) =>
      opt.label.toLowerCase().includes(normalized) || 
      normalized.includes(opt.label.toLowerCase())
    );
    if (match) return match;
    
    // Word-based match
    const words = normalized.split(/\s+/);
    match = scopedSubcategories.find((opt) => {
      const optWords = opt.label.toLowerCase().split(/\s+/);
      return words.some((word) => optWords.some((optWord) => optWord.includes(word) || word.includes(optWord)));
    });
    
    return match;
  };

  // Auto-fill form from OCR data
  useEffect(() => {
    if (!ocrData) return;

    setFormData((prev) => {
      const updated = { ...prev };
      let matchedCategoryId = prev.categoryId;

      // Vendor Name
      if (ocrData["Vendor Name"]) {
        updated.vendorName = String(ocrData["Vendor Name"]).trim();
      }

      // Date - improved parsing
      if (ocrData.Date) {
        const parsedDate = parseDate(String(ocrData.Date));
        if (parsedDate) {
          updated.date = parsedDate;
        }
      }

      // Address
      if (ocrData.Address) {
        updated.address = String(ocrData.Address).trim();
      }

      // Total Amount - improved parsing
      if (ocrData["Total Amount"]) {
        const parsedAmount = parseAmount(String(ocrData["Total Amount"]));
        if (parsedAmount) {
          updated.totalAmount = parsedAmount;
        }
      }

      // Invoice Number
      if (ocrData["Invoice Number"]) {
        updated.invoiceNumber = String(ocrData["Invoice Number"]).trim();
      }

      // Items - improved parsing
      if (ocrData.items && Array.isArray(ocrData.items) && ocrData.items.length > 0) {
        updated.items = ocrData.items.map((item: any) => ({
          item: String(item.item || "").trim(),
          price: parseAmount(String(item.price || "")),
          quantity: item.quantity ? String(item.quantity).trim() : "1",
        })).filter((item) => item.item || item.price); // Remove empty items
      }

      // Match category - improved fuzzy matching
      if (ocrData.Categories && Array.isArray(ocrData.Categories) && ocrData.Categories.length > 0) {
        const categoryMatch = findCategoryMatch(ocrData.Categories[0]);
        if (categoryMatch) {
          matchedCategoryId = categoryMatch.id;
          updated.categoryId = matchedCategoryId;
          updated.subcategoryId = ""; // Reset subcategory when category changes
        }
      }

      // Match subcategory - improved fuzzy matching
      if (
        ocrData.Subcategories &&
        Array.isArray(ocrData.Subcategories) &&
        ocrData.Subcategories.length > 0 &&
        matchedCategoryId
      ) {
        const subcategoryMatch = findSubcategoryMatch(ocrData.Subcategories[0], matchedCategoryId);
        if (subcategoryMatch) {
          updated.subcategoryId = subcategoryMatch.id;
        }
      }

      return updated;
    });

    setShowReviewMessage(true);
  }, [ocrData, categoryOptionsKey, availableSubcategoriesKey, subcategoryOptionsKey]);

  const processOCR = useCallback(
    async (imageFile: File) => {
      if (!RECEIPT_UPLOAD_ENDPOINT) {
        showToast("error", "Configuration Error", "Backend URL not configured");
        return;
      }

      setIsProcessingOCR(true);
      try {
        const body = new FormData();
        body.append("file", imageFile);

        const response = await fetch(RECEIPT_UPLOAD_ENDPOINT, {
          method: "POST",
          body,
        });

        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.detail || payload?.message || "Failed to process receipt");
        }

        const structured = payload.data?.structured || {};
        setOcrData(structured);
        showToast("success", "Receipt Processed", "Fields have been auto-filled. Please review and make corrections if needed.");
      } catch (error) {
        console.error("OCR processing failed", error);
        showToast("error", "Processing Failed", "Unable to extract data from receipt. Please try again.");
      } finally {
        setIsProcessingOCR(false);
      }
    },
    [showToast]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        showToast("error", "Invalid File", "Please upload an image file");
        return;
      }
      setUploadedFile(file);
      setOcrData(null);
      setShowReviewMessage(false);
      await processOCR(file);
    },
    [processOCR, showToast]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { item: "", price: "", quantity: "" }],
    }));
  };

  const removeItemRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: "item" | "price" | "quantity", value: string) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.receiptCode.trim()) newErrors.receiptCode = "Receipt code is required";
    if (!formData.vendorName.trim()) newErrors.vendorName = "Vendor name is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = "Valid total amount is required";
    }
    if (!formData.receiptType) newErrors.receiptType = "Receipt type is required";
    if (!formData.vendorType) newErrors.vendorType = "Vendor type is required";
    if (!uploadedFile) newErrors.file = "Please upload a receipt image";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      showToast("error", "Validation Error", "Please fill all required fields");
      return;
    }

    // For now, just show a message - submission to Supabase is disabled
    showToast("info", "Form Ready", "Form validation passed. Submission functionality will be enabled later.");
    console.log("Form data:", formData);
  };

  const selectTriggerClasses = `${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`;
  const selectContentClasses = `${isDarkTheme ? "bg-[#233648]" : "bg-white/95"} backdrop-blur-lg border-subtle z-[100]`;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Receipt Upload Section */}
      <Card className="glass-effect border-subtle">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-primary">Receipt Upload</CardTitle>
          <CardDescription>Upload a receipt image to auto-fill form fields</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!uploadedFile && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-subtle rounded-xl bg-[#233648]/30 hover:bg-[#233648]/50 cursor-pointer transition-all hover:border-primary/50"
            >
              <Upload className="size-12 text-primary mb-4" />
              <p className="text-sm font-medium text-primary mb-1">Upload Receipt</p>
              <p className="text-xs text-muted text-center">Click to select or drag and drop</p>
              <p className="text-xs text-muted mt-2">PNG, JPG up to 10MB</p>
            </div>
          )}

          {uploadedFile && (
            <div className="relative">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                <img
                  src={URL.createObjectURL(uploadedFile)}
                  alt="Receipt"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    setOcrData(null);
                    setShowReviewMessage(false);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-500 rounded-full text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
              {isProcessingOCR && (
                <div className="mt-4 flex items-center gap-3 p-4 bg-[#233648] rounded-lg">
                  <Loader2 className="size-5 text-primary animate-spin" />
                  <span className="text-sm text-primary">Processing receipt with OCR...</span>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {errors.file && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="size-4" />
              <span>{errors.file}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Message */}
      {showReviewMessage && ocrData && (
        <Card className="glass-effect border-emerald-500/20 bg-emerald-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="size-5 text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-400 mb-1">
                  Review the fields below and make corrections if needed
                </p>
                <p className="text-xs text-muted">
                  Some fields have been auto-filled from your receipt. Please verify and edit any incorrect information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-filled Fields Section */}
      <Card className="glass-effect border-subtle">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-primary">Auto-filled Information</CardTitle>
          <CardDescription>Review and edit the extracted information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="receiptCode" className="text-primary">
                Receipt Code <span className="text-red-400">*</span>
              </Label>
              <Input
                id="receiptCode"
                value={formData.receiptCode}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, receiptCode: e.target.value.toUpperCase() }));
                  setErrors((prev) => ({ ...prev, receiptCode: undefined }));
                }}
                className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
                placeholder="RC-XXXX"
              />
              {errors.receiptCode && <p className="text-xs text-red-400">{errors.receiptCode}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorName" className="text-primary">
                Vendor Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="vendorName"
                value={formData.vendorName}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, vendorName: e.target.value }));
                  setErrors((prev) => ({ ...prev, vendorName: undefined }));
                }}
                className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
                placeholder="Enter vendor name"
              />
              {errors.vendorName && <p className="text-xs text-red-400">{errors.vendorName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-primary">
                Date <span className="text-red-400">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, date: e.target.value }));
                  setErrors((prev) => ({ ...prev, date: undefined }));
                }}
                className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
              />
              {errors.date && <p className="text-xs text-red-400">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-primary">
                Category <span className="text-red-400">*</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, categoryId: value, subcategoryId: "" }));
                  setErrors((prev) => ({ ...prev, categoryId: undefined }));
                }}
                disabled={categoriesLoading}
              >
                <SelectTrigger className={selectTriggerClasses}>
                  <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select category"} />
                </SelectTrigger>
                <SelectContent className={selectContentClasses}>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-red-400">{errors.categoryId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategoryId" className="text-primary">
                Subcategory
              </Label>
              <Select
                value={formData.subcategoryId}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, subcategoryId: value }));
                }}
                disabled={!formData.categoryId || subcategoriesLoading}
              >
                <SelectTrigger className={selectTriggerClasses}>
                  <SelectValue
                    placeholder={!formData.categoryId ? "Select category first" : "Select subcategory"}
                  />
                </SelectTrigger>
                <SelectContent className={selectContentClasses}>
                  {availableSubcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount" className="text-primary">
                Total Amount <span className="text-red-400">*</span>
              </Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0"
                value={formData.totalAmount}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, totalAmount: e.target.value }));
                  setErrors((prev) => ({ ...prev, totalAmount: undefined }));
                }}
                className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
                placeholder="0.00"
              />
              {errors.totalAmount && <p className="text-xs text-red-400">{errors.totalAmount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNumber" className="text-primary">
                Invoice Number
              </Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }));
                }}
                className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
                placeholder="Invoice number"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-primary">
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, address: e.target.value }));
                }}
                className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary min-h-[80px]`}
                placeholder="Billing address"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-primary">Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                Add Item
              </Button>
            </div>
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5 space-y-2">
                  <Input
                    placeholder="Item name"
                    value={item.item}
                    onChange={(e) => updateItem(index, "item", e.target.value)}
                    className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
                  />
                </div>
                <div className="col-span-4 space-y-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                    className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
                  />
                </div>
                <div className="col-span-1">
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItemRow(index)}
                      className="w-full"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Fields Section */}
      <Card className="glass-effect border-subtle">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-primary">Additional Information</CardTitle>
          <CardDescription>Fill in the remaining details manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="receiptType" className="text-primary">
                Receipt Type <span className="text-red-400">*</span>
              </Label>
              <Select
                value={formData.receiptType}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, receiptType: value }));
                  setErrors((prev) => ({ ...prev, receiptType: undefined }));
                }}
                disabled={false}
              >
                <SelectTrigger className={selectTriggerClasses}>
                  <SelectValue placeholder="Select receipt type" />
                </SelectTrigger>
                <SelectContent className={selectContentClasses}>
                  {receiptTypeOptions.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.receiptType && <p className="text-xs text-red-400">{errors.receiptType}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorType" className="text-primary">
                Vendor Type <span className="text-red-400">*</span>
              </Label>
              <Select
                value={formData.vendorType}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, vendorType: value }));
                  setErrors((prev) => ({ ...prev, vendorType: undefined }));
                }}
                disabled={false}
              >
                <SelectTrigger className={selectTriggerClasses}>
                  <SelectValue placeholder="Select vendor type" />
                </SelectTrigger>
                <SelectContent className={selectContentClasses}>
                  {vendorTypeOptions.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendorType && <p className="text-xs text-red-400">{errors.vendorType}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-primary">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, description: e.target.value }));
              }}
              className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary min-h-[100px]`}
              placeholder="Enter additional details about this expense..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1 sm:flex-initial border-subtle"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4 mr-2" />
              Submit Claim
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;

