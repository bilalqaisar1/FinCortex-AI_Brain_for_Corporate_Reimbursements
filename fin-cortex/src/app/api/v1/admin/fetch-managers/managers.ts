/**
 * API client for fetching managers by admin
 */

import { ManagersResponse } from '@/types/user';
import { BACKEND_URL } from '@/lib/config';

/**
 * Fetch all managers for a given admin
 * @param adminId - UUID of the admin
 * @returns Promise with managers data
 */
export async function fetchAdminManagers(adminId: string): Promise<ManagersResponse> {
    try {
        const url = `${BACKEND_URL}/api/v1/rpc/managers-by-admin?admin_id=${encodeURIComponent(adminId)}`;

        console.log('📤 Fetching managers for admin:', adminId);

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

        const data: ManagersResponse = await response.json();

        console.log('✅ Managers fetched successfully:', {
            count: data.data?.count || 0,
            admin_id: data.data?.admin_id,
        });

        return data;
    } catch (error) {
        console.error('❌ Error fetching managers:', error);
        throw error;
    }
}
