"use client";

import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Upload,
  Camera,
  X,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ScanLine,
  ReceiptText,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";

// Mock data - In real app, fetch from Supabase
const expenseCategories = [
  { id: 1, name: "Travel" },
  { id: 2, name: "Meals" },
  { id: 3, name: "Office Supplies" },
  { id: 4, name: "Training" },
  { id: 5, name: "Medical" },
  { id: 6, name: "Utilities" },
  { id: 7, name: "Client Entertainment" },
  { id: 8, name: "Software" },
  { id: 9, name: "Maintenance" },
  { id: 10, name: "Marketing" },
];

const receiptTypes = [
  { id: 1, name: "Paper Receipt" },
  { id: 2, name: "Digital Invoice" },
  { id: 3, name: "Bank Statement" },
  { id: 4, name: "Mobile Payment Screenshot" },
  { id: 5, name: "Restaurant Bill" },
  { id: 6, name: "Taxi Receipt" },
  { id: 7, name: "Medical Bill" },
  { id: 8, name: "Training Certificate" },
  { id: 9, name: "Utility Bill" },
  { id: 10, name: "Event Ticket" },
];

const vendors = [
  { id: 1, name: "Alpha Tech Supplies" },
  { id: 2, name: "DataPro Services" },
  { id: 3, name: "FinPay Systems" },
  { id: 4, name: "NextCompute" },
  { id: 5, name: "BlueLine Transport" },
  { id: 6, name: "MediPlus" },
  { id: 7, name: "EcoEnergy" },
  { id: 8, name: "AgroHub" },
  { id: 9, name: "RetailOne" },
  { id: 10, name: "LearnSoft" },
];

const paymentMethods = ["Cash", "Credit Card", "Debit Card", "UPI", "Bank Transfer", "Cheque"];

interface FormData {
  receiptCode: string;
  categoryId: string;
  subcategoryId: string;
  receiptTypeId: string;
  vendorId: string;
  paymentMethod: string;
  amountClaimed: string;
  description: string;
  expenseDate: string;
}

interface OCRData {
  vendorName?: string;
  amount?: number;
  date?: string;
  category?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}

