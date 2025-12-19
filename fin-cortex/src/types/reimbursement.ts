/**
 * Reimbursement-related TypeScript types
 */

export interface Reimbursement {
    reimbursement_id: string;
    user_id: string | null; // Added to link to detail page
    receipt_code: string | null;
    user_name: string | null;
    amount_claimed: number;
    amount_approved: number | null;
    status: string;
    category: string | null;
    vendor_name: string | null;
    created_at: string;
    currency: string;
}

export interface ManagerReimbursementsResponse {
    success: boolean;
    data: {
        manager_id: string;
        reimbursements: Reimbursement[];
        count: number;
    };
}
