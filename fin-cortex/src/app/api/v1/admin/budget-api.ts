/**
 * Budget API client for managing company budgets.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface Budget {
    budget_id: string;
    company_id: string;
    company_name: string;
    total_amount: number;
    used_amount: number;
    remaining_amount: number;
    utilization_percentage: number;
    monthly_limit: number;
    monthly_used: number;
    status: 'healthy' | 'warning' | 'critical';
    currency: string;
    last_updated: string;
}

export interface CreateBudgetInput {
    company_id?: string;
    company_name: string;
    total_amount: number;
    monthly_limit?: number;
    currency?: string;
}

export interface UpdateBudgetInput {
    total_amount?: number;
    monthly_limit?: number;
    company_name?: string;
}

export async function fetchBudgets(): Promise<Budget[]> {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/budgets`);
    if (!response.ok) {
        throw new Error('Failed to fetch budgets');
    }
    const result = await response.json();
    return result.data || [];
}

export async function createBudget(data: CreateBudgetInput): Promise<Budget> {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to create budget');
    }
    const result = await response.json();
    return result.data;
}

export async function updateBudget(id: string, data: UpdateBudgetInput): Promise<Budget> {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/budgets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to update budget');
    }
    const result = await response.json();
    return result.data;
}

export async function addFundsToBudget(id: string, amount: number, notes?: string): Promise<Budget> {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/budgets/${id}/add-funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, notes }),
    });
    if (!response.ok) {
        throw new Error('Failed to add funds');
    }
    const result = await response.json();
    return result.data;
}

export async function deleteBudget(id: string): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/budgets/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete budget');
    }
}
