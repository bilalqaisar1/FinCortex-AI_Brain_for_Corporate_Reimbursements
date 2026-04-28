/**
 * Detailed Reimbursement Types
 */

export interface Attachment {
    attachment_id: number;
    file_name: string;
    file_path: string;
    file_type: string;
    uploaded_at: string;
}

export interface ReimbursementItem {
    item_id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface ReimbursementDetail {
    reimbursement_id: string;
    receipt_code: string;
    payment_method: string;
    amount_claimed: number;
    amount_approved: number | null;
    currency: string;
    description: string;
    ocr_confidence: number | null;
    status: string;
    created_at: string;
    reviewed_at: string | null;
    invoice_number: string;
    expense_date: string;

    // User
    user_id: string;
    full_name: string;
    email: string;
    employee_code: string;
    phone_number: string;

    // Manager
    manager_id: string;
    manager_name: string;

    // Company
    company_id: string;
    company_name: string;

    // Department
    department_id: number | null;
    department_name: string | null;

    // Category
    category_id: number | null;
    category_name: string | null;

    // Subcategory
    subcategory_id: number | null;
    subcategory_name: string | null;

    // Vendor
    vendor_id: number | null;
    vendor_name: string | null;

    // Receipt Type
    receipt_type_id: number | null;
    type_name: string | null;

    // Nested Data
    attachments: Attachment[];
    items: ReimbursementItem[];

    // Policy Flags (violations)
    policy_flags?: Array<{
        code: string;
        message: string;
        severity: string;
    }>;
    ml_model_confidence_score?: number | null;
}

export interface ReimbursementDetailResponse {
    success: boolean;
    data: ReimbursementDetail;
}
