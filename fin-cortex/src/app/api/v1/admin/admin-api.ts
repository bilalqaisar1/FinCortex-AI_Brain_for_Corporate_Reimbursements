/**
 * Admin API client for fetching dashboard stats, pending approvals, and recent activity.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface AdminStats {
    company_name?: string;
    total_claims: {
        value: number;
        change: string;
        description: string;
    };
    pending_approvals: {
        value: number;
        change: string;
        description: string;
    };
    budget_utilization: {
        value: number;
        change: string;
        description: string;
    };
    policy_violations: {
        value: number;
        change: string;
        description: string;
    };
}

export interface PendingApproval {
    id: string;
    reimbursement_id: string;
    user: string;
    amount: string;
    category: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    submitted: string;
}

export interface RecentActivity {
    action: string;
    user: string;
    amount: string;
    time: string;
    type: 'submission' | 'approval' | 'rejection' | 'other';
}

export async function fetchAdminStats(adminId?: string): Promise<AdminStats> {
    const url = new URL(`${BACKEND_URL}/api/v1/admin/stats`);
    if (adminId) url.searchParams.append('admin_id', adminId);

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
    }
    const result = await response.json();
    return result.data;
}

export async function fetchPendingApprovals(adminId?: string): Promise<PendingApproval[]> {
    const url = new URL(`${BACKEND_URL}/api/v1/admin/pending-approvals`);
    if (adminId) url.searchParams.append('admin_id', adminId);

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error('Failed to fetch pending approvals');
    }
    const result = await response.json();
    return result.data || [];
}

export async function fetchRecentActivity(adminId?: string): Promise<RecentActivity[]> {
    const url = new URL(`${BACKEND_URL}/api/v1/admin/recent-activity`);
    if (adminId) url.searchParams.append('admin_id', adminId);

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error('Failed to fetch recent activity');
    }
    const result = await response.json();
    return result.data || [];
}
