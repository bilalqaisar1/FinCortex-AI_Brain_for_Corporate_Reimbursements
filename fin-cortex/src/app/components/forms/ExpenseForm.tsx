"use client";

import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Info, Receipt, FileText, LayoutGrid, ListPlus, Send, Sparkles, Plus, Tag, Ban, DollarSign } from "lucide-react";
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
import { useToastNotification } from "@/hooks/useToastNotification";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL, getApiUrl } from "@/lib/config";

const RECEIPT_UPLOAD_ENDPOINT = getApiUrl('/api/v1/receipt/upload');
const RECEIPT_CODE_ENDPOINT = getApiUrl('/api/v1/receipt-code/generate');

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
  items: Array<{ item: string; price: string; quantity: string; category?: string; subcategory?: string; reimbursable?: boolean; rejection_reason?: string | null }>;
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

interface OCRData {
  "Vendor Name"?: string;
  Date?: string;
  Categories?: string | string[];
  Subcategories?: string | string[];
  items?: Array<{ item: string; price: string; quantity?: string; category?: string; subcategory?: string; category_id?: number | null; subcategory_id?: number | null; reimbursable?: boolean; rejection_reason?: string | null }>;
  Address?: string;
  "Total Amount"?: string;
  "Invoice Number"?: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ isDarkTheme }) => {
  const router = useRouter();
  const { user, userProfile } = useAuth();
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
    items: [{ item: "", price: "", quantity: "", category: "", subcategory: "", reimbursable: true, rejection_reason: null }],
    receiptType: "",
    vendorType: "",
    description: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrData, setOcrData] = useState<OCRData | null>(null);
  const [ocrRawText, setOcrRawText] = useState<string>("");
  const [ocrStructured, setOcrStructured] = useState<OCRData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showReviewMessage, setShowReviewMessage] = useState(false);
  const [policyFlags, setPolicyFlags] = useState<any[]>([]);

  // Derived read-only category/subcategory from GPT/OCR; kept in formData for payload consistency
  // Derived read-only category/subcategory from GPT/OCR; shown on form (read-only)
  const detectedCategory = React.useMemo(() => {
    if (!ocrStructured) return "";
    const data = ocrStructured as any;
    // Check both CamelCase/PascalCase (old) and snake_case (new)
    const cat = data?.Categories || data?.category;
    if (Array.isArray(cat)) return cat.filter(Boolean).join(", ");
    return cat ? String(cat) : "";
  }, [ocrStructured]);

  const detectedSubcategory = React.useMemo(() => {
    if (!ocrStructured) return "";
    const data = ocrStructured as any;
    // Check both CamelCase/PascalCase (old) and snake_case (new)
    const sub = data?.Subcategories || data?.sub_category || data?.subcategory;
    if (Array.isArray(sub)) return sub.filter(Boolean).join(", ");
    return sub ? String(sub) : "";
  }, [ocrStructured]);

  // Categories/Subcategories are resolved server-side (via GPT + admin scope); no frontend dropdowns.

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
    } catch { }
    return "";
  };

  const normalizeStringArray = (value?: string | string[]): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(/[,;|]/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
    return [];
  };

  // Auto-fill form from OCR data (categories handled server-side; no frontend matching/creation)
  useEffect(() => {
    if (!ocrData) return;

    const autoFillForm = async () => {
      // First, update non-async fields
      setFormData((prev) => {
        const updated = { ...prev };
        const data = ocrData as any; // Cast to any to handle flexible key access

        // Vendor Name - check both Title Case and snake_case
        if (data["Vendor Name"] || data.vendor_name) {
          updated.vendorName = String(data["Vendor Name"] || data.vendor_name).trim();
        }

        // Date - improved parsing
        if (data.Date || data.date) {
          const parsedDate = parseDate(String(data.Date || data.date));
          if (parsedDate) {
            updated.date = parsedDate;
          }
        }

        // Address
        if (data.Address || data.address) {
          updated.address = String(data.Address || data.address).trim();
        }

        // Total Amount - improved parsing
        // Check "Total Amount" (old) or "total_bill" (new) or "total_amount"
        if (data["Total Amount"] || data.total_bill || data.total_amount) {
          const amountVal = data["Total Amount"] || data.total_bill || data.total_amount;
          const parsedAmount = parseAmount(String(amountVal));
          if (parsedAmount) {
            updated.totalAmount = parsedAmount;
          }
        }

        // Invoice Number
        if (data["Invoice Number"] || data.invoice_number) {
          updated.invoiceNumber = String(data["Invoice Number"] || data.invoice_number).trim();
        }

        // Items - improved parsing with per-item category
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          updated.items = data.items.map((item: any) => ({
            item: String(item.item || item.item_name || "").trim(),
            price: parseAmount(String(item.price || "")),
            quantity: item.quantity ? String(item.quantity).trim() : "1",
            category: String(item.category || "").trim(),
            subcategory: String(item.subcategory || "").trim(),
            reimbursable: item.is_reimbursable !== undefined ? item.is_reimbursable : (item.reimbursable !== false),
            rejection_reason: item.rejection_reason || null,
          })).filter((item: any) => item.item || item.price); // Remove empty items
        }

        return updated;
      });

      setShowReviewMessage(true);
    };

    void autoFillForm();
  }, [ocrData, showToast]);

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

        // Pass admin_uuid so the backend can fetch categories for GPT context
        // Priority: admin_id > user_id (if admin role) > undefined
        let adminUuid: string | undefined;
        if (userProfile?.admin_id) {
          adminUuid = userProfile.admin_id;
        } else if (userProfile?.userRole === 'admin' && userProfile?.user_id) {
          // If user is an admin but admin_id is not set, use user_id as admin_uuid
          adminUuid = userProfile.user_id;
        }

        // Debug logging
        console.log("🔍 ExpenseForm - userProfile state:", {
          hasUserProfile: !!userProfile,
          admin_id: userProfile?.admin_id,
          user_id: userProfile?.user_id,
          userRole: userProfile?.userRole,
          determined_adminUuid: adminUuid
        });

        if (adminUuid) {
          body.append("admin_uuid", adminUuid);
          console.log("📤 Sending admin_uuid to backend:", adminUuid);
        } else {
          console.log("⚠️ No admin_uuid available - categories will not be scoped");
          console.log("⚠️ userProfile details:", JSON.stringify(userProfile, null, 2));
        }

        const response = await fetch(RECEIPT_UPLOAD_ENDPOINT, {
          method: "POST",
          body,
        });

        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.detail || payload?.message || "Failed to process receipt");
        }

        const structured = payload.data?.structured || {};
        const rawText = payload.data?.raw_text || "";
        const flags = payload.data?.policy_flags || [];
        setOcrData(structured);
        setOcrStructured(structured);
        setOcrRawText(rawText);
        setPolicyFlags(flags);

        if (flags.length > 0) {
          showToast("warning", "Policy Flags Detected", "Some potential policy violations were detected. Please review.");
        } else {
          showToast("success", "Receipt Processed", "Fields have been auto-filled. Please review and make corrections if needed.");
        }
      } catch (error) {
        console.error("OCR processing failed", error);
        showToast("error", "Processing Failed", "Unable to extract data from receipt. Please try again.");
      } finally {
        setIsProcessingOCR(false);
      }
    },
    [showToast, userProfile]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        showToast("error", "Invalid File", "Please upload an image file");
        return;
      }
      setUploadedFile(file);
      setOcrData(null);
      setOcrRawText("");
      setOcrStructured(null);
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
      items: [...prev.items, { item: "", price: "", quantity: "", category: "", subcategory: "", reimbursable: true, rejection_reason: null }],
    }));
  };

  const removeItemRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: "item" | "price" | "quantity" | "category" | "subcategory", value: string) => {
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

    if (!user?.id) {
      showToast("error", "Authentication Error", "You must be signed in to submit a claim");
      return;
    }

    if (!BACKEND_URL) {
      showToast("error", "Configuration Error", "Backend URL not configured");
      return;
    }

    setIsSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append("receipt_code", formData.receiptCode);
      formPayload.append("user_id", user.id);
      formPayload.append("vendor_name", formData.vendorName);
      formPayload.append("expense_date", formData.date);
      if (formData.categoryId) {
        formPayload.append("category_id", formData.categoryId);
      }
      if (formData.subcategoryId) {
        formPayload.append("subcategory_id", formData.subcategoryId);
      }
      formPayload.append("receipt_type_id", formData.receiptType);
      formPayload.append("vendor_type", formData.vendorType);
      formPayload.append("amount_claimed", formData.totalAmount);
      if (formData.invoiceNumber) {
        formPayload.append("invoice_number", formData.invoiceNumber);
      }
      if (formData.address) {
        formPayload.append("address", formData.address);
      }
      if (formData.description) {
        formPayload.append("description", formData.description);
      }
      if (!uploadedFile) {
        throw new Error("Receipt file is required");
      }
      formPayload.append("receipt_file", uploadedFile);

      // Add items as JSON string
      const itemsData = formData.items
        .filter((item) => item.item || item.price)
        .map((item) => ({
          item: item.item,
          price: item.price,
          quantity: item.quantity || "1",
        }));
      formPayload.append("items", JSON.stringify(itemsData));

      // Add OCR data if available
      if (ocrRawText) {
        formPayload.append("ocr_raw_text", ocrRawText);
      }
      if (ocrStructured) {
        formPayload.append("ocr_structured", JSON.stringify(ocrStructured));
      }

      const response = await fetch(`${BACKEND_URL}/api/v1/reimbursements`, {
        method: "POST",
        body: formPayload,
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.detail || payload?.message || "Failed to submit reimbursement");
      }

      showToast("success", "Claim Submitted", "Your reimbursement claim has been submitted successfully.");

      // Build invoice data and redirect to invoice page
      const invoiceData = {
        reimbursement_id: payload.data?.reimbursement_id,
        receipt_code: payload.data?.receipt_code || formData.receiptCode,
        vendor_name: formData.vendorName,
        date: formData.date,
        total_amount: formData.totalAmount,
        invoice_number: formData.invoiceNumber,
        category: detectedCategory,
        subcategory: detectedSubcategory,
        address: formData.address,
        description: formData.description,
        items: formData.items,
        user_name: userProfile?.full_name || "",
        user_email: userProfile?.email || "",
        employee_code: userProfile?.employee_code || "",
        department: userProfile?.departments?.department_name || "",
        manager: userProfile?.managers?.full_name || "",
        receipt_type: receiptTypeOptions.find(r => r.id === formData.receiptType)?.label || "",
        vendor_type: vendorTypeOptions.find(v => v.id === formData.vendorType)?.label || "",
        policy_flags: policyFlags,
      };

      // Store invoice data in sessionStorage for the invoice page
      sessionStorage.setItem("invoiceData", JSON.stringify(invoiceData));
      router.push(`/user/claims/invoice/${payload.data?.reimbursement_id || "new"}`);
    } catch (error) {
      console.error("Submission failed", error);
      showToast("error", "Submission Failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectTriggerClasses = `${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`;
  const selectContentClasses = `${isDarkTheme ? "bg-[#233648]" : "bg-white/95"} backdrop-blur-lg border-subtle z-[100]`;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Receipt Upload Section */}
      <Card className="glass-effect-hover border-subtle overflow-hidden relative group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="size-5 text-primary" />
            <CardTitle className="text-lg md:text-xl text-primary">Receipt Upload</CardTitle>
          </div>
          <CardDescription>Upload a receipt image to auto-fill form fields using AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          {!uploadedFile && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-subtle rounded-xl bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all hover:border-primary/50 group/upload"
            >
              <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover/upload:scale-110 transition-transform">
                <Upload className="size-8 text-primary" />
              </div>
              <p className="text-sm font-bold text-primary mb-1">Upload Receipt</p>
              <p className="text-xs text-muted text-center max-w-[200px]">Click to select or drag and drop PNG, JPG up to 10MB</p>

              {/* Subtle animated border effect on hover */}
              <div className="absolute inset-0 rounded-xl border-2 border-primary/0 group-hover/upload:border-primary/20 transition-all pointer-events-none" />
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
                    setOcrRawText("");
                    setOcrStructured(null);
                    setShowReviewMessage(false);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-500 rounded-full text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
              {isProcessingOCR && (
                <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3 relative z-10 animate-pulse">
                  <Loader2 className="size-5 text-primary mt-0.5 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary mb-0.5">
                      Processing receipt with OCR...
                    </p>
                    <p className="text-xs text-muted">
                      AI is analyzing your document to automatically extract merchant, date, and amount details.
                    </p>
                  </div>
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
        <Card className="glass-effect border-emerald-500/20 bg-emerald-500/10 relative z-50 animate-bounce-in">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-full">
                <CheckCircle2 className="size-4 text-emerald-400" />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-bold text-emerald-400 mb-0.5">
                  Review the fields below and make corrections if needed
                </p>
                <p className="text-xs text-muted">
                  AI has auto-filled the form from your receipt. Please verify and edit any incorrect information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Engine Warnings */}
      {policyFlags.length > 0 && (
        <Card className="glass-effect border-red-500/30 bg-red-500/10 relative z-50 animate-pulse-slow">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-500 mb-2">
                  Policy Violations Detected
                </p>
                <ul className="space-y-2">
                  {policyFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                      <div className={`size-1.5 rounded-full mt-1.5 shrink-0 ${flag.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`} />
                      <span>{flag.message}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 p-2 bg-red-500/20 rounded border border-red-500/30">
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                    IMPORTANT: Flagged claims may require additional manager justification or could be automatically rejected based on company policy.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-filled Fields Section */}
      <Card className="glass-effect border-subtle relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="size-20 text-primary" />
        </div>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="size-5 text-primary" />
            <CardTitle className="text-lg md:text-xl text-primary">Extracted Details</CardTitle>
          </div>
          <CardDescription>Verify the information extracted by AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
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

            {/* Read-only detected categories/subcategories (from OCR/GPT, before upload) */}
            <div className="space-y-2">
              <Label className="text-primary">Detected Category (read-only)</Label>
              <Input
                value={detectedCategory}
                readOnly
                placeholder="(filled by OCR/GPT)"
                className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-primary">Detected Subcategory (read-only)</Label>
              <Input
                value={detectedSubcategory}
                readOnly
                placeholder="(filled by OCR/GPT)"
                className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
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
          <div className="space-y-4 pt-4 border-t border-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="size-4 text-primary/70" />
                <Label className="text-sm font-bold text-primary">Itemized Breakdown</Label>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                <span className="opacity-50">Missing an item?</span>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-primary hover:text-white transition-colors flex items-center gap-1"
                >
                  <Plus className="size-2.5" />
                  <span>Manually Insert Item</span>
                </button>
              </div>
            </div>

            {/* Reimbursable Items */}
            {formData.items.filter(i => i.reimbursable !== false).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Reimbursable Items</span>
                </div>
                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 px-3">
                  <div className="col-span-5">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Item Name</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Qty</span>
                  </div>
                  <div className="col-span-4">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Price</span>
                  </div>
                  <div className="col-span-1"></div>
                </div>
                {formData.items.map((item, index) => {
                  if (item.reimbursable === false) return null;
                  return (
                    <div key={index} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5 space-y-1">
                          <Input
                            placeholder="Item name"
                            value={item.item}
                            onChange={(e) => updateItem(index, "item", e.target.value)}
                            className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                            className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary`}
                          />
                        </div>
                        <div className="col-span-4 space-y-1">
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
                      {/* Category badge */}
                      {(item.category || item.subcategory) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.category && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                              <Tag className="size-2.5" />
                              {item.category}
                            </span>
                          )}
                          {item.subcategory && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {item.subcategory}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Non-Reimbursable Items */}
            {formData.items.filter(i => i.reimbursable === false).length > 0 && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <Ban className="size-3.5 text-red-400" />
                  <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Not Reimbursable</span>
                </div>
                {formData.items.map((item, index) => {
                  if (item.reimbursable !== false) return null;
                  return (
                    <div key={index} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2 opacity-75">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5 space-y-1">
                          <Input
                            placeholder="Item name"
                            value={item.item}
                            onChange={(e) => updateItem(index, "item", e.target.value)}
                            className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary line-through`}
                            readOnly
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary line-through`}
                            readOnly
                          />
                        </div>
                        <div className="col-span-4 space-y-1">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={item.price}
                            className={`${isDarkTheme ? "bg-[#233648]" : "bg-white/90"} border-subtle text-primary line-through`}
                            readOnly
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItemRow(index)}
                            className="w-full text-red-400"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                      {/* Category badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <Ban className="size-2.5" />
                          {item.rejection_reason || `${item.category || "Not categorized"} — Not Allowed`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reimbursable Total */}
            {formData.items.length > 0 && (
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-subtle">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-primary">Reimbursable Total</span>
                </div>
                <span className="text-lg font-bold text-emerald-400">
                  PKR {formData.items
                    .filter(i => i.reimbursable !== false)
                    .reduce((sum, i) => sum + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 1), 0)
                    .toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manual Fields Section */}
      <Card className="glass-effect border-subtle">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <ListPlus className="size-5 text-primary" />
            <CardTitle className="text-lg md:text-xl text-primary">Additional Information</CardTitle>
          </div>
          <CardDescription>Categorize and describe your expense</CardDescription>
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

      {/* Submit Button Section */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="w-full sm:w-auto order-2 sm:order-1 text-muted hover:text-primary transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:min-w-[200px] order-1 sm:order-2 h-12 relative overflow-hidden group shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
        >
          {/* Custom Gradient Background */}
          <div className="absolute inset-0 bg-primary-gradient group-hover:opacity-90 transition-opacity" />

          <div className="relative z-10 flex items-center justify-center gap-2 font-bold text-white">
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="size-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                <span>Submit Claim</span>
              </>
            )}
          </div>
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;

