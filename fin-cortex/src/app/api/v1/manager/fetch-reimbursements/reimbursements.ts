/**
 * API client for reimbursement-related operations
 */

import { ManagerReimbursementsResponse } from '@/types/reimbursement';
import { BACKEND_URL } from '@/lib/config';

/**
 * Fetch all reimbursements for a given manager
 * @param managerId - UUID of the manager
 * @returns Promise with reimbursements data
 */
export async function fetchManagerReimbursements(managerId: string): Promise<ManagerReimbursementsResponse> {
    try {
        const url = `${BACKEND_URL}/api/v1/rpc/reimbursements-by-manager?manager_id=${encodeURIComponent(managerId)}`;

        console.log('📤 Fetching reimbursements for manager:', managerId);

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

        const data: ManagerReimbursementsResponse = await response.json();

        console.log('✅ Reimbursements fetched successfully:', {
            count: data.data?.count || 0,
            manager_id: data.data?.manager_id,
        });

        return data;
    } catch (error) {
        console.error('❌ Error fetching reimbursements:', error);
        throw error;
    }
}
