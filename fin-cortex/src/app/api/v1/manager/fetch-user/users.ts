/**
 * API client for user-related operations
 */

import { TeamMembersResponse } from '@/types/user';
import { BACKEND_URL } from '@/lib/config';

/**
 * Fetch all team members for a given manager
 * @param managerId - UUID of the manager
 * @returns Promise with team members data
 */
export async function fetchTeamMembers(managerId: string): Promise<TeamMembersResponse> {
    try {
        const url = `${BACKEND_URL}/api/v1/rpc/users-by-manager?manager_id=${encodeURIComponent(managerId)}`;
        console.log('� [fetchTeamMembers] Calling URL:', url); // One-liner log to confirm API call

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`❌ [fetchTeamMembers] Failed with status: ${response.status} ${response.statusText}`);
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data: TeamMembersResponse = await response.json();
        console.log(`✅ [fetchTeamMembers] Success! Fetched ${data.data?.users?.length || 0} users.`);

        return data;
    } catch (error) {
        console.error('❌ Error fetching team members:', error);
        throw error;
    }
}