export default function SubmitClaimPage() {
  const router = useRouter();
  const { isDarkTheme, toggleTheme, themeIcon } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrData, setOcrData] = useState<OCRData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle mobile menu toggle
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      const mobileToggle = document.getElementById('mobileToggle');
      const navLinks = document.getElementById('navLinks');
      
      if (mobileToggle && navLinks && !mobileToggle.contains(target) && !navLinks.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setIsMobileMenuOpen(false);
  };

  const [formData, setFormData] = useState<FormData>({
    receiptCode: "",
    categoryId: "",
    subcategoryId: "",
    receiptTypeId: "",
    vendorId: "",
    paymentMethod: "",
    amountClaimed: "",
    description: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });

  // Mock OCR processing - In real app, call your OCR API
  const processOCR = useCallback(async (imageFile: File) => {
    setIsProcessingOCR(true);
    
    // Simulate OCR processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Mock OCR extracted data
    const mockOcrData: OCRData = {
      vendorName: "Alpha Tech Supplies",
      amount: 1250.75,
      date: new Date().toISOString().split("T")[0],
      category: "Office Supplies",
      items: [
        { name: "Office Chair", quantity: 2, price: 450.00 },
        { name: "Desk Lamp", quantity: 1, price: 350.75 },
      ],
    };

    setOcrData(mockOcrData);
    
    // Auto-fill form with OCR data
    const matchedVendor = vendors.find(
      (v) => v.name.toLowerCase() === mockOcrData.vendorName?.toLowerCase()
    );
    const matchedCategory = expenseCategories.find(
      (c) => c.name.toLowerCase() === mockOcrData.category?.toLowerCase()
    );

    setFormData((prev) => ({
      ...prev,
      vendorId: matchedVendor?.id.toString() || "",
      categoryId: matchedCategory?.id.toString() || "",
      amountClaimed: mockOcrData.amount?.toFixed(2) || "",
      expenseDate: mockOcrData.date || prev.expenseDate,
      description: mockOcrData.items
        ?.map((item) => `${item.name} x${item.quantity}`)
        .join(", ") || "",
    }));

    setIsProcessingOCR(false);
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setErrors({ file: "Please upload an image file" });
        return;
      }

      setUploadedFile(file);
      setErrors({});
      await processOCR(file);
    },
    [processOCR]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleCameraCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (error) {
      setErrors({ camera: "Camera access denied. Please allow camera access." });
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], "captured-receipt.jpg", {
              type: "image/jpeg",
            });
            setCapturedImage(URL.createObjectURL(blob));
            setIsCameraOpen(false);
            if (videoRef.current?.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach((track) => track.stop());
            }
            await handleFileUpload(file);
          }
        }, "image/jpeg");
      }
    }
  }, [handleFileUpload]);

  const closeCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    if (!formData.receiptTypeId) newErrors.receiptTypeId = "Receipt type is required";
    if (!formData.amountClaimed || parseFloat(formData.amountClaimed) <= 0) {
      newErrors.amountClaimed = "Valid amount is required";
    }
    if (!formData.expenseDate) newErrors.expenseDate = "Expense date is required";
    if (!uploadedFile && !capturedImage) {
      newErrors.file = "Please upload or capture a receipt";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    // TODO: Submit to Supabase
    // In real app, create reimbursement record and upload attachment
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Redirect to dashboard after success
    router.push("/user/dashboard");
  };

  return (
    <div className="flex min-h-[calc(100vh-0px)] w-full">
      {/* Navbar - Logo left, centered menu, theme toggle right */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar">
        <div className="nav-container" style={{ justifyContent: 'space-between' }}>
          {/* Left side - Logo */}
          <Link href="/user/dashboard" className="logo">
            Fincortex
          </Link>

          {/* Center - Menu items */}
          <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`} id="navLinks" style={{ margin: '0 auto', gap: '2.5rem' }}>
            <li><Link href="/user/dashboard" onClick={handleLinkClick}>Dashboard</Link></li>
            <li><Link href="/user/claims/new" onClick={handleLinkClick}>Submit Claims</Link></li>
            <li><Link href="/user/claims/history" onClick={handleLinkClick}>Claim History</Link></li>
            <li><Link href="/user/profile" onClick={handleLinkClick}>Profile</Link></li>
          </ul>

          {/* Right side - Theme toggle and Mobile toggle */}
          <div className="flex items-center gap-4">
            <button className="theme-toggle" onClick={toggleTheme}>
              <div className="theme-icon">{themeIcon}</div>
            </button>
            <button 
              className={`mobile-toggle ${isMobileMenuOpen ? 'active' : ''}`}
              id="mobileToggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex min-h-[100dvh] flex-1 flex-col pt-20">
        {/* Page Header with Icon */}
        <div className="border-b border-subtle glass-effect px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <ReceiptText className="size-6 md:size-7 text-primary" />
            <div>
              <h1 className="text-lg md:text-xl font-bold text-primary">Submit New Claim</h1>
              <p className="text-xs md:text-sm text-muted">Upload receipt and fill claim details</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            {/* Receipt Upload Section */}
            <Card className="glass-effect border-subtle">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl text-primary">Receipt Upload</CardTitle>
                <CardDescription>Upload a receipt image or scan using your camera</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!uploadedFile && !capturedImage && !isCameraOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Upload Button */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-subtle rounded-xl bg-[#233648]/30 hover:bg-[#233648]/50 cursor-pointer transition-all hover:border-primary/50"
                    >
                      <Upload className="size-12 text-primary mb-4" />
                      <p className="text-sm font-medium text-primary mb-1">Upload Receipt</p>
                      <p className="text-xs text-muted text-center">Click to select or drag and drop</p>
                      <p className="text-xs text-muted mt-2">PNG, JPG up to 10MB</p>
                    </div>

                    {/* Camera Button */}
                    <div
                      onClick={handleCameraCapture}
                      className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-subtle rounded-xl bg-[#233648]/30 hover:bg-[#233648]/50 cursor-pointer transition-all hover:border-primary/50"
                    >
                      <Camera className="size-12 text-primary mb-4" />
                      <p className="text-sm font-medium text-primary mb-1">Scan with Camera</p>
                      <p className="text-xs text-muted text-center">Capture receipt using your device camera</p>
                    </div>
                  </div>
                )}

                {/* Camera View */}
                {isCameraOpen && (
                  <div className="relative space-y-4">
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 border-4 border-primary/50 rounded-xl pointer-events-none" />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        <Camera className="size-4 mr-2" />
                        Capture
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeCamera}
                        className="flex-1"
                      >
                        <X className="size-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Uploaded/Captured Image Preview */}
                {(uploadedFile || capturedImage) && (
                  <div className="relative">
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                      <img
                        src={capturedImage || (uploadedFile ? URL.createObjectURL(uploadedFile) : "")}
                        alt="Receipt"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setCapturedImage(null);
                          setOcrData(null);
                          setFormData((prev) => ({
                            ...prev,
                            vendorId: "",
                            categoryId: "",
                            amountClaimed: "",
                          }));
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
                    {ocrData && !isProcessingOCR && (
                      <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="size-5 text-emerald-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-emerald-400 mb-2">
                              Receipt data extracted successfully!
                            </p>
                            <div className="text-xs text-muted space-y-1">
                              <p>Vendor: {ocrData.vendorName}</p>
                              <p>Amount: ₹{ocrData.amount?.toFixed(2)}</p>
                              <p>Date: {ocrData.date}</p>
                            </div>
                          </div>
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

            {/* Claim Details Form */}
            <Card className="glass-effect border-subtle">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl text-primary">Claim Details</CardTitle>
                <CardDescription>Review and edit the extracted information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="categoryId" className="text-primary">
                      Expense Category <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => {
                        setFormData((prev) => ({ ...prev, categoryId: value, subcategoryId: "" }));
                        setErrors((prev) => ({ ...prev, categoryId: "" }));
                      }}
                    >
                      <SelectTrigger className={`w-full ${isDarkTheme ? 'bg-[#233648]' : 'bg-white/90'} border-subtle text-primary`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className={`${isDarkTheme ? 'bg-[#233648]' : 'bg-white/95'} backdrop-blur-lg border-subtle z-[100] opacity-100`}>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && (
                      <p className="text-xs text-red-400">{errors.categoryId}</p>
                    )}
                  </div>

                  {/* Receipt Type */}
                  <div className="space-y-2">
                    <Label htmlFor="receiptTypeId" className="text-primary">
                      Receipt Type <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={formData.receiptTypeId}
                      onValueChange={(value) => {
                        setFormData((prev) => ({ ...prev, receiptTypeId: value }));
                        setErrors((prev) => ({ ...prev, receiptTypeId: "" }));
                      }}
                    >
                      <SelectTrigger className={`w-full ${isDarkTheme ? 'bg-[#233648]' : 'bg-white/90'} border-subtle text-primary`}>
                        <SelectValue placeholder="Select receipt type" />
                      </SelectTrigger>
                      <SelectContent className={`${isDarkTheme ? 'bg-[#233648]' : 'bg-white/95'} backdrop-blur-lg border-subtle z-[100] opacity-100`}>
                        {receiptTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.receiptTypeId && (
                      <p className="text-xs text-red-400">{errors.receiptTypeId}</p>
                    )}
                  </div>

                  {/* Vendor */}
                  <div className="space-y-2">
                    <Label htmlFor="vendorId" className="text-primary">
                      Vendor
                    </Label>
                    <Select
                      value={formData.vendorId}
                      onValueChange={(value) => {
                        setFormData((prev) => ({ ...prev, vendorId: value }));
                      }}
                    >
                      <SelectTrigger className={`w-full ${isDarkTheme ? 'bg-[#233648]' : 'bg-white/90'} border-subtle text-primary`}>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent className={`${isDarkTheme ? 'bg-[#233648]' : 'bg-white/95'} backdrop-blur-lg border-subtle z-[100] opacity-100`}>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod" className="text-primary">
                      Payment Method
                    </Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => {
                        setFormData((prev) => ({ ...prev, paymentMethod: value }));
                      }}
                    >
                      <SelectTrigger className={`w-full ${isDarkTheme ? 'bg-[#233648]' : 'bg-white/90'} border-subtle text-primary`}>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent className={`${isDarkTheme ? 'bg-[#233648]' : 'bg-white/95'} backdrop-blur-lg border-subtle z-[100] opacity-100`}>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amountClaimed" className="text-primary">
                      Amount Claimed (₹) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="amountClaimed"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amountClaimed}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, amountClaimed: e.target.value }));
                        setErrors((prev) => ({ ...prev, amountClaimed: "" }));
                      }}
                      className={`${isDarkTheme ? 'bg-[#233648]' : 'bg-white/90'} border-subtle text-primary placeholder:text-muted-foreground`}
                      placeholder="0.00"
                    />
                    {errors.amountClaimed && (
                      <p className="text-xs text-red-400">{errors.amountClaimed}</p>
                    )}
                  </div>

                  {/* Expense Date */}
                  <div className="space-y-2">
                    <Label htmlFor="expenseDate" className="text-primary">
                      Expense Date <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={formData.expenseDate}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, expenseDate: e.target.value }));
                        setErrors((prev) => ({ ...prev, expenseDate: "" }));
                      }}
                      className={`${isDarkTheme ? 'bg-[#233648]' : 'bg-white/90'} border-subtle text-primary`}
                    />
                    {errors.expenseDate && (
                      <p className="text-xs text-red-400">{errors.expenseDate}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
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
                    className={`${isDarkTheme ? 'bg-[#233648]' : 'bg-white/90'} border-subtle text-primary min-h-[100px] placeholder:text-muted-foreground`}
                    placeholder="Enter additional details about this expense..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 sm:flex-initial border-subtle"
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
        </div>
      </main>
    </div>
  );
}

