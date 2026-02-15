/**
 * API client for detail reimbursement-related operations
 */

import { ReimbursementDetailResponse } from '@/types/reimbursement-detail';
import { BACKEND_URL } from '@/lib/config';

/**
 * Fetch full details of a specific reimbursement
 * @param managerId - UUID of the manager
 * @param userId - UUID of the user (owner of reimbursement)
 * @param reimbursementId - UUID of the reimbursement
 * @returns Promise with full reimbursement details
 */
export async function fetchReimbursementDetail(
    managerId: string,
    userId: string,
    reimbursementId: string
): Promise<ReimbursementDetailResponse> {
    try {
        const url = `${BACKEND_URL}/api/v1/rpc/reimbursement-detail?manager_id=${encodeURIComponent(managerId)}&user_id=${encodeURIComponent(userId)}&reimbursement_id=${encodeURIComponent(reimbursementId)}`;

        console.log('📤 Fetching reimbursement detail:', reimbursementId);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data: ReimbursementDetailResponse = await response.json();

        console.log('✅ Reimbursement detail fetched successfully');

        return data;
    } catch (error) {
        console.error('❌ Error fetching reimbursement detail:', error);
        throw error;
    }
}
